const { admin, getFirebaseAdmin } = require('../../scripts/firebase-admin');

const BUILD_TRIGGER_COOLDOWN_MS = 30 * 1000;

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

  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!hookUrl) {
    return {
      statusCode: 200,
      body: JSON.stringify({ skipped: true, reason: 'NETLIFY_BUILD_HOOK_URL is not configured' }),
    };
  }

  const throttle = await reserveBuildTrigger();
  if (!throttle.allowed) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        skipped: true,
        reason: 'Build hook cooldown',
        retryAfterMs: throttle.retryAfterMs,
      }),
    };
  }

  const response = await fetch(hookUrl, { method: 'POST' });
  if (!response.ok) {
    return {
      statusCode: response.status,
      body: JSON.stringify({ error: 'Build hook failed' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};

const reserveBuildTrigger = async () => {
  const db = admin.firestore();
  const ref = db.collection('site_settings').doc('build_hook');
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const lastTriggeredAt = Number(snapshot.data()?.lastTriggeredAt || 0);
    const elapsed = now - lastTriggeredAt;

    if (elapsed > 0 && elapsed < BUILD_TRIGGER_COOLDOWN_MS) {
      return {
        allowed: false,
        retryAfterMs: BUILD_TRIGGER_COOLDOWN_MS - elapsed,
      };
    }

    transaction.set(
      ref,
      {
        lastTriggeredAt: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { allowed: true, retryAfterMs: 0 };
  });
};
