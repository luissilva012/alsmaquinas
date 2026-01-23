(() => {
  const body = document.body;
  const menuToggle = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.mobile-menu-backdrop');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-links a');
  const megaBackdrop = document.querySelector('.mega-menu-backdrop');
  const megaPanels = document.querySelectorAll('.mega-menu-panel');
  const megaTriggers = document.querySelectorAll('[data-menu-target]');
  const megaCloseButtons = document.querySelectorAll('.mega-close');
  let activeMega = '';

  const setMobileFocusable = (enabled) => {
    if (!mobileMenu) return;
    const focusables = mobileMenu.querySelectorAll('a, button');
    focusables.forEach((el) => {
      if (enabled) {
        el.removeAttribute('tabindex');
      } else {
        el.setAttribute('tabindex', '-1');
      }
    });
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.removeAttribute('inert');
    setMobileFocusable(true);
  };

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.setAttribute('inert', '');
    setMobileFocusable(false);
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = body.classList.contains('menu-open');
      if (isOpen) {
        closeMenu();
      } else {
        closeMegaMenu();
        openMenu();
      }
    });
  }

  backdrop?.addEventListener('click', closeMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));

  function closeMegaMenu() {
    activeMega = '';
    body.classList.remove('mega-open');
    megaPanels.forEach((panel) => {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    });
    megaTriggers.forEach((trigger) =>
      trigger.setAttribute('aria-expanded', 'false'),
    );
  }

  function openMegaMenu(target) {
    let found = false;
    megaPanels.forEach((panel) => {
      const isTarget = panel.dataset.menuPanel === target;
      panel.classList.toggle('active', isTarget);
      panel.setAttribute('aria-hidden', isTarget ? 'false' : 'true');
      if (isTarget) found = true;
    });

    if (found) {
      activeMega = target;
      body.classList.add('mega-open');
      megaTriggers.forEach((trigger) => {
        const isMatch = trigger.dataset.menuTarget === target;
        trigger.setAttribute('aria-expanded', isMatch ? 'true' : 'false');
      });
    } else {
      closeMegaMenu();
    }
  }

  megaTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const target = trigger.dataset.menuTarget;
      if (!target) return;

      const isActive =
        activeMega === target && body.classList.contains('mega-open');

      if (isActive) {
        closeMegaMenu();
        return;
      }

      if (body.classList.contains('menu-open')) {
        closeMenu();
      }

      openMegaMenu(target);
    });
  });

  megaBackdrop?.addEventListener('click', closeMegaMenu);
  megaCloseButtons.forEach((btn) =>
    btn.addEventListener('click', closeMegaMenu),
  );

  document.addEventListener('click', (event) => {
    if (!body.classList.contains('mega-open')) return;
    const target = event.target;
    if (!target) return;
    const insidePanel = target.closest('.mega-menu-panel');
    const isTrigger = target.closest('[data-menu-target]');
    if (insidePanel || isTrigger) return;
    closeMegaMenu();
  });

  document.addEventListener('keyup', (event) => {
    const isEscape = event.key === 'Escape';
    if (isEscape && body.classList.contains('menu-open')) {
      closeMenu();
    }
    if (isEscape && body.classList.contains('mega-open')) {
      closeMegaMenu();
    }
  });

  // inicializa focus block em menu mobile fechado
  setMobileFocusable(false);

  // Hero slider
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  let heroIndex = 0;
  let heroTimer;

  const isMobileHero = () => window.matchMedia('(max-width: 1205px)').matches;

  const setSlideBackground = (slide) => {
    if (!slide) return;
    const src = isMobileHero() ? slide.dataset.mobile : slide.dataset.desktop;
    if (src) {
      slide.style.backgroundImage = `url('${src}')`;
    }
  };

  const activateHeroSlide = (index) => {
    heroSlides.forEach((slide, idx) => {
      const active = idx === index;
      if (active) setSlideBackground(slide);
      slide.classList.toggle('active', active);
    });
  };

  const nextHero = () => {
    heroIndex = (heroIndex + 1) % heroSlides.length;
    activateHeroSlide(heroIndex);
  };

  const startHero = () => {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(nextHero, 3000);
  };

  if (heroSlides.length) {
    activateHeroSlide(heroIndex);
    startHero();
    window.addEventListener('resize', () => activateHeroSlide(heroIndex));
  }

  // Depoimentos - auto scroll lateral com pausa no hover
  const depoSlider = document.querySelector('.depo-slider');
  const depoTrack = document.querySelector('.depo-track');

  if (depoSlider && depoTrack) {
    if (!depoTrack.dataset.looped) {
      const cards = Array.from(depoTrack.children);
      cards.forEach((card) => depoTrack.appendChild(card.cloneNode(true)));
      depoTrack.dataset.looped = 'true';
    }

    const mobileQuery = window.matchMedia('(max-width: 900px)');
    const resetDepoPosition = () => {
      depoSlider.scrollLeft = 0;
    };

    const onBreakpointChange = () => {
      resetDepoPosition();
    };

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', onBreakpointChange);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(onBreakpointChange);
    }

    resetDepoPosition();
  }

  // Reformas - slider de antes/depois
  const reformasSection = document.querySelector('.reformas');
  if (reformasSection) {
    const slider = reformasSection.querySelector('[data-reformas-slider]');
    const compare = reformasSection.querySelector('.reformas-compare');
    const beforeImg = compare?.querySelector('.reformas-before');
    const afterImg = compare?.querySelector('.reformas-after');
    const range = compare?.querySelector('.reformas-range');
    const counterCurrent = reformasSection.querySelector(
      '.reformas-counter .current',
    );
    const counterTotal = reformasSection.querySelector(
      '.reformas-counter .total',
    );
    const navButtons = reformasSection.querySelectorAll(
      '.reformas-nav .reformas-btn',
    );
    const prevBtn = navButtons[0];
    const nextBtn = navButtons[1];

    // Troque as URLs abaixo para cada slide (antes/depois)
    const reformasSlides = [
      {
        before: 'assets/imgs/reforma-depois-1.webp',
        after: 'assets/imgs/reforma-antes-1.webp ',
      },
      {
        before: 'assets/imgs/reforma-depois-2.webp',
        after: 'assets/imgs/reforma-antes-2.webp',
      },
      {
        before: 'assets/imgs/reforma-depois-3.webp',
        after: 'assets/imgs/reforma-antes-3.webp',
      },
      {
        before: 'assets/imgs/reforma-depois-4.webp',
        after: 'assets/imgs/reforma-antes-4.webp',
      },
    ];

    let reformasIndex = 0;

    const pad2 = (num) => String(num).padStart(2, '0');

    const setDividerPosition = (value) => {
      const numeric = Math.min(100, Math.max(0, Number(value) || 0));
      if (compare) {
        compare.style.setProperty('--pos', `${numeric}%`);
      }
      if (range && Number(range.value) !== numeric) {
        range.value = numeric;
      }
    };

    const updateReformasSlide = (index) => {
      const slide = reformasSlides[index];
      if (!slide) return;
      reformasIndex = index;
      setDividerPosition(50);
      if (range) range.value = 50;
      if (beforeImg) {
        beforeImg.src = slide.before;
        beforeImg.alt = `Máquina antes da reforma ${index + 1}`;
      }
      if (afterImg) {
        afterImg.src = slide.after;
        afterImg.alt = `Máquina depois da reforma ${index + 1}`;
      }
      if (counterCurrent) counterCurrent.textContent = pad2(index + 1);
      if (counterTotal) counterTotal.textContent = pad2(reformasSlides.length);
    };

    const goPrev = () => {
      const nextIndex =
        (reformasIndex - 1 + reformasSlides.length) % reformasSlides.length;
      updateReformasSlide(nextIndex);
    };

    const goNext = () => {
      const nextIndex = (reformasIndex + 1) % reformasSlides.length;
      updateReformasSlide(nextIndex);
    };

    range?.addEventListener('input', (event) =>
      setDividerPosition(event.target.value),
    );
    compare?.addEventListener('click', (event) => {
      if (!compare) return;
      const rect = compare.getBoundingClientRect();
      const clickPos = ((event.clientX - rect.left) / rect.width) * 100;
      setDividerPosition(clickPos);
    });
    compare?.addEventListener('pointermove', (event) => {
      if (event.buttons !== 1) return;
      if (!compare) return;
      const rect = compare.getBoundingClientRect();
      const movePos = ((event.clientX - rect.left) / rect.width) * 100;
      setDividerPosition(movePos);
    });
    prevBtn?.addEventListener('click', goPrev);
    nextBtn?.addEventListener('click', goNext);

    window.addEventListener('resize', () =>
      setDividerPosition(range?.value || 50),
    );

    updateReformasSlide(reformasIndex);
  }

  function ativarSlide() {
    const setaVoltar = document.querySelector('#seta-voltar');
    const setaAvancar = document.querySelector('#seta-avancar');
    const slide = document.querySelector('#itens-slide');

    if (!setaVoltar || !setaAvancar || !slide) return;

    const tamanhoDiv = 380;
    // Tamanho da div mais a margem lateral para avancar ao clicar na seta

    const numeroDivs = slide.children.length;

    let posicaoAtual = 0;

    setaVoltar.addEventListener('click', () => {
      if (posicaoAtual > 0) {
        posicaoAtual -= 1;
        slide.style.transform = `translateX(-${posicaoAtual * tamanhoDiv}px)`;
      }
    });

    setaAvancar.addEventListener('click', () => {
      if (posicaoAtual < numeroDivs - 1) {
        posicaoAtual += 1;
        slide.style.transform = `translateX(-${posicaoAtual * tamanhoDiv}px)`;
      }
    });
  }

  ativarSlide();

  // Tabs de aplicações (prensas)
  const tabButtons = document.querySelectorAll('.aplicacoes-tab');
  const tabPanels = document.querySelectorAll('.aplicacao-card');

  const resetTabs = () => {
    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach((panel) => panel.classList.remove('active'));
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tabTarget;
      if (!target) return;
      const panel = document.querySelector(`[data-tab-panel="${target}"]`);
      if (!panel) return;
      resetTabs();
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      panel.classList.add('active');
    });
  });

  // Rolagem suave no mouse para tabs (touch permanece nativo)
  const initTabsScroll = () => {
    const isMobileTabs = window.matchMedia('(max-width: 1000px)').matches;
    if (!isMobileTabs) return;

    document.querySelectorAll('.rolagem-tabs').forEach((container) => {
      container.addEventListener(
        'wheel',
        (e) => {
          // privilegia rolagem vertical do mouse para deslizar horizontalmente
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            container.scrollBy({
              left: e.deltaY,
              behavior: 'smooth',
            });
          }
        },
        { passive: false },
      );

      // arrasto com mouse (touch permanece nativo)
      let isDown = false;
      let startX = 0;
      let startScroll = 0;

      container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX;
        startScroll = container.scrollLeft;
        container.classList.add('dragging');
      });

      container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('dragging');
      });

      container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('dragging');
      });

      container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const walk = e.pageX - startX;
        container.scrollLeft = startScroll - walk;
      });
    });
  };

  initTabsScroll();

  // Modais genéricos (abre/fecha por data-modal e data-modal-open)
  const modais = document.querySelectorAll('[data-modal]');
  modais.forEach((overlay) => {
    const modalName = overlay.dataset.modal;
    const openers = document.querySelectorAll(
      `[data-modal-open="${modalName}"]`,
    );
    const closers = overlay.querySelectorAll('[data-modal-close]');

    const openModal = () => {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    openers.forEach((btn) =>
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      }),
    );

    closers.forEach((btn) => btn.addEventListener('click', closeModal));

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeModal();
    });

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('active')) {
        closeModal();
      }
    });
  });

  // Delegação extra de fechamento para qualquer botão com data-modal-close
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.hasAttribute('data-modal-close')) {
      const overlay = target.closest('[data-modal]');
      if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });

  // Vídeo de entregas (Instagram) - cria iframe apenas ao clicar
  const videoFrame = document.querySelector('[data-video-frame]');
  const videoTrigger = document.querySelector('[data-video-trigger]');

  const loadVideo = () => {
    if (!videoFrame || videoFrame.querySelector('iframe')) return;
    const src = videoFrame.dataset.videoSrc;
    if (!src) return;
    const iframe = document.createElement('iframe');
    iframe.src = `${src}?autoplay=1`;
    iframe.allow =
      'autoplay; encrypted-media; picture-in-picture; clipboard-write';
    iframe.allowFullscreen = true;
    iframe.title = 'Vídeo de entrega de prensas ALS';
    iframe.setAttribute('scrolling', 'no');
    iframe.style.overflow = 'hidden';
    videoFrame.innerHTML = '';
    videoFrame.appendChild(iframe);
  };

  videoTrigger?.addEventListener('click', loadVideo);
  videoTrigger?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      loadVideo();
    }
  });
})();
