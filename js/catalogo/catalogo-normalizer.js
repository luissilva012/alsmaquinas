(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }

  root.ALSCatalogNormalizer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const statusLabelMap = {
    disponivel: 'Disponível',
    'pronta-entrega': 'Pronta entrega',
    'sob-consulta': 'Sob consulta',
    reservada: 'Reservada',
    vendida: 'Vendida',
    locada: 'Locada',
    manutencao: 'Em manutenção',
    indisponivel: 'Indisponível',
  };

  const entityMap = {
    '&aacute;': 'á',
    '&agrave;': 'à',
    '&atilde;': 'ã',
    '&acirc;': 'â',
    '&eacute;': 'é',
    '&ecirc;': 'ê',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&otilde;': 'õ',
    '&ocirc;': 'ô',
    '&uacute;': 'ú',
    '&ccedil;': 'ç',
    '&Aacute;': 'Á',
    '&Agrave;': 'À',
    '&Atilde;': 'Ã',
    '&Acirc;': 'Â',
    '&Eacute;': 'É',
    '&Ecirc;': 'Ê',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Otilde;': 'Õ',
    '&Ocirc;': 'Ô',
    '&Uacute;': 'Ú',
    '&Ccedil;': 'Ç',
    '&amp;': '&',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' ',
  };

  const decodeHtml = (value) =>
    String(value || '')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&[a-zA-Z#0-9]+;/g, (entity) => entityMap[entity] || entity);

  const stripHtml = (value) =>
    decodeHtml(value)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const slugify = (value) =>
    stripHtml(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const toSerializableDate = (value) => {
    if (!value) return '';
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    return String(value);
  };

  const optimizeCloudinaryUrl = (url) => {
    const value = String(url || '').trim();
    const marker = '/image/upload/';
    const markerIndex = value.indexOf(marker);

    if (!value || markerIndex < 0) return value;

    const prefix = value.slice(0, markerIndex + marker.length);
    const suffix = value.slice(markerIndex + marker.length);
    const firstSegment = suffix.split('/')[0] || '';

    if (/\bf_auto\b/.test(firstSegment) || /\bq_auto\b/.test(firstSegment)) {
      return value;
    }

    return `${prefix}f_auto,q_auto:best/${suffix}`;
  };

  const normalizeGallery = (gallery, image) => {
    const values = Array.isArray(gallery)
      ? gallery
      : String(gallery || '')
          .split(/\r?\n|,/)
          .map((item) => item.trim());
    const unique = [];

    [image, ...values].forEach((item) => {
      const value = optimizeCloudinaryUrl(item);
      if (value && !unique.includes(value)) unique.push(value);
    });

    return unique;
  };

  const normalizeStatus = (product) => {
    const status = slugify(product?.status || product?.commercialStatus || '');
    return status || 'sob-consulta';
  };

  const getMachineStatus = (product) => normalizeStatus(product);
  const getMachineStatusLabel = (product) =>
    stripHtml(product?.statusLabel) || statusLabelMap[getMachineStatus(product)] || 'Sob consulta';
  const allowsQuote = (product) => getMachineStatus(product) !== 'sob-consulta';

  const normalizeProduct = (product = {}, documentId = '') => {
    const rawSlug = product.slug || documentId || product.id || product.name || '';
    const slug = slugify(rawSlug);
    const image = optimizeCloudinaryUrl(
      product.image || product.mainImageUrl || product.primaryImage || '',
    );
    const gallery = normalizeGallery(product.gallery || product.galleryImageUrls || product.images, image);
    const status = getMachineStatus(product);

    return {
      ...product,
      id: String(product.id || documentId || slug).trim(),
      slug,
      name: stripHtml(product.name || ''),
      category: stripHtml(product.category || product.categoryName || ''),
      shortDescription: stripHtml(product.shortDescription || ''),
      fullDescription: stripHtml(product.fullDescription || ''),
      image,
      mainImageUrl: image,
      gallery,
      galleryImageUrls: gallery,
      status,
      commercialStatus: status,
      statusLabel: stripHtml(product.statusLabel || ''),
      allowQuote: allowsQuote({ ...product, status }),
      active: product.active !== false,
      featured: product.featured === true || product.destaque === true,
      destaque: product.destaque === true || product.featured === true,
      indexable: product.indexable !== false,
      seoTitle: stripHtml(product.seoTitle || ''),
      seoDescription: stripHtml(product.seoDescription || ''),
      imageAlt: stripHtml(product.imageAlt || product.name || ''),
      specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
      createdAt: toSerializableDate(product.createdAt),
      updatedAt: toSerializableDate(product.updatedAt),
    };
  };

  return {
    allowsQuote,
    decodeHtml,
    getMachineStatus,
    getMachineStatusLabel,
    normalizeGallery,
    normalizeProduct,
    optimizeCloudinaryUrl,
    slugify,
    stripHtml,
    toSerializableDate,
  };
});
