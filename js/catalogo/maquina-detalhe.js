(() => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (slug) {
    window.location.replace(`maquinas/${encodeURIComponent(slug)}/`);
    return;
  }

  window.location.replace('../catalogo.html');
})();
