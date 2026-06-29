import { NextResponse } from 'next/server';
import exifr from 'exifr';
import { getDistance } from '@/lib/geo/distance';
import { uploadImageToS3 } from '@/lib/aws/s3';
import { uploadToIpfs, type IpfsUploadResult } from '@/lib/ipfs/upload';
import { encryptGpsCoordinates } from '@/lib/zk/locationProof';
import { sendPhotoUploadedEmail } from '@/lib/email/sendgrid';
import { getPool } from '@/lib/db/client';
import { encodeGeohash } from '@/lib/geo/geohash';

const MAX_DISTANCE_METERS = 500;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File | null;
    const latStr = formData.get('lat') as string | null;
    const lonStr = formData.get('lon') as string | null;
    const farmerId = formData.get('farmerId') as string | null;
    const treeId = formData.get('treeId') as string | null;
    const sponsorEmail = formData.get('sponsorEmail') as string | null;
    const sponsorName = formData.get('sponsorName') as string | null;
    const region = (formData.get('region') as string | null) ?? 'unknown';

    if (!photo || !latStr || !lonStr || !farmerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates formats' }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());

    const exifData = await exifr.gps(buffer).catch((err) => {
      console.warn('Exifr extraction warning:', err);
      return null;
    });

    if (exifData && exifData.latitude !== undefined && exifData.longitude !== undefined) {
      const { latitude: exifLat, longitude: exifLon } = exifData;
      const distance = getDistance(lat, lon, exifLat, exifLon);
      if (distance > MAX_DISTANCE_METERS) {
        return NextResponse.json(
          {
            error:
              'Verification failed: Distance between photo GPS and submitted coordinates is too large.',
            distanceMeters: Math.round(distance),
          },
          { status: 422 }
        );
      }
    }

    const encryptedGps = await encryptGpsCoordinates({ lat, lon });

    let s3Key: string | undefined;
    try {
      s3Key = await uploadImageToS3(farmerId, buffer, photo.type);
    } catch (err) {
      console.warn('[planting/photo] S3 upload failed, continuing with IPFS only:', err);
    }

    let ipfsResult: IpfsUploadResult | undefined;
    try {
      ipfsResult = await uploadToIpfs(
        new Uint8Array(buffer),
        `${farmerId}-${Date.now()}.jpg`,
        photo.type
      );
    } catch (err) {
      console.warn('[planting/photo] IPFS upload failed:', err);
      if (!s3Key) {
        return NextResponse.json(
          { error: 'Failed to upload photo to any storage' },
          { status: 500 }
        );
      }
    }

    const geohash = encodeGeohash(lat, lon, 5);
    await getPool()
      .query(
        `INSERT INTO tree_map_points (geohash, region, tree_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (geohash) DO UPDATE
           SET tree_count   = tree_map_points.tree_count + 1,
               last_updated = NOW()`,
        [geohash, region]
      )
      .catch((err) => console.error('[planting/photo] map upsert error:', err));

    if (sponsorEmail && sponsorName && treeId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const photoUrl = s3Key
        ? `${appUrl}/api/planting/photo/${s3Key}`
        : (ipfsResult?.gatewayUrl ?? `${appUrl}/api/planting/photo/unknown`);
      await sendPhotoUploadedEmail({ sponsorEmail, sponsorName, treeId, photoUrl }).catch((err) =>
        console.error('[planting/photo] email error:', err)
      );
    }

    return NextResponse.json(
      {
        message: 'Photo uploaded and verified successfully.',
        s3Key,
        ipfsCid: ipfsResult?.cid,
        ipfsUrl: ipfsResult?.ipfsUrl,
        gatewayUrl: ipfsResult?.gatewayUrl,
        encryptedGps,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[planting/photo] upload error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
