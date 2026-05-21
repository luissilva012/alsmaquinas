const jsonResponse = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });

const getBearerToken = (request) => {
  const header = request.headers.get('Authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
};

const getEnv = (env, key) => String(env?.[key] || '').trim();

const lookupFirebaseUser = async (env, idToken) => {
  const apiKey = getEnv(env, 'FIREBASE_API_KEY');
  if (!apiKey || !idToken) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  return Array.isArray(data?.users) && data.users.length ? data.users[0] : null;
};

const isAllowedAdminUid = (env, uid) => {
  const adminUids = getEnv(env, 'FIREBASE_ADMIN_UIDS') || getEnv(env, 'ADMIN_UIDS');
  if (!adminUids || !uid) return false;

  return adminUids
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(uid);
};

const verifyAdmin = async (request, env) => {
  const idToken = getBearerToken(request);
  const user = await lookupFirebaseUser(env, idToken);
  const uid = String(user?.localId || '').trim();
  if (!uid) return { allowed: false, uid: '', token: idToken };

  if (isAllowedAdminUid(env, uid)) {
    return { allowed: true, uid, token: idToken };
  }

  const projectId = getEnv(env, 'FIREBASE_PROJECT_ID');
  if (!projectId) return { allowed: false, uid, token: idToken };

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/admins/${encodeURIComponent(uid)}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  );

  if (!response.ok) return { allowed: false, uid, token: idToken };

  const data = await response.json().catch(() => null);
  const active = data?.fields?.active?.booleanValue === true;
  return { allowed: active, uid, token: idToken };
};

export {
  getEnv,
  jsonResponse,
  verifyAdmin,
};
