export interface IpfsUploadResult {
  cid: string;
  ipfsUrl: string;
  gatewayUrl: string;
}

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/';

export async function uploadToIpfs(
  buffer: Uint8Array,
  filename: string,
  mimeType: string
): Promise<IpfsUploadResult> {
  const ipfsApiUrl =
    process.env.NEXT_PUBLIC_IPFS_API_URL ?? 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (pinataApiKey && pinataSecretKey) {
    return uploadToPinata(buffer, filename, pinataApiKey, pinataSecretKey);
  }

  const blob = new Blob([buffer as BlobPart], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await fetch(ipfsApiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash?: string; Hash?: string; cid?: string };
  const cid = data.IpfsHash ?? data.Hash ?? data.cid ?? '';

  if (!cid) {
    throw new Error('IPFS upload did not return a CID');
  }

  return {
    cid,
    ipfsUrl: `ipfs://${cid}`,
    gatewayUrl: `${IPFS_GATEWAY.replace(/\/+$/, '')}/${cid}`,
  };
}

async function uploadToPinata(
  buffer: Uint8Array,
  filename: string,
  apiKey: string,
  secretKey: string
): Promise<IpfsUploadResult> {
  const blob = new Blob([buffer as BlobPart]);
  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  const cid = data.IpfsHash;

  return {
    cid,
    ipfsUrl: `ipfs://${cid}`,
    gatewayUrl: `${IPFS_GATEWAY.replace(/\/+$/, '')}/${cid}`,
  };
}
