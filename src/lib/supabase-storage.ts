const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET = encodeURIComponent("Student room booking plateform");

export async function uploadToSupabase(
  ownerId: string,
  documentType: "aadhaar" | "pan" | "property",
  fileBuffer: ArrayBuffer,
  contentType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.split(".").pop() || "jpg";
  const path = `${ownerId}/${documentType}-${Date.now()}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": contentType,
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  return path;
}

export async function getSignedUrl(path: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );

  if (!res.ok) throw new Error("Failed to generate signed URL");

  const { signedURL } = await res.json();
  return `${SUPABASE_URL}${signedURL}`;
}

export async function getPublicUrl(path: string): Promise<string> {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function deleteFromSupabase(path: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!res.ok) {
    console.error("Delete failed:", await res.text());
  }
}

export async function uploadFile(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<void> {
  const encodedBucket = encodeURIComponent(bucket);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodedBucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": contentType,
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const encodedBucket = encodeURIComponent(bucket);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodedBucket}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Delete failed: ${await res.text()}`);
}

export async function getSignedUrlForBucket(bucket: string, path: string): Promise<string> {
  const encodedBucket = encodeURIComponent(bucket);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${encodedBucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) throw new Error("Failed to generate signed URL");
  const { signedURL } = await res.json();
  return `${SUPABASE_URL}${signedURL}`;
}

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
};

export function validateFileSignature(buffer: ArrayBuffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true;
  const view = new Uint8Array(buffer);
  return signatures.some((sig) => {
    if (view.length < sig.length) return false;
    return sig.every((byte, i) => view[i] === byte);
  });
}

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
