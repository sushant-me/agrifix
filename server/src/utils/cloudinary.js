import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { UPLOAD_ROOT } from '../middleware/upload.js';

const cfg = env.CLOUDINARY_URL || '';
const parsed = cfg.startsWith('cloudinary://')
  ? /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(cfg)
  : null;

let configured = false;
const cloudName = env.CLOUDINARY_CLOUD_NAME || parsed?.[3];
const apiKey = env.CLOUDINARY_API_KEY || parsed?.[1];
const apiSecret = env.CLOUDINARY_API_SECRET || parsed?.[2];
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  configured = true;
}

export function cloudinaryEnabled() {
  return configured;
}

/** Upload a file buffer (memory storage) to Cloudinary. Returns { url, publicId }. */
export function uploadImage(buffer, folder) {
  if (!configured) throw new Error('Cloudinary is not configured.');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `agrismart/${folder}`, resource_type: 'image', transformation: [{ quality: 'auto:good', fetch_format: 'auto' }] },
      (err, result) => {
        if (err) return reject(new Error('Image upload failed.'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Delete a single Cloudinary asset by public id (best effort). */
export async function deleteCloudinaryImage(publicId) {
  if (!configured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    /* best effort */
  }
}

/** Extract the Cloudinary public id from a stored URL, or null. */
export function publicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const idx = url.indexOf('/image/upload/');
  if (idx === -1) return null;
  const rest = url.slice(idx + '/image/upload/'.length);
  const clean = rest.replace(/^v\d+\//, '').replace(/\.[a-z0-9]+$/i, '');
  return clean || null;
}

/** Remove a stored image regardless of origin (Cloudinary or legacy local uploads). */
export async function deleteStoredImage(url) {
  if (!url) return;
  if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
    const rel = url.replace(/^\/?uploads\//, '');
    fs.unlink(path.join(UPLOAD_ROOT, rel), () => {});
    return;
  }
  const publicId = publicIdFromUrl(url);
  if (publicId) await deleteCloudinaryImage(publicId);
}
