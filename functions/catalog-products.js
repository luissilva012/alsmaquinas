import { getEnv, getFirebaseAccessToken, jsonResponse } from './_shared/firebase-admin-lite.js';

const fromFirestoreValue = (value) => {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;

  if ('arrayValue' in value) {
    return (value.arrayValue?.values || []).map(fromFirestoreValue);
  }

  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, entry]) => [key, fromFirestoreValue(entry)]),
    );
  }

  return null;
};

const getDocumentId = (name) => String(name || '').split('/').pop() || '';

const fromFirestoreDocument = (doc) => {
  const fields = doc?.fields || {};
  return {
    id: getDocumentId(doc?.name),
    ...fromFirestoreValue({ mapValue: { fields } }),
  };
};

const handleGet = async ({ env }) => {
  const projectId = getEnv(env, 'FIREBASE_PROJECT_ID');
  const accessToken = await getFirebaseAccessToken(env);

  if (!projectId || !accessToken) {
    return jsonResponse({ products: [], source: 'firebase-not-configured' });
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    '/databases/(default)/documents/products';

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    return jsonResponse({ products: [], source: 'firebase-error' }, 200);
  }

  const data = await response.json().catch(() => ({}));
  const documents = Array.isArray(data.documents) ? data.documents : [];
  const products = documents.map(fromFirestoreDocument).filter((product) => product.active !== false);

  return jsonResponse({ products, source: 'firebase' }, 200, {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  });
};

export const onRequest = async (context) => {
  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  return handleGet(context);
};
