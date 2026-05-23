(() => {
  // Catalogo - configuracao, dados e referencias do DOM
  const catalogNormalizer = window.ALSCatalogNormalizer || {};
  const HERO_AUTOPLAY_DELAY = 4200;
  const MOBILE_CART_QUERY = '(max-width: 1080px)';
  const RATIO_ZOOM_CLASS = 'als-ratio-375-200';
  const RATIO_375_200 = 375 / 200;
  const RATIO_TOLERANCE = 0.01;
  const generatedMachines = Array.isArray(window.ALS_CATALOG_MACHINES)
    ? window.ALS_CATALOG_MACHINES
    : [];
  let machines = getCatalogMachines(getCatalogSource(generatedMachines));
  const quote = window.ALSQuoteList;

  const state = {
    search: '',
    category: 'Todas',
  };

  const els = {
    grid: document.querySelector('[data-catalog-grid]'),
    count: document.querySelector('[data-catalog-count]'),
    search: document.querySelector('[data-catalog-search]'),
    filters: document.querySelector('[data-catalog-filters]'),
    categorySelect: document.querySelector('[data-catalog-category-select]'),
    categoryInput: document.querySelector('[data-catalog-category-input]'),
    categoryTrigger: document.querySelector('[data-catalog-category-trigger]'),
    categoryLabel: document.querySelector('[data-catalog-category-label]'),
    loading: document.querySelector('[data-catalog-loading]'),
    empty: document.querySelector('[data-catalog-empty]'),
    error: document.querySelector('[data-catalog-error]'),
    quoteItems: document.querySelector('[data-quote-items]'),
    quoteModal: null,
    quoteModalItems: null,
    quoteCount: document.querySelectorAll('[data-quote-count]'),
    quoteWhatsApp: document.querySelectorAll('[data-quote-whatsapp]'),
    quoteClear: document.querySelectorAll('[data-quote-clear]'),
    quoteFixedBar: document.querySelector('[data-quote-fixed-bar]'),
    mobileCartQuery: window.matchMedia(MOBILE_CART_QUERY),
  };

  const statusClassMap = {
    disponivel: 'status-available',
    'pronta-entrega': 'status-ready',
    'sob-consulta': 'status-consult',
    reservada: 'status-limited',
    vendida: 'status-unavailable',
    locada: 'status-unavailable',
    manutencao: 'status-unavailable',
    indisponivel: 'status-unavailable',
  };

  const statusLabelMap = {
    disponivel: 'Dispon&iacute;vel',
    'pronta-entrega': 'Pronta entrega',
    'sob-consulta': 'Sob consulta',
    reservada: 'Reservada',
    vendida: 'Vendida',
    locada: 'Locada',
    manutencao: 'Em manuten&ccedil;&atilde;o',
    indisponivel: 'Indispon&iacute;vel',
  };

  // Catalogo - inicializacao e eventos
  const init = () => {
    initCatalogHero();
    ensureQuoteModal();
    refreshQuoteTargets();
    renderFilters();
    bindEvents();
    setLoading(false);
    renderCatalog();
    renderQuote();
    scheduleCatalogHydration();
  };

  const scheduleCatalogHydration = () => {
    const hydrate = () => {
      hydrateCatalogFromCMS();
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(hydrate, { timeout: 1200 });
      return;
    }

    window.setTimeout(hydrate, 500);
  };

  const hydrateCatalogFromCMS = async () => {
    const products = await window.ALSCatalogCMS?.loadProducts?.();
    if (!Array.isArray(products) || !products.length) return;

    machines = getCatalogMachines(getCatalogSource(products));
    renderFilters();
    renderCatalog();
    renderQuote();
  };

  const bindEvents = () => {
    els.search?.addEventListener('input', (event) => {
      state.search = event.target.value.trim().toLowerCase();
      renderCatalog();
    });

    els.filters?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.category = button.dataset.category;
      renderFilters();
      renderCatalog();
      closeCatalogCategorySelect();
      els.categoryTrigger?.focus();
    });

    els.categoryTrigger?.addEventListener('click', () => {
      toggleCatalogCategorySelect();
    });

    els.categorySelect?.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeCatalogCategorySelect();
      els.categoryTrigger?.focus();
    });

    document.addEventListener('click', (event) => {
      if (!els.categorySelect || els.categorySelect.contains(event.target)) return;
      closeCatalogCategorySelect();
    });

    els.grid?.addEventListener('click', (event) => {
      const quoteButton = event.target.closest('[data-add-quote]');
      const availabilityButton = event.target.closest('[data-availability]');

      if (quoteButton) {
        const machine = machines.find((item) => item.id === quoteButton.dataset.addQuote);
        if (!machine) return;
        quote.addItem(machine);
        renderQuote();
      }

      if (availabilityButton) {
        const machine = machines.find(
          (item) => item.id === availabilityButton.dataset.availability,
        );
        if (!machine) return;
        quote.openAvailability(machine);
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
      if (event.key === 'Escape') {
        closeQuoteModal();
      }
    });

    els.mobileCartQuery.addEventListener?.('change', renderQuote);
    window.addEventListener('als:quote-updated', renderQuote);
  };

  // Catalogo - carrinho e modal de orcamento
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

  // Catalogo - hero slider
  const initCatalogHero = () => {
    const hero = document.querySelector('[data-catalog-hero]');
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const tabs = Array.from(hero.querySelectorAll('[data-hero-tab]'));
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!slides.length) return;

    hero.style.setProperty('--catalog-hero-delay', `${HERO_AUTOPLAY_DELAY}ms`);

    let current = Math.max(
      slides.findIndex((slide) => slide.classList.contains('active')),
      0,
    );
    let autoplayTimer = null;
    let autoplayStartedAt = 0;
    let autoplayRemaining = HERO_AUTOPLAY_DELAY;
    let frameId = null;
    let isPaused = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const stopAutoplay = (options = {}) => {
      if (autoplayTimer) {
        if (options.keepRemaining && autoplayStartedAt) {
          const elapsed = window.performance.now() - autoplayStartedAt;
          autoplayRemaining = Math.max(700, autoplayRemaining - elapsed);
        }
        window.clearTimeout(autoplayTimer);
        autoplayTimer = null;
        autoplayStartedAt = 0;
      }
    };

    const scheduleAutoplay = (delay = autoplayRemaining) => {
      stopAutoplay();
      if (reducedMotionQuery.matches || isPaused || document.hidden || slides.length < 2) return;

      autoplayRemaining = Math.max(700, delay);
      autoplayStartedAt = window.performance.now();
      autoplayTimer = window.setTimeout(() => {
        autoplayRemaining = HERO_AUTOPLAY_DELAY;
        setHeroSlide(current + 1, { autoplay: true });
        scheduleAutoplay(HERO_AUTOPLAY_DELAY);
      }, autoplayRemaining);
    };

    const pauseAutoplay = () => {
      if (isPaused) return;
      isPaused = true;
      hero.classList.add('is-paused');
      stopAutoplay({ keepRemaining: true });
    };

    const resumeAutoplay = () => {
      if (!isPaused) return;
      isPaused = false;
      hero.classList.remove('is-paused');
      scheduleAutoplay();
    };

    function setHeroSlide(index, options = {}) {
      const next = (index + slides.length) % slides.length;
      const shouldScrollTab = options.manual && !options.autoplay;

      if (next === current && !options.instant) {
        return;
      }

      current = next;

      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === current;
          slide.classList.toggle('active', isActive);
          slide.setAttribute('aria-hidden', String(!isActive));
          if (isActive) {
            slide.removeAttribute('inert');
          } else {
            slide.setAttribute('inert', '');
          }
        });

        tabs.forEach((tab, tabIndex) => {
          const isActive = tabIndex === current;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
          tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        if (shouldScrollTab) {
          tabs[current]?.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
            behavior: options.instant ? 'auto' : 'smooth',
          });
        }
      });

      if (options.manual) {
        autoplayRemaining = HERO_AUTOPLAY_DELAY;
        scheduleAutoplay(HERO_AUTOPLAY_DELAY);
      }
    }

    const applyHeroCategory = (category) => {
      const nextCategory = category || slides[current]?.dataset.heroCategory || 'Todas';
      state.category = nextCategory;
      renderFilters();
      renderCatalog();

      document.querySelector('.catalog-main')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        setHeroSlide(index, { manual: true });
      });
    });

    hero.addEventListener('click', (event) => {
      const cta = event.target.closest('[data-hero-cta]');
      if (!cta) return;
      applyHeroCategory(cta.dataset.heroCategory);
    });

    hero.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setHeroSlide(current - 1, { manual: true });
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setHeroSlide(current + 1, { manual: true });
      }
    });

    hero.addEventListener('pointerover', (event) => {
      if (event.target.closest('[data-hero-tab].active')) pauseAutoplay();
    });

    hero.addEventListener('pointerout', (event) => {
      const activeTab = event.target.closest('[data-hero-tab].active');
      if (!activeTab || activeTab.contains(event.relatedTarget)) return;
      resumeAutoplay();
    });

    hero.addEventListener('focusin', (event) => {
      if (event.target.closest('[data-hero-tab].active')) pauseAutoplay();
    });

    hero.addEventListener('focusout', (event) => {
      const activeTab = event.target.closest('[data-hero-tab].active');
      if (!activeTab || activeTab.contains(event.relatedTarget)) return;
      resumeAutoplay();
    });

    hero.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true },
    );

    hero.addEventListener(
      'touchend',
      (event) => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
        setHeroSlide(current + (deltaX < 0 ? 1 : -1), { manual: true });
      },
      { passive: true },
    );

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay({ keepRemaining: true });
      } else if (!isPaused) {
        scheduleAutoplay();
      }
    });

    reducedMotionQuery.addEventListener?.('change', () => {
      if (reducedMotionQuery.matches) {
        stopAutoplay();
      } else {
        autoplayRemaining = HERO_AUTOPLAY_DELAY;
        scheduleAutoplay(HERO_AUTOPLAY_DELAY);
      }
    });

    setHeroSlide(current, { instant: true });
    scheduleAutoplay(HERO_AUTOPLAY_DELAY);
  };

  // Catalogo - filtros e select de categorias
  const renderFilters = () => {
    if (!els.filters) return;

    const categories = [
      'Todas',
      ...Array.from(new Set(machines.map((machine) => machine.category))),
    ];

    els.filters.innerHTML = categories
      .map((category) => {
        const displayCategory = decodeHtml(category);
        const isActive = displayCategory === state.category;
        return `
          <button
            type="button"
            class="catalog-filter ${isActive ? 'active' : ''}"
            role="option"
            aria-selected="${isActive ? 'true' : 'false'}"
            data-category="${escapeAttr(displayCategory)}"
          >
            <span>${displayText(category)}</span>
          </button>
        `;
      })
      .join('');

    syncCatalogCategorySelect();
  };

  const syncCatalogCategorySelect = () => {
    const isAll = state.category === 'Todas';
    if (els.categoryInput) {
      els.categoryInput.value = isAll ? '' : state.category;
    }
    if (els.categoryLabel) {
      els.categoryLabel.textContent = isAll ? 'Todas categorias' : state.category;
    }
  };

  const toggleCatalogCategorySelect = () => {
    if (!els.categorySelect || !els.filters) return;
    const isOpen = els.categorySelect.classList.contains('open');
    if (isOpen) {
      closeCatalogCategorySelect();
      return;
    }
    els.categorySelect.classList.add('open');
    els.filters.hidden = false;
    els.categoryTrigger?.setAttribute('aria-expanded', 'true');
  };

  const closeCatalogCategorySelect = () => {
    els.categorySelect?.classList.remove('open');
    if (els.filters) els.filters.hidden = true;
    els.categoryTrigger?.setAttribute('aria-expanded', 'false');
  };

  // Catalogo - listagem de maquinas
  const renderCatalog = () => {
    if (!els.grid) return;

    const filtered = getFilteredMachines();
    els.grid.innerHTML = filtered.map(renderMachineCard).join('');

    if (els.count) {
      els.count.innerHTML = `
        <span class="catalog-count-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <g transform="translate(0 -1.7)">
              <path d="M6.1 5.2h2.2l.3 1.2.9.4 1.2-.7 1.6 1.6-.7 1.2.4.9 1.2.3v2.2l-1.2.3-.4.9.7 1.2-1.6 1.6-1.2-.7-.9.4-.3 1.2H6.1L5.8 16l-.9-.4-1.2.7-1.6-1.6.7-1.2-.4-.9-1.2-.3v-2.2l1.2-.3.4-.9-.7-1.2 1.6-1.6 1.2.7.9-.4.3-1.2Zm1.1 8.9a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z" />
              <path d="M17.5 6.7h1.8l.2.9.7.3.8-.5 1.3 1.3-.5.8.3.7.9.2v1.8l-.9.2-.3.7.5.8-1.3 1.3-.8-.5-.7.3-.2.9h-1.8l-.2-.9-.7-.3-.8.5-1.3-1.3.5-.8-.3-.7-.9-.2v-1.8l.9-.2.3-.7-.5-.8 1.3-1.3.8.5.7-.3.2-.9Zm.9 6.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" />
              <path d="M12.2 17h1.6l.2.8.6.3.8-.4 1.1 1.1-.4.8.3.6.8.2V22l-.8.2-.3.6.4.8-1.1 1.1-.8-.4-.6.3-.2.8h-1.6l-.2-.8-.6-.3-.8.4-1.1-1.1.4-.8-.3-.6-.8-.2v-1.6l.8-.2.3-.6-.4-.8 1.1-1.1.8.4.6-.3.2-.8Zm.8 5.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            </g>
          </svg>
        </span>
        <span>${filtered.length} equipamento${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}</span>
      `;
    }

    applyRatioImageZoom(els.grid);
    showState('empty', filtered.length === 0);
  };

  const applyRatioImageZoom = (root = document) => {
    root.querySelectorAll('.machine-card-media img').forEach(prepareRatioImageZoom);
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

  const getFilteredMachines = () =>
    machines.filter((machine) => {
      const matchesCategory =
        state.category === 'Todas' || decodeHtml(machine.category) === state.category;
      const haystack = decodeHtml(
        `${machine.name} ${machine.category} ${machine.shortDescription}`,
      ).toLowerCase();
      const matchesSearch = !state.search || haystack.includes(state.search);
      return matchesCategory && matchesSearch;
    });

  const renderMachineCard = (machine) => {
    const statusClass = statusClassMap[machine.status] || 'status-consult';
    const machineId = escapeAttr(machine.id);
    const machineName = displayText(machine.name);
    const machineImage = escapeAttr(machine.mainImageUrl || machine.image || 'assets/imgs/portfolio.webp');
    const machineDescription = displayText(machine.shortDescription);
    const machineFeatures = renderCardFeatures(machine);
    const detailUrl = String(machine.detailUrl || '').trim();
    const detailLink = detailUrl
      ? `<a class="machine-card-link" href="${escapeAttr(detailUrl)}" aria-label="Ver detalhes de ${machineName}"></a>`
      : '';
    const detailsButton = detailUrl
      ? `<a class="catalog-btn machine-details-btn" href="${escapeAttr(detailUrl)}">Ver detalhes</a>`
      : '';
    const canQuote = allowsQuote(machine);
    const actionButton = canQuote
      ? `<button class="catalog-btn primary machine-cart-btn" type="button" data-add-quote="${machineId}" aria-label="Adicionar ${machineName} ao carrinho" title="Adicionar ao carrinho">
          <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
            <path d="M8 10h9.4a4 4 0 0 1 3.9 3.2L22.5 19H54a4 4 0 0 1 3.9 4.8l-4.7 22A5 5 0 0 1 48.3 50H25.2a5 5 0 0 1-4.9-4L14 16H8a3 3 0 0 1 0-6Zm17.1 34h22.2l3.9-19H23.8l1.3 19ZM25 60a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm23 0a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
          </svg>
        </button>`
      : '';

    return `
      <article class="machine-card">
        ${detailLink}
        <div class="machine-card-media">
          <img src="${machineImage}" alt="${machineName}" loading="lazy" decoding="async">
        </div>
        <div class="machine-card-body">
          <h3>${machineName}</h3>
          <p>${machineDescription}</p>
          ${machineFeatures}
          <div class="machine-actions ${canQuote ? '' : 'single'}">
            ${detailsButton}
            ${actionButton}
          </div>
        </div>
      </article>
    `;
  };

  const renderQuote = () => {
    const items = quote.getItems();
    const total = items.reduce((sum, item) => sum + item.quantity, 0);

    els.quoteCount.forEach((node) => {
      node.textContent = node.dataset.quoteCountFormat === 'number'
        ? String(total)
        : `${total} item${total === 1 ? '' : 's'}`;

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
      document.body.classList.toggle('quote-bar-visible', total > 0);
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
        (item, index) => {
          const itemId = escapeAttr(item.id);
          const machine = machines.find((entry) => entry.id === item.id);
          const itemImage = escapeAttr(
            resolveAssetSrc(item.image || machine?.image || 'assets/imgs/portfolio.webp'),
          );
          const itemName = displayText(item.name);
          const itemCategory = displayText(item.category);
          return `
          <article class="quote-item">
            <div class="quote-item-image">
              <img src="${itemImage}" alt="${itemName}" loading="lazy" decoding="async">
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
  };

  const setLoading = (isLoading) => {
    showState('loading', isLoading);
    if (els.grid) {
      els.grid.style.display = isLoading ? 'none' : '';
    }
  };

  const showState = (stateName, visible) => {
    const stateMap = {
      loading: els.loading,
      empty: els.empty,
      error: els.error,
    };

    Object.entries(stateMap).forEach(([name, node]) => {
      if (!node) return;
      if (name === stateName && visible) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  };

  // Catalogo - normalizacao de dados e helpers
  function getCatalogMachines(source) {
    return source
      .map((machine, index) => ({ ...machine, __catalogOrder: index }))
      .filter((machine) => machine.active !== false)
      .sort((left, right) => {
        const featuredDiff = Number(isFeaturedMachine(right)) - Number(isFeaturedMachine(left));
        if (featuredDiff) return featuredDiff;

        const leftDate = Date.parse(left.updatedAt || left.createdAt || '');
        const rightDate = Date.parse(right.updatedAt || right.createdAt || '');

        if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) {
          return rightDate - leftDate;
        }

        return (left.__catalogOrder || 0) - (right.__catalogOrder || 0);
      })
      .map(({ __catalogOrder, ...machine }) => machine);
  }

  function getCatalogSource(generated) {
    return generated.map((machine) => {
      const normalized =
        typeof catalogNormalizer.normalizeProduct === 'function'
          ? catalogNormalizer.normalizeProduct(machine, machine.slug || machine.id)
          : machine;

      return {
        ...normalized,
        detailUrl: normalized.slug ? `catalogo/maquinas/${normalized.slug}/` : '',
      };
    });
  }

  function normalizeCatalogAsset(path) {
    const value = String(path || '').trim();
    if (!value || /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }

    return value.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
  }

  function isFeaturedMachine(machine) {
    return machine?.featured === true || machine?.destaque === true;
  }

  function renderCardFeatures(machine) {
    const features = getCardFeatures(machine);
    if (!features.length) return '';

    return `
      <ul class="machine-card-features" aria-label="Caracter&iacute;sticas do produto">
        ${features
          .map(
            (feature) => `
              <li>
                ${getFeatureIcon(feature.icon)}
                <span>${displayText(feature.label)}</span>
              </li>
            `,
          )
          .join('')}
      </ul>
    `;
  }

  function getCardFeatures(machine) {
    const features = [];
    const addFeature = (icon, label, maxLength = 18) => {
      if (features.length >= 2) return;
      const cleanLabel = compactFeatureLabel(label, maxLength);
      if (!cleanLabel) return;
      const normalizedLabel = decodeHtml(cleanLabel).toLowerCase();
      const alreadyExists = features.some(
        (feature) => decodeHtml(feature.label).toLowerCase() === normalizedLabel,
      );
      if (alreadyExists) return;
      features.push({ icon, label: cleanLabel });
    };

    getRotatedCategoryFeatures(machine).forEach((feature) => {
      addFeature(feature.icon, feature.label, 20);
    });

    return features.slice(0, 2);
  }

  function getRotatedCategoryFeatures(machine) {
    const pool = getCategoryFeaturePool(machine);
    const offset = getFeatureOffset(machine, pool.length);
    const picked = [];

    for (let index = 0; index < pool.length && picked.length < 2; index += 1) {
      const feature = pool[(offset + index) % pool.length];
      const hasSameIcon = picked.some((item) => item.icon === feature.icon);
      const hasSameLabel = picked.some(
        (item) => decodeHtml(item.label).toLowerCase() === decodeHtml(feature.label).toLowerCase(),
      );
      if (hasSameIcon || hasSameLabel) continue;
      picked.push(feature);
    }

    if (picked.length < 2) {
      pool.forEach((feature) => {
        if (picked.length >= 2) return;
        const hasSameLabel = picked.some(
          (item) => decodeHtml(item.label).toLowerCase() === decodeHtml(feature.label).toLowerCase(),
        );
        if (!hasSameLabel) picked.push(feature);
      });
    }

    return picked;
  }

  function getCategoryFeaturePool(machine) {
    const category = decodeHtml(machine.category || '').toLowerCase();
    const statusFeature = getStatusFeature(machine);

    if (category.includes('prensa')) {
      return [
        { icon: 'gauge', label: 'Alta for&ccedil;a' },
        { icon: 'shield', label: 'Ciclos seguros' },
        { icon: 'target', label: 'Precis&atilde;o industrial' },
        { icon: 'cog', label: 'Projeto sob medida' },
        statusFeature,
      ].filter(Boolean);
    }

    if (category.includes('misturador')) {
      return [
        { icon: 'cog', label: 'Mistura est&aacute;vel' },
        { icon: 'gauge', label: 'Alto rendimento' },
        { icon: 'bolt', label: 'Opera&ccedil;&atilde;o cont&iacute;nua' },
        { icon: 'target', label: 'Processo uniforme' },
        statusFeature,
      ].filter(Boolean);
    }

    if (category.includes('guilhotina')) {
      return [
        { icon: 'target', label: 'Corte preciso' },
        { icon: 'shield', label: 'Opera&ccedil;&atilde;o segura' },
        { icon: 'gauge', label: 'Alta produtividade' },
        { icon: 'cog', label: 'Estrutura robusta' },
        statusFeature,
      ].filter(Boolean);
    }

    if (category.includes('unidade')) {
      return [
        { icon: 'bolt', label: 'For&ccedil;a hidr&aacute;ulica' },
        { icon: 'gauge', label: 'Controle de press&atilde;o' },
        { icon: 'cog', label: 'Integra&ccedil;&atilde;o r&aacute;pida' },
        { icon: 'target', label: 'Projeto sob medida' },
        statusFeature,
      ].filter(Boolean);
    }

    if (category.includes('raspador')) {
      return [
        { icon: 'target', label: 'Acabamento limpo' },
        { icon: 'cog', label: 'Ajuste sob demanda' },
        { icon: 'gauge', label: 'Linha produtiva' },
        { icon: 'shield', label: 'Processo confi&aacute;vel' },
        statusFeature,
      ].filter(Boolean);
    }

    return [
      { icon: 'cog', label: 'Reposi&ccedil;&atilde;o t&eacute;cnica' },
      { icon: 'target', label: 'Compatibilidade ALS' },
      { icon: 'shield', label: 'Suporte t&eacute;cnico' },
      { icon: 'bolt', label: 'Resposta r&aacute;pida' },
      statusFeature,
    ].filter(Boolean);
  }

  function getStatusFeature(machine) {
    const status = decodeHtml(machine.statusLabel || getStatusLabel(machine.status)).toLowerCase();
    if (status.includes('pronta')) return { icon: 'bolt', label: 'Entrega &aacute;gil' };
    if (status.includes('dispon')) return { icon: 'shield', label: 'Pronto para cotar' };
    if (status.includes('reserv')) return { icon: 'shield', label: 'Consulte condi&ccedil;&otilde;es' };
    if (status.includes('manuten')) return { icon: 'cog', label: 'Em revis&atilde;o' };
    return { icon: 'target', label: 'Or&ccedil;amento guiado' };
  }

  function getFeatureOffset(machine, length) {
    if (!length) return 0;
    const seed = `${machine.id || ''}${machine.slug || ''}${machine.name || ''}`;
    const hash = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    return hash % length;
  }

  function normalizeSpecValue(value) {
    const normalized = decodeHtml(value || '').trim();
    if (!normalized || normalized === '0') return '';
    if (normalized.toLowerCase() === 'não se aplica') return '';
    if (normalized.toLowerCase() === 'nao se aplica') return '';
    return normalized;
  }

  function getSpecValue(specs, keys) {
    const normalizedTargets = keys.map(normalizeSpecKey);
    const directKey = keys.find((key) => specs[key] != null);
    if (directKey) return normalizeSpecValue(specs[directKey]);

    const foundEntry = Object.entries(specs).find(([key]) =>
      normalizedTargets.includes(normalizeSpecKey(key)),
    );
    return foundEntry ? normalizeSpecValue(foundEntry[1]) : '';
  }

  function normalizeSpecKey(value) {
    return decodeHtml(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&[a-z]+;/gi, '')
      .toLowerCase()
      .trim();
  }

  function compactFeatureLabel(value, maxLength) {
    const cleanValue = decodeHtml(value).replace(/\s+/g, ' ').trim();
    if (cleanValue.length <= maxLength) return cleanValue;
    return `${cleanValue.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
  }

  function getFeatureIcon(type) {
    const icons = {
      gauge:
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.8 15.7a7.5 7.5 0 1 1 14.4 0" /><path d="M12 13.5l3.1-3.1" /><path d="M9.2 17h5.6" /></svg>',
      cog:
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Z" /><path d="M12 3.8v2M12 18.2v2M4.9 7.1l1.4 1.4M17.7 15.5l1.4 1.4M3.8 12h2M18.2 12h2M4.9 16.9l1.4-1.4M17.7 8.5l1.4-1.4" /></svg>',
      bolt:
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.3 3.8 6.8 13h4.9l-1 7.2 6.5-9.2h-4.9l1-7.2Z" /></svg>',
      shield:
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.8 18.2 6v5.3c0 3.9-2.5 7.1-6.2 8.9-3.7-1.8-6.2-5-6.2-8.9V6L12 3.8Z" /><path d="m9.2 12 1.8 1.8 3.8-4" /></svg>',
      target:
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="7.2" /><circle cx="12" cy="12" r="3.1" /><path d="M12 4.8V3M12 21v-1.8M4.8 12H3M21 12h-1.8" /></svg>',
      check:
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6.8 9.6 17.2 4 11.6" /></svg>',
    };

    return icons[type] || icons.check;
  }

  function getStatusLabel(status) {
    return statusLabelMap[status] || status || 'Sob consulta';
  }

  function getMachineStatus(machine) {
    return machine.status || machine.commercialStatus || 'sob-consulta';
  }

  function allowsQuote(machine) {
    return getMachineStatus(machine) !== 'sob-consulta';
  }

  function slugify(value) {
    return decodeHtml(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

  init();
})();
