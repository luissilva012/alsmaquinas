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

let cachedAccessToken = null;

const base64UrlEncode = (value) => {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const decodeServiceAccount = (env) => {
  const encoded = getEnv(env, 'FIREBASE_SERVICE_ACCOUNT_B64');
  if (!encoded) return null;

  try {
    return JSON.parse(atob(encoded));
  } catch (error) {
    return null;
  }
};

const pemToArrayBuffer = (pem) => {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};

const createServiceAccountJwt = async (serviceAccount) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 55 * 60,
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
};

const getFirebaseAccessToken = async (env) => {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60 * 1000) {
    return cachedAccessToken.token;
  }

  const serviceAccount = decodeServiceAccount(env);
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) return '';

  const assertion = await createServiceAccountJwt(serviceAccount);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) return '';

  const data = await response.json().catch(() => ({}));
  const token = String(data.access_token || '').trim();
  const expiresIn = Number(data.expires_in || 3600);
  if (!token) return '';

  cachedAccessToken = {
    token,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  };

  return token;
};

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
  getFirebaseAccessToken,
  getEnv,
  jsonResponse,
  verifyAdmin,
};
