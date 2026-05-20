(() => {
  // Produto - configuracao, dados e referencias do DOM
  const catalogNormalizer = window.ALSCatalogNormalizer || {};
  const MOBILE_CART_QUERY = '(max-width: 1080px)';
  const RATIO_ZOOM_CLASS = 'als-ratio-375-200';
  const RATIO_375_200 = 375 / 200;
  const RATIO_TOLERANCE = 0.01;
  const statusLabelMap = {
    disponivel: 'Dispon&iacute;vel',
    'pronta-entrega': 'Pronta entrega',
    'sob-consulta': 'Sob consulta',
    reservada: 'Reservada',
    vendido: 'Vendido',
    vendida: 'Vendida',
    locada: 'Locada',
    manutencao: 'Em manuten&ccedil;&atilde;o',
    indisponivel: 'Indispon&iacute;vel',
  };
  const quote = window.ALSQuoteList;
  const machineJson = document.querySelector('[data-machine-json]');
  let machine = parseMachine(machineJson);

  if (!quote || !machine) return;

  const els = {
    quoteItems: document.querySelector('[data-quote-items]'),
    quoteModal: null,
    quoteModalItems: null,
    quoteCount: document.querySelectorAll('[data-quote-count]'),
    quoteWhatsApp: document.querySelectorAll('[data-quote-whatsapp]'),
    quoteClear: document.querySelectorAll('[data-quote-clear]'),
    quoteFixedBar: null,
    mainImage: document.querySelector('[data-detail-main-image]'),
    galleryLightbox: null,
    galleryLightboxImage: null,
    galleryLightboxCount: null,
    mobileCartQuery: window.matchMedia(MOBILE_CART_QUERY),
  };

  // Produto - inicializacao
  const init = () => {
    ensureQuoteFixedBar();
    ensureQuoteModal();
    ensureGalleryLightbox();
    initProductIcons();
    initProductAccordions();
    initSimilarSlider();
    applyRatioImageZoom();
    refreshQuoteTargets();
    refreshGalleryLightboxTargets();
    bindEvents();
    renderQuote();
    hydrateProductFromCMS();
  };

  const hydrateProductFromCMS = async () => {
    const products = await window.ALSCatalogCMS?.loadProducts?.();
    if (!Array.isArray(products) || !products.length) return;

    const nextMachine = findProductForCurrentPage(products);
    if (!nextMachine) return;

    machine = nextMachine;
    updateProductUrl(nextMachine);
    updateProductPage(nextMachine);
    renderQuote();
    initProductIcons();
  };

  const findProductForCurrentPage = (products) => {
    const slug = getCurrentProductSlug();
    const currentId = machine?.id || '';

    return (
      products.find((product) => sameText(product.slug, slug)) ||
      products.find((product) => sameText(product.id, currentId)) ||
      products.find((product) => sameText(product.slug, machine?.slug))
    );
  };

  const getCurrentProductSlug = () => {
    const querySlug = new URLSearchParams(window.location.search).get('slug');
    if (querySlug) return querySlug;

    const segments = window.location.pathname.split('/').filter(Boolean);
    const maquinasIndex = segments.lastIndexOf('maquinas');
    return maquinasIndex >= 0 ? segments[maquinasIndex + 1] || '' : machine?.slug || '';
  };

  const updateProductUrl = (product) => {
    const nextSlug = String(product?.slug || '').trim();
    if (!nextSlug || sameText(nextSlug, getCurrentProductSlug())) return;
    if (!window.history || typeof window.history.replaceState !== 'function') return;

    const nextPath = getProductPath(nextSlug);
    window.history.replaceState({}, '', nextPath);
    updateProductMetaUrl(nextPath);
  };

  const getProductPath = (slug) => {
    const safeSlug = encodeURIComponent(slug);
    const segments = window.location.pathname.split('/').filter(Boolean);
    const maquinasIndex = segments.lastIndexOf('maquinas');

    if (maquinasIndex >= 0) {
      const prefix = segments.slice(0, maquinasIndex + 1).join('/');
      return `/${prefix}/${safeSlug}/`;
    }

    return `/catalogo/maquinas/${safeSlug}/`;
  };

  const updateProductMetaUrl = (path) => {
    const absoluteUrl = `${window.location.origin}${path}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', absoluteUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', absoluteUrl);
  };

  // Produto - icones e acordeoes
  const initProductIcons = () => {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;

    window.lucide.createIcons({
      attrs: {
        'stroke-width': 2,
        'aria-hidden': 'true',
        focusable: 'false',
      },
    });

    document.documentElement.classList.add('product-icons-ready');
  };

  const initProductAccordions = () => {
    document.querySelectorAll('.product-accordion').forEach((accordion) => {
      const summary = accordion.querySelector('summary');
      const content = accordion.querySelector('.product-accordion-content');

      if (!summary || !content) return;

      accordion.dataset.accordionState = 'idle';

      summary.addEventListener('click', (event) => {
        event.preventDefault();

        if (accordion.dataset.accordionState === 'expanding' || accordion.dataset.accordionState === 'collapsing') {
          return;
        }

        if (accordion.open) {
          collapseProductAccordion(accordion, summary);
          return;
        }

        expandProductAccordion(accordion, summary);
      });
    });
  };

  const expandProductAccordion = (accordion, summary) => {
    accordion.classList.remove('is-collapsing');
    accordion.classList.add('is-expanding');
    accordion.dataset.accordionState = 'expanding';

    const startHeight = `${summary.offsetHeight}px`;
    accordion.style.height = startHeight;
    accordion.style.transition = 'none';
    accordion.open = true;

    requestAnimationFrame(() => {
      const endHeight = `${summary.offsetHeight + getAccordionContentHeight(accordion)}px`;
      accordion.style.transition = 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)';
      accordion.style.height = endHeight;
    });

    const handleExpandEnd = (event) => {
      if (event.propertyName !== 'height') return;
      accordion.removeEventListener('transitionend', handleExpandEnd);
      accordion.classList.remove('is-expanding');
      accordion.dataset.accordionState = 'idle';
      accordion.style.height = '';
      accordion.style.transition = '';
    };

    accordion.addEventListener('transitionend', handleExpandEnd);
  };

  const collapseProductAccordion = (accordion, summary) => {
    accordion.classList.remove('is-expanding');
    accordion.classList.add('is-collapsing');
    accordion.dataset.accordionState = 'collapsing';

    const startHeight = `${accordion.offsetHeight}px`;
    const endHeight = `${summary.offsetHeight}px`;
    accordion.style.height = startHeight;
    accordion.style.transition = 'none';

    requestAnimationFrame(() => {
      accordion.style.transition = 'height 240ms cubic-bezier(0.4, 0, 0.2, 1)';
      accordion.style.height = endHeight;
    });

    const handleCollapseEnd = (event) => {
      if (event.propertyName !== 'height') return;
      accordion.removeEventListener('transitionend', handleCollapseEnd);
      accordion.open = false;
      accordion.classList.remove('is-collapsing');
      accordion.dataset.accordionState = 'idle';
      accordion.style.height = '';
      accordion.style.transition = '';
    };

    accordion.addEventListener('transitionend', handleCollapseEnd);
  };

  const getAccordionContentHeight = (accordion) => {
    const content = accordion.querySelector('.product-accordion-content');
    return content ? content.offsetHeight : 0;
  };

  // Produto - eventos globais
  const bindEvents = () => {
    document.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-add-quote]');
      const productWhatsAppButton = event.target.closest('[data-product-whatsapp]');
      const availabilityButton = event.target.closest('[data-availability]');
      const thumbButton = event.target.closest('[data-detail-thumb]');
      const galleryPrevButton = event.target.closest('[data-gallery-prev]');
      const galleryNextButton = event.target.closest('[data-gallery-next]');
      const galleryDotButton = event.target.closest('[data-gallery-dot]');
      const thumbsPrevButton = event.target.closest('[data-gallery-thumbs-prev]');
      const thumbsNextButton = event.target.closest('[data-gallery-thumbs-next]');
      const galleryOpenButton = event.target.closest('[data-gallery-open]');
      const galleryLightboxCloseButton = event.target.closest('[data-gallery-lightbox-close]');
      const galleryLightboxPrevButton = event.target.closest('[data-gallery-lightbox-prev]');
      const galleryLightboxNextButton = event.target.closest('[data-gallery-lightbox-next]');

      if (addButton) {
        const quoteMachine = parseQuoteMachineFromButton(addButton) || machine;
        quote.addItem(quoteMachine);
        renderQuote();
      }

      if (productWhatsAppButton) {
        event.preventDefault();

        if (!allowsQuote(machine)) {
          quote.openAvailability(machine);
          return;
        }

        const alreadyInQuote = quote.getItems().some((item) => item.id === machine.id);
        if (!alreadyInQuote) {
          quote.addItem(machine);
        }

        renderQuote();
        quote.openWhatsApp();
      }

      if (availabilityButton) {
        quote.openAvailability(machine);
      }

      if (galleryPrevButton) {
        event.preventDefault();
        changeGalleryByOffset(-1);
      }

      if (galleryNextButton) {
        event.preventDefault();
        changeGalleryByOffset(1);
      }

      if (galleryDotButton) {
        event.preventDefault();
        setGalleryIndex(Number(galleryDotButton.dataset.galleryDot));
      }

      if (thumbsPrevButton) {
        event.preventDefault();
        scrollGalleryThumbs(-1);
      }

      if (thumbsNextButton) {
        event.preventDefault();
        scrollGalleryThumbs(1);
      }

      if (galleryOpenButton && els.mainImage) {
        event.preventDefault();
        openGalleryLightbox();
      }

      if (galleryLightboxCloseButton) {
        closeGalleryLightbox();
      }

      if (galleryLightboxPrevButton) {
        event.preventDefault();
        changeGalleryByOffset(-1);
      }

      if (galleryLightboxNextButton) {
        event.preventDefault();
        changeGalleryByOffset(1);
      }

      if (thumbButton && els.mainImage) {
        event.preventDefault();
        setGalleryIndex(Number(thumbButton.dataset.galleryIndex));
      }
    });

    bindQuoteItems(els.quoteItems);
    bindQuoteItems(els.quoteModalItems);

    els.quoteClear.forEach((button) => {
      button.addEventListener('click', () => {
        quote.clear();
        renderQuote();
      });
    });

    els.quoteWhatsApp.forEach((button) => {
      button.addEventListener('click', (event) => {
        if (button.closest('[data-quote-fixed-bar]') && els.mobileCartQuery.matches) {
          event.preventDefault();
          openQuoteModal();
          return;
        }

        if (!quote.getItems().length) return;
        quote.openWhatsApp();
      });
    });

    els.quoteModal?.addEventListener('click', (event) => {
      if (event.target.closest('[data-quote-modal-close]')) {
        closeQuoteModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (
        event.target.closest?.('[data-gallery-open]')
        && (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        openGalleryLightbox();
      }

      if (event.key === 'Escape') {
        closeGalleryLightbox();
        closeQuoteModal();
      }

      if (isGalleryLightboxOpen() && event.key === 'ArrowLeft') {
        event.preventDefault();
        changeGalleryByOffset(-1);
      }

      if (isGalleryLightboxOpen() && event.key === 'ArrowRight') {
        event.preventDefault();
        changeGalleryByOffset(1);
      }
    });

    els.mobileCartQuery.addEventListener?.('change', renderQuote);
    window.addEventListener('als:quote-updated', renderQuote);
  };

  // Produto - carrinho e modal de orcamento
  const bindQuoteItems = (container) => {
    container?.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-quote-remove]');
      const changeButton = event.target.closest('[data-quote-change]');

      if (removeButton) {
        quote.removeItem(removeButton.dataset.quoteRemove);
        renderQuote();
      }

      if (changeButton) {
        const item = quote
          .getItems()
          .find((entry) => entry.id === changeButton.dataset.quoteChange);
        if (!item) return;
        quote.updateQuantity(item.id, item.quantity + Number(changeButton.dataset.delta));
        renderQuote();
      }
    });
  };

  const ensureQuoteFixedBar = () => {
    if (document.querySelector('[data-quote-fixed-bar]')) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="quote-fixed-bar" data-quote-fixed-bar hidden aria-live="polite">
        <div class="quote-fixed-inner">
          <div class="quote-fixed-count">
            <span>Itens no pedido</span>
            <strong class="quote-fixed-count-text" data-quote-count>0 itens</strong>
            <strong class="quote-fixed-count-badge" data-quote-count data-quote-count-format="number" aria-hidden="true">0</strong>
          </div>
          <button class="catalog-btn primary quote-fixed-button" type="button" data-quote-whatsapp aria-label="Enviar carrinho pelo WhatsApp">
            <span class="quote-fixed-cart-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" focusable="false">
                <path d="M8 10h9.4a4 4 0 0 1 3.9 3.2L22.5 19H54a4 4 0 0 1 3.9 4.8l-4.7 22A5 5 0 0 1 48.3 50H25.2a5 5 0 0 1-4.9-4L14 16H8a3 3 0 0 1 0-6Zm17.1 34h22.2l3.9-19H23.8l1.3 19ZM25 60a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm23 0a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
              </svg>
            </span>
            <span class="quote-whatsapp-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path class="quote-whatsapp-bubble" d="M12 3.2a8.64 8.64 0 0 0-7.36 13.16l-.94 3.94 4.04-1.02A8.64 8.64 0 1 0 12 3.2Z" />
                <path class="quote-whatsapp-phone" d="M8.54 7.24c-.34.08-.73.46-.98.98-.3.59-.32 1.47-.04 2.35.47 1.54 1.76 3.04 3.32 4.03 1.61 1.04 3.38 1.44 4.46 1.09.66-.22 1.21-.78 1.37-1.4l.17-.69a.62.62 0 0 0-.36-.76l-1.82-.84a.68.68 0 0 0-.94.24l-.58.78a.55.55 0 0 1-.65.16 7.27 7.27 0 0 1-2.96-2.86.54.54 0 0 1 .1-.66l.68-.6c.27-.23.34-.61.17-.92L9.52 7.6a.79.79 0 0 0-.98-.36Z" />
              </svg>
            </span>
            Enviar carrinho
          </button>
        </div>
      </div>
    `,
    );
  };

  const ensureQuoteModal = () => {
    if (document.querySelector('[data-quote-modal]')) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="quote-modal" data-quote-modal hidden>
        <button class="quote-modal-backdrop" type="button" data-quote-modal-close aria-label="Fechar carrinho"></button>
        <section class="quote-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title">
          <div class="quote-modal-top">
            <h2 id="quote-modal-title">Seu carrinho</h2>
            <button class="quote-modal-close" type="button" data-quote-modal-close>Fechar</button>
          </div>
          <div class="quote-modal-body">
            <div class="quote-panel quote-modal-panel">
              <div class="quote-panel-head">
                <div>
                  <span class="quote-eyebrow">
                    <span class="quote-cart-icon" aria-hidden="true">
                      <svg viewBox="0 0 64 64" focusable="false">
                        <path d="M8 10h9.4a4 4 0 0 1 3.9 3.2L22.5 19H54a4 4 0 0 1 3.9 4.8l-4.7 22A5 5 0 0 1 48.3 50H25.2a5 5 0 0 1-4.9-4L14 16H8a3 3 0 0 1 0-6Zm17.1 34h22.2l3.9-19H23.8l1.3 19ZM25 60a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm23 0a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                      </svg>
                    </span>
                    Carrinho
                  </span>
                  <h2>Resumo dos produtos</h2>
                </div>
                <button class="quote-clear-link" type="button" data-quote-clear hidden>Limpar</button>
              </div>
              <div class="quote-items" data-quote-modal-items></div>
            </div>
          </div>
          <div class="quote-modal-footer">
            <button class="catalog-btn primary quote-whatsapp-button" type="button" data-quote-whatsapp disabled>
              <span class="quote-whatsapp-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path class="quote-whatsapp-bubble" d="M12 3.2a8.64 8.64 0 0 0-7.36 13.16l-.94 3.94 4.04-1.02A8.64 8.64 0 1 0 12 3.2Z" />
                  <path class="quote-whatsapp-phone" d="M8.54 7.24c-.34.08-.73.46-.98.98-.3.59-.32 1.47-.04 2.35.47 1.54 1.76 3.04 3.32 4.03 1.61 1.04 3.38 1.44 4.46 1.09.66-.22 1.21-.78 1.37-1.4l.17-.69a.62.62 0 0 0-.36-.76l-1.82-.84a.68.68 0 0 0-.94.24l-.58.78a.55.55 0 0 1-.65.16 7.27 7.27 0 0 1-2.96-2.86.54.54 0 0 1 .1-.66l.68-.6c.27-.23.34-.61.17-.92L9.52 7.6a.79.79 0 0 0-.98-.36Z" />
                </svg>
              </span>
              Enviar carrinho
            </button>
          </div>
        </section>
      </div>
    `,
    );
  };

  const refreshQuoteTargets = () => {
    els.quoteModal = document.querySelector('[data-quote-modal]');
    els.quoteModalItems = document.querySelector('[data-quote-modal-items]');
    els.quoteCount = document.querySelectorAll('[data-quote-count]');
    els.quoteWhatsApp = document.querySelectorAll('[data-quote-whatsapp]');
    els.quoteClear = document.querySelectorAll('[data-quote-clear]');
    els.quoteFixedBar = document.querySelector('[data-quote-fixed-bar]');
  };

  // Produto - galeria e lightbox
  const ensureGalleryLightbox = () => {
    if (!els.mainImage || document.querySelector('[data-gallery-lightbox]')) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="product-lightbox" data-gallery-lightbox hidden>
        <button class="product-lightbox-backdrop" type="button" data-gallery-lightbox-close aria-label="Fechar imagem ampliada"></button>
        <button class="product-lightbox-close" type="button" data-gallery-lightbox-close aria-label="Fechar imagem ampliada">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
        <button class="product-lightbox-arrow product-lightbox-arrow-prev" type="button" data-gallery-lightbox-prev aria-label="Imagem anterior">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <figure class="product-lightbox-frame" role="dialog" aria-modal="true" aria-label="Imagem ampliada do produto">
          <img src="" alt="" data-gallery-lightbox-image>
          <figcaption data-gallery-lightbox-count></figcaption>
        </figure>
        <button class="product-lightbox-arrow product-lightbox-arrow-next" type="button" data-gallery-lightbox-next aria-label="Pr&oacute;xima imagem">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
    `,
    );
  };

  const refreshGalleryLightboxTargets = () => {
    els.galleryLightbox = document.querySelector('[data-gallery-lightbox]');
    els.galleryLightboxImage = document.querySelector('[data-gallery-lightbox-image]');
    els.galleryLightboxCount = document.querySelector('[data-gallery-lightbox-count]');
  };

  const isGalleryLightboxOpen = () => Boolean(els.galleryLightbox && !els.galleryLightbox.hidden);

  const openGalleryLightbox = () => {
    if (!els.galleryLightbox || !els.galleryLightboxImage || !els.mainImage) return;
    els.galleryLightbox.hidden = false;
    document.body.classList.add('product-lightbox-open');
    updateGalleryLightbox();
    els.galleryLightbox.querySelector('[data-gallery-lightbox-close]')?.focus();
  };

  const closeGalleryLightbox = () => {
    if (!isGalleryLightboxOpen()) return;
    els.galleryLightbox.hidden = true;
    document.body.classList.remove('product-lightbox-open');
  };

  const updateGalleryLightbox = () => {
    if (!els.galleryLightboxImage || !els.mainImage) return;

    const thumbs = getGalleryThumbs();
    const index = getGalleryIndex();
    const activeThumb = thumbs[index];
    const activeThumbImage = activeThumb?.querySelector('img');

    els.galleryLightboxImage.src = els.mainImage.src;
    els.galleryLightboxImage.alt = activeThumbImage?.alt || els.mainImage.alt || '';

    if (els.galleryLightboxCount && thumbs.length) {
      els.galleryLightboxCount.textContent = `${index + 1} / ${thumbs.length}`;
      els.galleryLightboxCount.hidden = thumbs.length < 2;
    }

    els.galleryLightbox?.querySelectorAll('[data-gallery-lightbox-prev], [data-gallery-lightbox-next]').forEach((button) => {
      button.hidden = thumbs.length < 2;
    });
  };

  const openQuoteModal = () => {
    if (!els.quoteModal) return;
    renderQuote();
    els.quoteModal.hidden = false;
    document.body.classList.add('quote-modal-open');
  };

  const closeQuoteModal = () => {
    if (!els.quoteModal || els.quoteModal.hidden) return;
    els.quoteModal.hidden = true;
    document.body.classList.remove('quote-modal-open');
  };

  const getGalleryThumbs = () => Array.from(document.querySelectorAll('[data-detail-thumb]'));

  const getGalleryIndex = () => {
    const currentIndex = Number(els.mainImage?.dataset.galleryActiveIndex || 0);
    return Number.isFinite(currentIndex) ? currentIndex : 0;
  };

  const setGalleryIndex = (index) => {
    const thumbs = getGalleryThumbs();
    if (!els.mainImage || !thumbs.length || !Number.isFinite(index)) return;

    const nextIndex = ((index % thumbs.length) + thumbs.length) % thumbs.length;
    const activeThumb = thumbs[nextIndex];
    const thumbImage = activeThumb?.querySelector('img');
    if (!activeThumb) return;

    els.mainImage.src = activeThumb.dataset.detailThumb;
    els.mainImage.dataset.galleryActiveIndex = String(nextIndex);
    if (thumbImage?.alt) {
      els.mainImage.alt = thumbImage.alt;
    }
    prepareRatioImageZoom(els.mainImage);

    thumbs.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === nextIndex;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    document.querySelectorAll('[data-gallery-dot]').forEach((button) => {
      const isActive = Number(button.dataset.galleryDot) === nextIndex;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    if (isGalleryLightboxOpen()) {
      updateGalleryLightbox();
    }
  };

  const changeGalleryByOffset = (offset) => {
    const thumbs = getGalleryThumbs();
    if (thumbs.length < 2) return;
    setGalleryIndex(getGalleryIndex() + offset);
  };

  const scrollGalleryThumbs = (direction) => {
    const thumbRow = document.querySelector('[data-gallery-thumbs]');
    if (!thumbRow) return;
    const distance = Math.max(thumbRow.clientWidth * 0.72, 120);
    thumbRow.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  const updateProductPage = (product) => {
    const title = decodeHtml(product.name || '');
    const description = decodeHtml(product.shortDescription || product.fullDescription || '');
    const fullDescription = decodeHtml(product.fullDescription || product.shortDescription || '');

    document.title = title ? `${title} | ALS Máquinas` : document.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('.product-title-row h1')?.replaceChildren(document.createTextNode(title));
    document.querySelector('.product-short-block p')?.replaceChildren(document.createTextNode(description));
    document.querySelector('.product-info-breadcrumb span:last-child')?.replaceChildren(
      document.createTextNode(title),
    );

    const descriptionContent = getAccordionContentByTitle('Descrição');
    if (descriptionContent) {
      descriptionContent.innerHTML = `<p>${displayText(fullDescription)}</p>`;
    }

    updateProductDetails(product);
    updateActionButtons(product);
    updateProductGallery(product);
  };

  const updateProductDetails = (product) => {
    const trustStrip = document.querySelector('.product-trust-strip');
    if (trustStrip) {
      trustStrip.innerHTML = renderProductTrustStrip(product);
    }

    const details = document.querySelector('.product-details-accordion');
    if (details) {
      details.outerHTML = renderProductDetailsAccordion(product);
      initProductAccordions();
    }
  };

  const renderProductTrustStrip = (product) =>
    getProductBenefitItems(product)
      .map(
        (item) => `
        <div class="product-trust-item">
          <span class="product-detail-summary-icon" aria-hidden="true">
            ${renderProductLucideIcon(item.icon)}
          </span>
          <strong>${displayText(item.text)}</strong>
        </div>`,
      )
      .join('');

  const renderProductDetailsAccordion = (product) => {
    const fullDescription = product.fullDescription || product.shortDescription || '';
    const items = [
      {
        icon: 'file-text',
        title: 'Descri&ccedil;&atilde;o',
        content: `<p>${displayText(fullDescription)}</p>`,
      },
      {
        icon: 'badge-check',
        title: 'Caracter&iacute;sticas',
        content: renderFeatureList(product),
      },
      {
        icon: 'sliders-horizontal',
        title: 'Especifica&ccedil;&otilde;es t&eacute;cnicas',
        content: renderSpecsGrid(product),
      },
      {
        icon: 'shield-check',
        title: 'Prazo de entrega & garantia',
        content: renderDeliveryWarranty(product),
      },
    ];

    return `
      <section class="product-details-accordion" aria-labelledby="product-details-title">
        <h2 id="product-details-title">Detalhes do produto</h2>
        ${items
          .map(
            (item) => `
        <details class="product-accordion">
          <summary>
            <span class="product-accordion-icon">${renderProductLucideIcon(item.icon)}</span>
            <strong>${item.title}</strong>
            <span class="product-accordion-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="m7 9.5 5 5 5-5" /></svg>
            </span>
          </summary>
          <div class="product-accordion-content">
            ${item.content}
          </div>
        </details>`,
          )
          .join('')}
      </section>`;
  };

  const renderFeatureList = (product) => {
    const specs = product.specs || {};
    const capacity = getSpecValue(specs, 'capacidade', 'Capacidade', 'potencia', 'Potencia', 'Pot&ecirc;ncia');
    const application = getSpecValue(specs, 'aplicacao', 'Aplicacao', 'Aplica&ccedil;&atilde;o');
    const availability = getSpecValue(specs, 'disponibilidade', 'Disponibilidade') || getMachineStatusLabel(product);
    const items = [
      ['Categoria', product.category],
      capacity ? ['Especifica&ccedil;&atilde;o principal', capacity] : null,
      application ? ['Aplica&ccedil;&atilde;o', application] : null,
      ['Disponibilidade', availability],
    ].filter(Boolean);

    return `
      <ul class="product-detail-list">
        ${items
          .map(
            ([label, value]) => `
        <li>
          <span>${label}</span>
          <strong>${displayText(value)}</strong>
        </li>`,
          )
          .join('')}
      </ul>`;
  };

  const renderSpecsGrid = (product) => {
    const entries = getTechnicalSpecEntries(product);

    if (!entries.length) {
      return '<p>Especifica&ccedil;&otilde;es t&eacute;cnicas sob valida&ccedil;&atilde;o conforme aplica&ccedil;&atilde;o e configura&ccedil;&atilde;o do equipamento.</p>';
    }

    return `
      <ul class="product-accordion-spec-list">
        ${entries
          .map(
            ({ key, label, value }) => `
        <li>
          <span class="product-spec-list-icon" aria-hidden="true">
            ${renderProductLucideIcon(getSpecIconName(key, label))}
          </span>
          <div>
            <span>${label}</span>
            <strong>${displayText(value)}</strong>
          </div>
        </li>`,
          )
          .join('')}
      </ul>`;
  };

  const renderDeliveryWarranty = (product) => {
    const specs = product.specs || {};
    const availability = getSpecValue(specs, 'disponibilidade', 'Disponibilidade') || getMachineStatusLabel(product);

    return `
      <div class="product-condition-box">
        <div>
          <span class="product-condition-label">Disponibilidade:</span>
          <strong>${displayText(availability)}</strong>
        </div>
        <p>${displayText(getDeliveryWarrantyCopy(product, availability))}</p>
      </div>`;
  };

  const getProductBenefitItems = (product) => {
    const category = normalizeText(product.category);

    if (category.includes('prensa')) {
      return [
        { icon: 'gauge', text: 'For&ccedil;a constante' },
        { icon: 'badge-plus', text: 'Estrutura refor&ccedil;ada' },
        { icon: 'repeat-2', text: 'Ciclos est&aacute;veis' },
      ];
    }

    if (category.includes('misturador')) {
      return [
        { icon: 'refresh-cw', text: 'Mistura homog&ecirc;nea' },
        { icon: 'gauge', text: 'Opera&ccedil;&atilde;o cont&iacute;nua' },
        { icon: 'sliders-horizontal', text: 'Rendimento est&aacute;vel' },
      ];
    }

    if (category.includes('guilhotina')) {
      return [
        { icon: 'crosshair', text: 'Corte preciso' },
        { icon: 'badge-check', text: 'Estrutura robusta' },
        { icon: 'shield-check', text: 'Seguran&ccedil;a operacional' },
      ];
    }

    if (category.includes('unidade')) {
      return [
        { icon: 'sliders-horizontal', text: 'Controle de press&atilde;o' },
        { icon: 'repeat-2', text: 'Integra&ccedil;&atilde;o segura' },
        { icon: 'zap', text: 'Resposta hidr&aacute;ulica' },
      ];
    }

    if (category.includes('raspador')) {
      return [
        { icon: 'crosshair', text: 'Acabamento uniforme' },
        { icon: 'sliders-horizontal', text: 'Ajuste sob demanda' },
        { icon: 'refresh-cw', text: 'Processo consistente' },
      ];
    }

    if (category.includes('pecas') || category.includes('componentes')) {
      return [
        { icon: 'badge-check', text: 'Compatibilidade validada' },
        { icon: 'sliders-horizontal', text: 'Reposi&ccedil;&atilde;o t&eacute;cnica' },
        { icon: 'headphones', text: 'Suporte na aplica&ccedil;&atilde;o' },
      ];
    }

    return [
      { icon: 'crosshair', text: 'Projeto sob medida' },
      { icon: 'shield-check', text: 'Valida&ccedil;&atilde;o t&eacute;cnica' },
      { icon: 'headphones', text: 'Suporte especializado' },
    ];
  };

  const getTechnicalSpecEntries = (product) => {
    const specs = product.specs || {};
    const entries = [
      { key: 'modelo', label: 'Modelo', value: getSpecValue(specs, 'modelo', 'Modelo') },
      {
        key: 'capacidade',
        label: 'Capacidade',
        value: getSpecValue(specs, 'capacidade', 'Capacidade', 'potencia', 'Potencia', 'Pot&ecirc;ncia', 'larguraCorte', 'Largura de corte'),
      },
      { key: 'ano', label: 'Ano', value: getSpecValue(specs, 'ano', 'Ano') },
      { key: 'estado', label: 'Estado', value: getSpecValue(specs, 'estado', 'Estado', 'condicao', 'Condi&ccedil;&atilde;o') },
      { key: 'acionamento', label: 'Acionamento', value: getSpecValue(specs, 'acionamento', 'Acionamento') },
      { key: 'tensao', label: 'Tens&atilde;o', value: getSpecValue(specs, 'tensao', 'Tensao', 'Tens&atilde;o') },
      { key: 'dimensoes', label: 'Dimens&otilde;es', value: getSpecValue(specs, 'dimensoes', 'Dimens&otilde;es') },
      { key: 'peso', label: 'Peso', value: getSpecValue(specs, 'peso', 'Peso') },
    ];

    return entries.filter(({ value }) => !isBlank(value));
  };

  const getSpecIconName = (key, label) => {
    const normalized = normalizeText(`${key} ${label}`);

    if (normalized.includes('modelo')) return 'box';
    if (normalized.includes('capacidade') || normalized.includes('potencia') || normalized.includes('pressao')) return 'gauge';
    if (normalized.includes('ano')) return 'calendar-days';
    if (normalized.includes('estado') || normalized.includes('condicao') || normalized.includes('dispon')) return 'shield-check';
    if (normalized.includes('acionamento')) return 'power';
    if (normalized.includes('tensao')) return 'plug';
    if (normalized.includes('dimens')) return 'ruler';
    if (normalized.includes('peso')) return 'weight';
    return 'settings-2';
  };

  const getDeliveryWarrantyCopy = (product, availability) => {
    const status = normalizeText(product.statusLabel || availability);

    if (status.includes('pronta entrega')) {
      return 'Item com libera&ccedil;&atilde;o r&aacute;pida conforme disponibilidade de estoque. O prazo final e as condi&ccedil;&otilde;es de garantia s&atilde;o confirmados pela equipe ALS no envio do or&ccedil;amento.';
    }

    if (status.includes('dispon')) {
      return 'Equipamento com disponibilidade comercial ativa. A equipe ALS valida configura&ccedil;&atilde;o, prazo de expedi&ccedil;&atilde;o e cobertura de garantia antes da confirma&ccedil;&atilde;o do pedido.';
    }

    if (status.includes('reservad')) {
      return 'Item com disponibilidade condicionada. A equipe ALS confirma reabertura comercial, prazo de atendimento e condi&ccedil;&otilde;es de garantia conforme a situa&ccedil;&atilde;o do equipamento.';
    }

    if (status.includes('manutenc')) {
      return 'Equipamento em atualiza&ccedil;&atilde;o t&eacute;cnica. O prazo de libera&ccedil;&atilde;o e as condi&ccedil;&otilde;es de garantia s&atilde;o informados pela ALS ap&oacute;s a conclus&atilde;o da avalia&ccedil;&atilde;o.';
    }

    return 'Prazo de entrega, configura&ccedil;&atilde;o comercial e cobertura de garantia s&atilde;o definidos pela equipe ALS de acordo com a aplica&ccedil;&atilde;o e a disponibilidade do equipamento.';
  };

  const getMachineStatusLabel = (product) => {
    const label = product.statusLabel || product.commercialStatusLabel;
    if (label) return label;

    const status = String(product.status || product.commercialStatus || 'sob-consulta').trim();
    return statusLabelMap[status] || humanizeSlug(status);
  };

  const getMachineStatus = (product) =>
    String(product.status || product.commercialStatus || 'sob-consulta').trim();

  const allowsQuote = (product) => getMachineStatus(product) !== 'sob-consulta';

  const getSpecValue = (specs, ...keys) => {
    for (const key of keys) {
      if (!isBlank(specs[key])) return specs[key];
    }

    return '';
  };

  const renderProductLucideIcon = (name) => `
    <i class="product-lucide-icon" data-lucide="${escapeAttr(name)}"></i>
    <svg class="product-icon-fallback" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>`;

  const updateActionButtons = (product) => {
    const actionContainer = document.querySelector('.product-action-buttons');
    if (actionContainer) {
      actionContainer.outerHTML = renderProductActionButtons(product);
    }

    document.querySelectorAll('[data-add-quote], [data-product-whatsapp]').forEach((button) => {
      if (button.hasAttribute('data-add-quote')) button.dataset.addQuote = product.id;
      if (button.hasAttribute('data-product-whatsapp')) button.dataset.productWhatsapp = product.id;

      button.dataset.quoteId = product.id;
      button.dataset.quoteName = decodeHtml(product.name || '');
      button.dataset.quoteCategory = decodeHtml(product.category || '');
      button.dataset.quoteSlug = product.slug || '';
      button.dataset.quoteImage = product.image || product.mainImageUrl || '';
    });
  };

  const renderProductActionButtons = (product) => {
    if (!allowsQuote(product)) {
      return `
        <div class="product-action-buttons product-action-buttons-single">
          <button class="catalog-btn primary product-cta" type="button" data-availability="${escapeAttr(product.id)}">Consultar disponibilidade</button>
        </div>`;
    }

    return `
      <div class="product-action-buttons">
        <button class="catalog-btn primary product-cta" type="button" data-add-quote="${escapeAttr(product.id)}">
          ${renderProductCartIcon()}
          <span>Adicionar ao carrinho</span>
        </button>
        <button class="catalog-btn product-quote-request" type="button" data-product-whatsapp="${escapeAttr(product.id)}">
          ${renderProductWhatsAppIcon()}
          <span>Solicitar or&ccedil;amento</span>
        </button>
      </div>`;
  };

  const renderProductCartIcon = () => `
    <span class="product-action-cart-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        <path d="M8 10h9.4a4 4 0 0 1 3.9 3.2L22.5 19H54a4 4 0 0 1 3.9 4.8l-4.7 22A5 5 0 0 1 48.3 50H25.2a5 5 0 0 1-4.9-4L14 16H8a3 3 0 0 1 0-6Zm17.1 34h22.2l3.9-19H23.8l1.3 19ZM25 60a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm23 0a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
      </svg>
    </span>`;

  const renderProductWhatsAppIcon = () => `
    <span class="product-action-whatsapp-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path class="product-action-whatsapp-bubble" d="M12.04 2.25a9.6 9.6 0 0 0-8.17 14.62l-1 4.88 4.98-1a9.56 9.56 0 0 0 4.19.98h.01a9.74 9.74 0 0 0 9.7-9.73 9.7 9.7 0 0 0-9.71-9.75Z" />
        <path class="product-action-whatsapp-phone" d="M16.73 14.44c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.57.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06a7.82 7.82 0 0 1-2.3-1.42 8.64 8.64 0 0 1-1.59-1.98c-.17-.29-.02-.45.13-.59.13-.13.3-.34.45-.51.15-.17.2-.3.3-.49.1-.19.05-.36-.02-.51-.08-.13-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.79 2.74 4.34 3.84.61.26 1.08.42 1.45.53.61.19 1.16.16 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.3Z" />
      </svg>
    </span>`;

  const updateProductGallery = (product) => {
    const panel = document.querySelector('[data-product-gallery]');
    if (!panel) return;

    const gallery = getProductGallery(product);
    if (!gallery.length) return;

    panel.innerHTML = renderGalleryMarkup(product, gallery);
    els.mainImage = document.querySelector('[data-detail-main-image]');
    applyRatioImageZoom(panel);
    ensureGalleryLightbox();
    refreshGalleryLightboxTargets();
  };

  const renderGalleryMarkup = (product, gallery) => {
    const imageAlt = displayText(product.imageAlt || product.name || 'Produto ALS');
    const hasMultiple = gallery.length > 1;

    return `
      <div class="product-gallery-stage">
        <button class="product-gallery-arrow product-gallery-arrow-prev" type="button" data-gallery-prev aria-label="Imagem anterior" ${hasMultiple ? '' : 'hidden'}>
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <img class="product-gallery-image" src="${escapeAttr(resolveAssetSrc(gallery[0]))}" alt="${imageAlt}" data-detail-main-image data-gallery-active-index="0" data-gallery-open role="button" tabindex="0" aria-label="Ampliar imagem do produto">
        <button class="product-gallery-arrow product-gallery-arrow-next" type="button" data-gallery-next aria-label="Pr&oacute;xima imagem" ${hasMultiple ? '' : 'hidden'}>
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
        <div class="product-gallery-dots" aria-label="Paginacao da galeria">
          ${gallery
            .map(
              (_, index) => `
              <button class="product-gallery-dot ${index === 0 ? 'active' : ''}" type="button" data-gallery-dot="${index}" aria-label="Ir para imagem ${index + 1}" aria-pressed="${index === 0 ? 'true' : 'false'}"></button>`,
            )
            .join('')}
        </div>
      </div>
      <div class="product-thumb-carousel">
        <button class="product-thumb-scroll" type="button" data-gallery-thumbs-prev aria-label="Rolar miniaturas para esquerda" ${hasMultiple ? '' : 'hidden'}>
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <div class="product-thumb-row" data-gallery-thumbs aria-label="Selecionar imagem do produto">
          ${gallery
            .map((image, index) => {
              const src = resolveAssetSrc(image);
              return `
              <button class="product-thumb ${index === 0 ? 'active' : ''}" type="button" data-detail-thumb="${escapeAttr(src)}" data-gallery-index="${index}" aria-label="Ver imagem ${index + 1} de ${gallery.length}" aria-pressed="${index === 0 ? 'true' : 'false'}">
                <img src="${escapeAttr(src)}" alt="${imageAlt}" loading="lazy">
              </button>`;
            })
            .join('')}
        </div>
        <button class="product-thumb-scroll" type="button" data-gallery-thumbs-next aria-label="Rolar miniaturas para direita" ${hasMultiple ? '' : 'hidden'}>
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
    `;
  };

  const getProductGallery = (product) => {
    const gallery = Array.isArray(product.gallery)
      ? product.gallery
      : Array.isArray(product.galleryImageUrls)
        ? product.galleryImageUrls
        : [];
    const image = product.image || product.mainImageUrl || '';
    const unique = [];

    [image, ...gallery].forEach((item) => {
      const value = String(item || '').trim();
      if (value && !unique.includes(value)) unique.push(value);
    });

    return unique;
  };

  const applyRatioImageZoom = (root = document) => {
    root
      .querySelectorAll('.machine-card-media img, .product-gallery-image, .product-thumb img')
      .forEach(prepareRatioImageZoom);
  };

  const prepareRatioImageZoom = (image) => {
    image.classList.remove(RATIO_ZOOM_CLASS);

    if (!image.dataset.ratioZoomBound) {
      image.addEventListener('load', () => updateRatioImageZoom(image));
      image.addEventListener('error', () => image.classList.remove(RATIO_ZOOM_CLASS));
      image.dataset.ratioZoomBound = 'true';
    }

    updateRatioImageZoom(image);
  };

  const updateRatioImageZoom = (image) => {
    const { naturalWidth, naturalHeight } = image;
    const hasTargetRatio =
      naturalWidth > 0
      && naturalHeight > 0
      && Math.abs(naturalWidth / naturalHeight - RATIO_375_200) <= RATIO_TOLERANCE;

    image.classList.toggle(RATIO_ZOOM_CLASS, hasTargetRatio);
  };

  const getAccordionContentByTitle = (title) => {
    const normalizedTitle = decodeHtml(title).toLowerCase();
    return Array.from(document.querySelectorAll('.product-accordion')).find((accordion) => {
      const summaryTitle = decodeHtml(accordion.querySelector('summary strong')?.textContent || '')
        .trim()
        .toLowerCase();
      return summaryTitle === normalizedTitle;
    })?.querySelector('.product-accordion-content');
  };

  // Produto - equipamentos semelhantes
  const initSimilarSlider = () => {
    const root = document.querySelector('[data-similar-section]');
    const slider = root?.querySelector('[data-similar-slider]');
    const track = root?.querySelector('[data-similar-track]');
    const prev = root?.querySelector('[data-similar-prev]');
    const next = root?.querySelector('[data-similar-next]');
    const cards = track ? Array.from(track.querySelectorAll('.product-similar-card')) : [];

    if (!root || !slider || !track || cards.length <= 1) return;

    const mobileQuery = window.matchMedia('(max-width: 1000px)');
    let currentIndex = 0;

    const getGap = () => {
      const style = window.getComputedStyle(track);
      return Number.parseFloat(style.columnGap || style.gap || '0') || 0;
    };

    const getStep = () => {
      const card = cards[0];
      if (!card) return 0;
      return card.getBoundingClientRect().width + getGap();
    };

    const getVisibleCount = () => {
      const step = getStep();
      if (!step) return 1;
      const rawVisible = (slider.clientWidth + getGap()) / step;
      return Math.max(1, Math.round(rawVisible));
    };

    const getMaxIndex = () => Math.max(0, cards.length - getVisibleCount());

    const update = () => {
      if (mobileQuery.matches) {
        track.style.transform = '';
        prev && (prev.disabled = true);
        next && (next.disabled = true);
        return;
      }

      const maxIndex = getMaxIndex();
      currentIndex = Math.min(Math.max(0, currentIndex), maxIndex);
      track.style.transform = `translate3d(${-currentIndex * getStep()}px, 0, 0)`;
      if (prev) prev.disabled = currentIndex <= 0;
      if (next) next.disabled = currentIndex >= maxIndex;
    };

    prev?.addEventListener('click', () => {
      currentIndex -= 1;
      update();
    });

    next?.addEventListener('click', () => {
      currentIndex += 1;
      update();
    });

    window.addEventListener('resize', update);
    mobileQuery.addEventListener?.('change', () => {
      currentIndex = 0;
      update();
    });

    update();
  };

  // Produto - renderizacao e helpers
  function renderQuote() {
    const items = quote.getItems();
    const total = items.reduce((sum, item) => sum + item.quantity, 0);

    els.quoteCount.forEach((node) => {
      if (node.dataset.quoteCountFormat === 'number') {
        node.textContent = String(total);
      } else {
        node.textContent = `${total} item${total === 1 ? '' : 's'}`;
      }

      if (node.classList.contains('quote-fixed-count-badge')) {
        node.hidden = total === 0;
      }
    });

    els.quoteWhatsApp.forEach((button) => {
      button.disabled = total === 0 && !button.closest('[data-quote-fixed-bar]');
    });

    if (els.quoteFixedBar) {
      const keepMobileCartVisible = els.mobileCartQuery.matches
        || els.quoteFixedBar.classList.contains('quote-fixed-bar-mobile');
      els.quoteFixedBar.hidden = total === 0 && !keepMobileCartVisible;
      if (!els.quoteFixedBar.classList.contains('quote-fixed-bar-mobile')) {
        document.body.classList.toggle('quote-bar-visible', total > 0);
      }
    }

    els.quoteClear.forEach((button) => {
      button.hidden = total === 0;
    });

    const quoteContainers = [els.quoteItems, els.quoteModalItems].filter(Boolean);
    if (!quoteContainers.length) return;

    if (!items.length) {
      quoteContainers.forEach((container) => {
        container.innerHTML = `
        <div class="quote-empty">
          <p>Adicione produtos para montar o or&ccedil;amento.</p>
        </div>
      `;
      });
      return;
    }

    const markup = items
      .map(
        (item) => {
          const itemId = escapeAttr(item.id);
          const itemImage = escapeAttr(
            resolveAssetSrc(item.image || machine.image || machine.mainImageUrl || 'assets/imgs/portfolio.webp'),
          );
          const itemName = displayText(item.name);
          const itemCategory = displayText(item.category);
          return `
          <article class="quote-item">
            <div class="quote-item-image">
              <img src="${itemImage}" alt="${itemName}" loading="lazy">
            </div>
            <div class="quote-item-content">
              <strong>${itemName}</strong>
              <span>${itemCategory}</span>
              <div class="quote-qty" aria-label="Quantidade">
                <button type="button" data-quote-change="${itemId}" data-delta="-1" aria-label="Diminuir quantidade">-</button>
                <strong>${item.quantity}</strong>
                <button type="button" data-quote-change="${itemId}" data-delta="1" aria-label="Aumentar quantidade">+</button>
              </div>
            </div>
            <button class="quote-remove" type="button" data-quote-remove="${itemId}" aria-label="Remover ${itemName}">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M5 7h14" />
                <path d="M9.2 7V4.8h5.6V7" />
                <path d="M7.2 9.4l.5 8.2a2.3 2.3 0 0 0 2.3 2.1h4a2.3 2.3 0 0 0 2.3-2.1l.5-8.2" />
                <path class="quote-trash-inner-line" d="M10.4 11.4v5.2" />
                <path class="quote-trash-inner-line" d="M13.6 11.4v5.2" />
              </svg>
            </button>
          </article>
        `;
        },
      )
      .join('');

    quoteContainers.forEach((container) => {
      container.innerHTML = markup;
    });
  }

  function parseMachine(jsonNode) {
    if (!jsonNode) return null;

    try {
      const parsed = JSON.parse(jsonNode.textContent);
      return typeof catalogNormalizer.normalizeProduct === 'function'
        ? catalogNormalizer.normalizeProduct(parsed, parsed.slug || parsed.id)
        : parsed;
    } catch (error) {
      console.error('Nao foi possivel carregar os dados da maquina.', error);
      return null;
    }
  }

  function displayText(value) {
    return escapeHtml(decodeHtml(value));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function resolveAssetSrc(value) {
    const raw = decodeHtml(value || '');
    if (/^(https?:|data:|\/)/i.test(raw)) return raw;

    const assetMatch = raw.match(/assets\/.+$/);
    if (!assetMatch) return raw;

    const isNestedCatalogPage = window.location.pathname.includes('/catalogo/maquinas/');
    return `${isNestedCatalogPage ? '../../../' : ''}${assetMatch[0]}`;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return entities[char];
    });
  }

  function decodeHtml(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value || '';
    return textarea.value;
  }

  function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === '';
  }

  function normalizeText(value) {
    if (typeof catalogNormalizer.stripHtml === 'function') {
      return catalogNormalizer
        .stripHtml(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    }

    return decodeHtml(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function humanizeSlug(value) {
    return String(value || '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase()) || 'Sob consulta';
  }

  function sameText(left, right) {
    return decodeHtml(left).trim().toLowerCase() === decodeHtml(right).trim().toLowerCase();
  }

  function parseQuoteMachineFromButton(button) {
    const id = button.dataset.quoteId;
    if (!id) return null;

    return {
      id,
      name: button.dataset.quoteName || machine.name,
      category: button.dataset.quoteCategory || machine.category,
      slug: button.dataset.quoteSlug || '',
      image: button.dataset.quoteImage || '',
    };
  }

  init();
})();
