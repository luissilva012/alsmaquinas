import { getEnv, jsonResponse, verifyAdmin } from './_shared/firebase-admin-lite.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const sha1Hex = async (value) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return toHex(digest);
};

const buildCloudinarySignature = async (params, apiSecret) => {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return sha1Hex(`${serialized}${apiSecret}`);
};

const handlePost = async ({ request, env }) => {
  try {
    const admin = await verifyAdmin(request, env);
    if (!admin.allowed) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  } catch (error) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const fileType = String(payload.type || '').toLowerCase();
  const filename = String(payload.filename || '');
  const fileSize = Number(payload.size || 0);
  const hasAllowedExtension = /\.(jpe?g|png|webp)$/i.test(filename);

  if (!ALLOWED_IMAGE_TYPES.has(fileType) && !hasAllowedExtension) {
    return jsonResponse({ error: 'Unsupported image type' }, 400);
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_IMAGE_SIZE) {
    return jsonResponse({ error: 'Invalid image size' }, 400);
  }

  const cloudName = getEnv(env, 'CLOUDINARY_CLOUD_NAME');
  const apiKey = getEnv(env, 'CLOUDINARY_API_KEY');
  const apiSecret = getEnv(env, 'CLOUDINARY_API_SECRET');
  const uploadPreset = getEnv(env, 'CLOUDINARY_UPLOAD_PRESET');
  const folder = getEnv(env, 'CLOUDINARY_FOLDER') || 'als-maquinas/produtos';

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return jsonResponse({ error: 'Cloudinary is not configured' }, 500);
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder,
    timestamp,
    upload_preset: uploadPreset,
  };

  const signature = await buildCloudinarySignature(params, apiSecret);

  return jsonResponse({
    apiKey,
    cloudName,
    folder,
    signature,
    timestamp,
    uploadPreset,
  });
};

export const onRequest = async (context) => {
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  return handlePost(context);
};
