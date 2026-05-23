import { getEnv, getFirebaseAccessToken, jsonResponse, verifyAdmin } from './_shared/firebase-admin-lite.js';

const WRITE_BATCH_LIMIT = 450;

const getFirestoreBaseUrl = (env) => {
  const projectId = getEnv(env, 'FIREBASE_PROJECT_ID');
  if (!projectId) return '';

  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
};

const cleanPayload = (value) => {
  if (Array.isArray(value)) return value.map(cleanPayload);
  if (!value || typeof value !== 'object') return value ?? null;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, cleanPayload(entry)]),
  );
};

const toFirestoreValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null };

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }

  if (typeof value === 'boolean') return { booleanValue: value };

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { nullValue: null };
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value),
      },
    };
  }

  return { stringValue: String(value) };
};

const toFirestoreFields = (payload) =>
  Object.fromEntries(
    Object.entries(cleanPayload(payload || {})).map(([key, value]) => [key, toFirestoreValue(value)]),
  );

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

const listCollection = async (env, accessToken, collectionName) => {
  const baseUrl = getFirestoreBaseUrl(env);
  if (!baseUrl || !accessToken) return [];

  const response = await fetch(`${baseUrl}/${encodeURIComponent(collectionName)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return [];

  const data = await response.json().catch(() => ({}));
  return (Array.isArray(data.documents) ? data.documents : []).map(fromFirestoreDocument);
};

const getSettings = async (env, accessToken) => {
  const baseUrl = getFirestoreBaseUrl(env);
  if (!baseUrl || !accessToken) return null;

  const response = await fetch(`${baseUrl}/site_settings/catalog`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  return data ? fromFirestoreDocument(data) : null;
};

const commitWrites = async (env, accessToken, writes) => {
  const projectId = getEnv(env, 'FIREBASE_PROJECT_ID');
  if (!projectId || !accessToken) {
    throw new Error('firebase_not_configured');
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    '/databases/(default)/documents:batchWrite';

  for (let index = 0; index < writes.length; index += WRITE_BATCH_LIMIT) {
    const chunk = writes.slice(index, index + WRITE_BATCH_LIMIT);
    if (!chunk.length) continue;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes: chunk }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || 'firestore_write_failed');
    }
  }
};

const collectionDocumentName = (env, collectionName, documentId) => {
  const projectId = getEnv(env, 'FIREBASE_PROJECT_ID');
  return (
    `projects/${projectId}/databases/(default)/documents/` +
    `${collectionName}/${encodeURIComponent(String(documentId || '').trim())}`
  );
};

const getItemDocumentId = (item) => String(item?.slug || item?.id || '').trim();

const normalizeImageUrlList = (urls = [], primaryUrl = '') => {
  const unique = [];
  [primaryUrl, ...urls].forEach((item) => {
    const value = String(item || '').trim();
    if (value && !unique.includes(value)) unique.push(value);
  });
  return unique;
};

const normalizeProductForWrite = (item = {}) => {
  const mainImageUrl = String(item.mainImageUrl || item.image || item.primaryImage || '').trim();
  const galleryImageUrls = normalizeImageUrlList(
    [
      ...(Array.isArray(item.galleryImageUrls) ? item.galleryImageUrls : []),
      ...(Array.isArray(item.gallery) ? item.gallery : []),
      ...(Array.isArray(item.images) ? item.images : []),
    ],
    mainImageUrl,
  );
  const primaryImage = galleryImageUrls[0] || mainImageUrl;

  return {
    ...item,
    image: primaryImage,
    mainImageUrl: primaryImage,
    gallery: galleryImageUrls,
    galleryImageUrls,
    imageAlt: item.imageAlt || item.name || '',
  };
};

const buildCollectionWrites = (env, collectionName, items = [], deletedIds = []) => {
  const nextIds = new Set(items.map(getItemDocumentId).filter(Boolean));
  const writes = [];

  deletedIds
    .map((id) => String(id || '').trim())
    .filter((id) => id && !nextIds.has(id))
    .forEach((id) => {
      writes.push({
        delete: collectionDocumentName(env, collectionName, id),
      });
    });

  items.forEach((item, index) => {
    const id = getItemDocumentId(item);
    if (!id) return;
    const writableItem = collectionName === 'products' ? normalizeProductForWrite(item) : item;

    writes.push({
      update: {
        name: collectionDocumentName(env, collectionName, id),
        fields: toFirestoreFields({
          ...writableItem,
          id: writableItem.id || id,
          documentId: id,
          sortOrder: Number.isFinite(Number(writableItem.sortOrder))
            ? Number(writableItem.sortOrder)
            : index,
        }),
      },
    });
  });

  return writes;
};

const handleGet = async ({ request, env }) => {
  const admin = await verifyAdmin(request, env);
  if (!admin.allowed) return jsonResponse({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  if (url.searchParams.get('check') === '1') {
    return jsonResponse({ ok: true, uid: admin.uid });
  }

  const accessToken = await getFirebaseAccessToken(env);
  if (!accessToken) return jsonResponse({ error: 'Firebase is not configured' }, 500);

  const [machines, categories, settings] = await Promise.all([
    listCollection(env, accessToken, 'products'),
    listCollection(env, accessToken, 'categories'),
    getSettings(env, accessToken),
  ]);

  return jsonResponse({ machines, categories, settings });
};

const handlePost = async ({ request, env }) => {
  const admin = await verifyAdmin(request, env);
  if (!admin.allowed) return jsonResponse({ error: 'Unauthorized' }, 401);

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const accessToken = await getFirebaseAccessToken(env);
  if (!accessToken) return jsonResponse({ error: 'Firebase is not configured' }, 500);

  try {
    const writes = [
      ...buildCollectionWrites(env, 'products', payload.machines || [], payload.deletedProducts || []),
      ...buildCollectionWrites(env, 'categories', payload.categories || [], payload.deletedCategories || []),
      {
        update: {
          name: collectionDocumentName(env, 'site_settings', 'catalog'),
          fields: toFirestoreFields(payload.settings || {}),
        },
      },
    ];

    await commitWrites(env, accessToken, writes);
  } catch (error) {
    return jsonResponse({ error: 'Não foi possível salvar as alterações.' }, 500);
  }

  return jsonResponse({ ok: true });
};

export const onRequest = async (context) => {
  if (context.request.method === 'GET') return handleGet(context);
  if (context.request.method === 'POST') return handlePost(context);

  return jsonResponse({ error: 'Method not allowed' }, 405);
};
