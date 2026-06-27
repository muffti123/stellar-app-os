import { NextResponse } from 'next/server';
import exifr from 'exifr';
import { getDistance } from '@/lib/geo/distance';
import { uploadImageToS3 } from '@/lib/aws/s3';
import { uploadToIpfs } from '@/lib/ipfs/upload';
import { encryptGpsCoordinates } from '@/lib/zk/locationProof';
import { sendPhotoUploadedEmail } from '@/lib/email/sendgrid';

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

    if (!photo || !latStr || !lonStr || !farmerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates formats' }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());

    // Extract EXIF GPS data for validation
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

    // Upload to S3 (private backup)
    let s3Key: string | undefined;
    try {
      s3Key = await uploadImageToS3(farmerId, buffer, photo.type);
    } catch (err) {
      console.warn('[planting/photo] S3 upload failed, continuing with IPFS only:', err);
    }

    // Upload to IPFS
    const ipfsResult = await uploadToIpfs(buffer, `${farmerId}-${Date.now()}.jpg`, photo.type);

    // Encrypt EXIF GPS coordinates for privacy
    const encryptedGps = await encryptGpsCoordinates({ lat, lon });

    // Notify sponsor if contact info provided
    if (sponsorEmail && sponsorName && treeId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const photoUrl = s3Key ? `${appUrl}/api/planting/photo/${s3Key}` : ipfsResult.gatewayUrl;
      await sendPhotoUploadedEmail({ sponsorEmail, sponsorName, treeId, photoUrl }).catch((err) =>
        console.error('[planting/photo] email error:', err)
      );
    }

    return NextResponse.json(
      {
        message: 'Photo uploaded to IPFS and verified successfully.',
        ipfsCid: ipfsResult.cid,
        ipfsUrl: ipfsResult.ipfsUrl,
        gatewayUrl: ipfsResult.gatewayUrl,
        s3Key,
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
