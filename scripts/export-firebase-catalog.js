const fs = require('fs');
const path = require('path');
const { getFirestore } = require('./firebase-admin');
const { normalizeProduct } = require('../js/catalogo/catalogo-normalizer');

const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'catalogo', 'maquinas.json');
const backupPath = path.join(rootDir, 'data', 'catalogo', 'maquinas.backup.json');

const sortByCatalogOrder = (left, right) => {
  const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 9999;
  const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 9999;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return String(left.name || '').localeCompare(String(right.name || ''), 'pt-BR');
};

const validateProduct = (product) => {
  const missing = [];
  if (!String(product.name || '').trim()) missing.push('name');
  if (!String(product.slug || product.id || '').trim()) missing.push('slug');
  if (!String(product.category || '').trim()) missing.push('category');
  if (!String(product.shortDescription || '').trim()) missing.push('shortDescription');
  if (!String(product.image || '').trim()) missing.push('image');
  return missing;
};

const restoreBackupCatalog = (reason) => {
  if (!fs.existsSync(backupPath)) {
    console.log(`${reason}. No Firebase backup found. Keeping current catalog data.`);
    return;
  }

  fs.copyFileSync(backupPath, dataPath);
  console.log(`${reason}. Restored catalog data from Firebase backup.`);
};

const main = async () => {
  const db = getFirestore();
  if (!db) {
    restoreBackupCatalog('Firebase service account not configured');
    return;
  }

  const snapshot = await db.collection('products').get();
  const products = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((product) => product.active !== false)
    .sort(sortByCatalogOrder)
    .map((product) => normalizeProduct(product, product.id));

  if (!products.length) {
    restoreBackupCatalog('No Firebase products found');
    return;
  }

  const invalidProducts = products
    .map((product) => ({ product, missing: validateProduct(product) }))
    .filter((entry) => entry.missing.length);

  if (invalidProducts.length) {
    const details = invalidProducts
      .map(({ product, missing }) => `${product.slug || product.id || product.name || 'sem-id'} (${missing.join(', ')})`)
      .join('; ');
    throw new Error(`Active Firebase products are missing required catalog fields: ${details}`);
  }

  const current = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const next = {
    ...current,
    source: 'firebase',
    exportedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString().slice(0, 10),
    machines: products,
  };

  fs.writeFileSync(dataPath, `${JSON.stringify(next, null, 2)}\n`);
  fs.writeFileSync(backupPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Exported ${products.length} Firebase products to data/catalogo/maquinas.json`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
