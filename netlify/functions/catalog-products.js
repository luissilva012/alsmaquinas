const { getFirestore } = require('../../scripts/firebase-admin');
const { normalizeProduct: normalizeCatalogProduct } = require('../../js/catalogo/catalogo-normalizer');

const sortByCatalogOrder = (left, right) => {
  const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 9999;
  const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 9999;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return String(left.name || '').localeCompare(String(right.name || ''), 'pt-BR');
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const db = getFirestore();
  if (!db) {
    return json(503, { error: 'Catalog backend unavailable' });
  }

  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs
      .map((doc) => normalizeCatalogProduct({ id: doc.id, ...doc.data() }, doc.id))
      .filter((product) => product.active !== false && product.slug)
      .sort(sortByCatalogOrder);

    return json(200, {
      source: 'firebase',
      updatedAt: new Date().toISOString(),
      products,
    });
  } catch (error) {
    return json(500, { error: 'Could not load catalog products' });
  }
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});
