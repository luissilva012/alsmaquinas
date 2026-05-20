const cloudinary = require('cloudinary').v2;
const { admin, getFirebaseAdmin } = require('../../scripts/firebase-admin');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const verifyAdmin = async (event) => {
  const app = getFirebaseAdmin();
  if (!app) return false;

  const token = String(event.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;

  const decoded = await admin.auth().verifyIdToken(token);
  const adminDoc = await admin.firestore().collection('admins').doc(decoded.uid).get();
  return adminDoc.exists && adminDoc.data()?.active === true;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const allowed = await verifyAdmin(event);
    if (!allowed) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let payload = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const fileType = String(payload.type || '').toLowerCase();
  const filename = String(payload.filename || '');
  const fileSize = Number(payload.size || 0);
  const hasAllowedExtension = /\.(jpe?g|png|webp)$/i.test(filename);

  if (!ALLOWED_IMAGE_TYPES.has(fileType) && !hasAllowedExtension) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported image type' }) };
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_IMAGE_SIZE) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image size' }) };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.CLOUDINARY_FOLDER || 'als-maquinas/produtos';

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary is not configured' }) };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder,
    timestamp,
    upload_preset: uploadPreset,
  };

  const signature = cloudinary.utils.api_sign_request(params, apiSecret);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      cloudName,
      folder,
      signature,
      timestamp,
      uploadPreset,
    }),
  };
};
