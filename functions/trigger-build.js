import { getEnv, jsonResponse, verifyAdmin } from './_shared/firebase-admin-lite.js';

const BUILD_TRIGGER_COOLDOWN_MS = 30 * 1000;

const getBuildHookDocUrl = (env) => {
  const projectId = getEnv(env, 'FIREBASE_PROJECT_ID');
  if (!projectId) return '';

  return (
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    '/databases/(default)/documents/site_settings/build_hook'
  );
};

const parseIntegerField = (fields, key) => {
  const value = fields?.[key]?.integerValue || fields?.[key]?.doubleValue;
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const reserveBuildTrigger = async (env, idToken) => {
  const url = getBuildHookDocUrl(env);
  if (!url || !idToken) return { allowed: true, retryAfterMs: 0 };

  const headers = {
    Authorization: `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };

  const now = Date.now();
  const current = await fetch(url, { headers }).catch(() => null);

  if (current?.ok) {
    const data = await current.json().catch(() => ({}));
    const lastTriggeredAt = parseIntegerField(data.fields, 'lastTriggeredAt');
    const elapsed = now - lastTriggeredAt;

    if (elapsed > 0 && elapsed < BUILD_TRIGGER_COOLDOWN_MS) {
      return {
        allowed: false,
        retryAfterMs: BUILD_TRIGGER_COOLDOWN_MS - elapsed,
      };
    }
  }

  const updateUrl =
    `${url}?updateMask.fieldPaths=lastTriggeredAt&updateMask.fieldPaths=updatedAt`;

  await fetch(updateUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      fields: {
        lastTriggeredAt: { integerValue: String(now) },
        updatedAt: { timestampValue: new Date(now).toISOString() },
      },
    }),
  }).catch(() => null);

  return { allowed: true, retryAfterMs: 0 };
};

const handlePost = async ({ request, env }) => {
  let admin;
  try {
    admin = await verifyAdmin(request, env);
    if (!admin.allowed) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  } catch (error) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const hookUrl = getEnv(env, 'CLOUDFLARE_DEPLOY_HOOK_URL');

  if (!hookUrl) {
    return jsonResponse({
      skipped: true,
      reason: 'CLOUDFLARE_DEPLOY_HOOK_URL is not configured',
    });
  }

  const throttle = await reserveBuildTrigger(env, admin.token);
  if (!throttle.allowed) {
    return jsonResponse({
      skipped: true,
      reason: 'Build hook cooldown',
      retryAfterMs: throttle.retryAfterMs,
    });
  }

  const response = await fetch(hookUrl, { method: 'POST' });
  if (!response.ok) {
    return jsonResponse({ error: 'Build hook failed' }, response.status);
  }

  return jsonResponse({ ok: true });
};

export const onRequest = async (context) => {
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  return handlePost(context);
};
