(() => {
  const normalizer = window.ALSCatalogNormalizer || {};
  const runtime = window.ALS_RUNTIME_CONFIG || {};
  const firebase = runtime.firebase || {};
  const REQUIRED_KEYS = ['apiKey', 'projectId'];
  const PRODUCTS_COLLECTION = 'products';
  const REQUEST_TIMEOUT_MS = 3500;

  const isConfigured = () =>
    REQUIRED_KEYS.every((key) => String(firebase[key] || '').trim());

  const loadProducts = async () => {
    const serverProducts = await loadProductsFromFunction();
    if (serverProducts !== null) return serverProducts;

    if (!isConfigured() || runtime.allowPublicFirestoreRead !== true) return [];

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = getCollectionUrl(PRODUCTS_COLLECTION);
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) return [];

      const data = await response.json();
      const documents = Array.isArray(data.documents) ? data.documents : [];

      return documents
        .map((doc) => normalizeProduct(fromFirestoreDocument(doc), getDocumentId(doc.name)))
        .filter((product) => product.active !== false && product.slug);
    } catch (error) {
      return [];
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const loadProductsFromFunction = async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetchFunctionEndpoint('catalog-products', {
        signal: controller.signal,
      });

      if (response.status === 404) return null;
      if (!response.ok) return [];

      const data = await response.json();
      const products = Array.isArray(data.products) ? data.products : [];
      return products.map((product) => normalizeProduct(product, product.slug || product.id));
    } catch (error) {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const getCollectionUrl = (collection) => {
    const projectId = encodeURIComponent(firebase.projectId);
    const apiKey = encodeURIComponent(firebase.apiKey);
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?key=${apiKey}`;
  };

  const fetchFunctionEndpoint = (name, options = {}) => fetch(`/${name}`, options);

  const getDocumentId = (name) => String(name || '').split('/').pop() || '';

  const fromFirestoreDocument = (doc) => {
    const fields = doc?.fields || {};
    return fromFirestoreValue({ mapValue: { fields } });
  };

  const fromFirestoreValue = (value) => {
    if (!value || typeof value !== 'object') return null;
    if ('stringValue' in value) return value.stringValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('timestampValue' in value) return value.timestampValue;
    if ('nullValue' in value) return null;

    if ('arrayValue' in value) {
      const values = value.arrayValue?.values || [];
      return values.map(fromFirestoreValue);
    }

    if ('mapValue' in value) {
      const fields = value.mapValue?.fields || {};
      return Object.fromEntries(
        Object.entries(fields).map(([key, entry]) => [key, fromFirestoreValue(entry)]),
      );
    }

    return null;
  };

  const normalizeProduct = (product, documentId) => {
    const normalized =
      typeof normalizer.normalizeProduct === 'function'
        ? normalizer.normalizeProduct(product, documentId)
        : { ...product };
    const slug = String(normalized.slug || '').trim();

    return {
      ...normalized,
      detailUrl: slug ? getProductUrl(slug) : '',
    };
  };

  const getProductUrl = (slug) => {
    const prefix = window.location.pathname.includes('/catalogo/maquinas/')
      ? '../../../'
      : '';
    return `${prefix}catalogo/maquinas/${encodeURIComponent(slug)}/`;
  };

  window.ALSCatalogCMS = {
    loadProducts,
  };
})();
