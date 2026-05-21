(() => {
  // Admin - configuracao, opcoes e referencias do DOM
  const catalogNormalizer = window.ALSCatalogNormalizer || {};
  const SESSION_KEY = 'als_admin_session';
  const MACHINES_KEY = 'als_admin_machines_backup';
  const CATEGORIES_KEY = 'als_admin_categories_backup';
  const SETTINGS_KEY = 'als_admin_settings_backup';
  const VIEW_KEY = 'als_admin_current_view';
  const TOUCH_IMAGE_DRAG_DELAY = 140;
  const RATIO_ZOOM_CLASS = 'als-ratio-375-200';
  const RATIO_375_200 = 375 / 200;
  const RATIO_TOLERANCE = 0.01;

  const views = ['inicio', 'cadastrar', 'maquinas', 'categorias', 'configuracoes'];
  const customSelectTypes = [
    'category',
    'status',
    'condition',
    'drive',
    'voltage',
    'weightUnit',
    'machineCategoryFilter',
    'machineStatusFilter',
    'machineActiveFilter',
    'machineFeaturedFilter',
  ];
  const machineFilterSelectMap = {
    machineCategoryFilter: 'category',
    machineStatusFilter: 'status',
    machineActiveFilter: 'active',
    machineFeaturedFilter: 'featured',
  };

  const statusBuckets = [
    { key: 'available', label: 'Dispon&iacute;veis', statuses: ['disponivel', 'pronta-entrega'] },
    { key: 'consult', label: 'Sob consulta', statuses: ['sob-consulta'] },
    { key: 'unavailable', label: 'Indispon&iacute;veis', statuses: ['indisponivel'] },
    { key: 'reserved', label: 'Reservadas', statuses: ['reservada'] },
    { key: 'soldOrLeased', label: 'Vendidas/locadas', statuses: ['vendida', 'locada'] },
    { key: 'maintenance', label: 'Em manuten&ccedil;&atilde;o', statuses: ['manutencao'] },
  ];

  const chartColors = ['#cf162d', '#e0565f', '#8f0013', '#7c2430', '#b12d45', '#a83b45'];

  const commercialStatuses = [
    { value: 'disponivel', label: 'Dispon&iacute;vel' },
    { value: 'sob-consulta', label: 'Sob consulta' },
    { value: 'pronta-entrega', label: 'Pronta entrega' },
    { value: 'reservada', label: 'Reservada' },
    { value: 'vendida', label: 'Vendida' },
    { value: 'locada', label: 'Locada' },
    { value: 'manutencao', label: 'Em manuten&ccedil;&atilde;o' },
    { value: 'indisponivel', label: 'Indispon&iacute;vel' },
  ];

  const technicalConditionOptions = [
    { value: 'Nova', label: 'Nova' },
    { value: 'Seminova', label: 'Seminova' },
    { value: 'Usada', label: 'Usada' },
    { value: 'Revisada', label: 'Revisada' },
    { value: 'Reformada', label: 'Reformada' },
    { value: 'Sob avalia\u00e7\u00e3o', label: 'Sob avalia&ccedil;&atilde;o' },
  ];

  const driveOptions = [
    { value: 'N\u00e3o se aplica', label: 'N&atilde;o se aplica' },
    { value: 'Hidr\u00e1ulico', label: 'Hidr&aacute;ulico' },
    { value: 'El\u00e9trico', label: 'El&eacute;trico' },
    { value: 'Pneum\u00e1tico', label: 'Pneum&aacute;tico' },
    { value: 'Manual', label: 'Manual' },
    { value: 'Mec\u00e2nico', label: 'Mec&acirc;nico' },
    { value: 'Hidr\u00e1ulico/el\u00e9trico', label: 'Hidr&aacute;ulico/el&eacute;trico' },
    { value: 'Servoacionado', label: 'Servoacionado' },
  ];

  const voltageOptions = [
    { value: 'N\u00e3o se aplica', label: 'N&atilde;o se aplica' },
    { value: '110 V', label: '110 V' },
    { value: '220 V', label: '220 V' },
    { value: '380 V', label: '380 V' },
    { value: '440 V', label: '440 V' },
    { value: '220/380 V', label: '220/380 V' },
    { value: '380/440 V', label: '380/440 V' },
    { value: 'Monof\u00e1sica', label: 'Monof&aacute;sica' },
    { value: 'Trif\u00e1sica', label: 'Trif&aacute;sica' },
    { value: 'A definir', label: 'A definir' },
  ];

  const weightUnitOptions = [
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
    { value: 't', label: 't' },
  ];

  const defaultSettings = {
    catalogName: 'Cat&aacute;logo de M&aacute;quinas',
    whatsappNumber: '5516991265833',
    heroTitle: 'M&aacute;quinas industriais sob consulta',
    heroDescription:
      'Consulte equipamentos industriais, disponibilidade comercial e especifica&ccedil;&otilde;es t&eacute;cnicas com a equipe da ALS M&aacute;quinas.',
    quoteMessage:
      'Ol&aacute;, vim pelo site da ALS M&aacute;quinas e gostaria de solicitar um or&ccedil;amento para os equipamentos selecionados.',
  };

  const els = {
    login: document.querySelector('[data-admin-login]'),
    shell: document.querySelector('[data-admin-shell]'),
    loginForm: document.querySelector('[data-login-form]'),
    loginMessage: document.querySelector('[data-login-message]'),
    loginSubmit: document.querySelector('[data-login-submit]'),
    passwordToggle: document.querySelector('[data-password-toggle]'),
    logout: document.querySelector('[data-admin-logout]'),
    sidebar: document.querySelector('[data-admin-sidebar]'),
    mobileActionsToggle: document.querySelector('[data-mobile-actions-toggle]'),
    userEmail: document.querySelector('[data-admin-user]'),
    userEmailInline: document.querySelector('[data-admin-user-inline]'),
    navItems: document.querySelectorAll('.admin-nav-item'),
    viewTriggers: document.querySelectorAll('[data-view-target]'),
    views: document.querySelectorAll('[data-admin-view]'),
    metrics: document.querySelector('[data-admin-metrics]'),
    statusChart: document.querySelector('[data-status-chart]'),
    statusChartSummary: document.querySelector('[data-status-chart-summary]'),
    statusChartEmpty: document.querySelector('[data-status-chart-empty]'),
    categoryChart: document.querySelector('[data-category-chart]'),
    categoryChartSummary: document.querySelector('[data-category-chart-summary]'),
    categoryChartEmpty: document.querySelector('[data-category-chart-empty]'),
    recentMachines: document.querySelector('[data-recent-machines]'),
    alerts: document.querySelector('[data-admin-alerts]'),
    table: document.querySelector('[data-admin-table]'),
    machinesSummary: document.querySelector('[data-machines-summary]'),
    machinesActiveSummary: document.querySelector('[data-machines-active-summary]'),
    machinesFeaturedSummary: document.querySelector('[data-machines-featured-summary]'),
    machinesPanel: document.querySelector('[data-machines-panel]'),
    machineFiltersToggle: document.querySelector('[data-machine-filters-toggle]'),
    machineFiltersCount: document.querySelector('[data-machine-filters-count]'),
    machineRemoveModal: document.querySelector('[data-machine-remove-modal]'),
    machineRemoveTitle: document.querySelector('[data-machine-remove-title]'),
    machineRemoveMessage: document.querySelector('[data-machine-remove-message]'),
    machineRemoveDetail: document.querySelector('[data-machine-remove-detail]'),
    machineRemoveConfirm: document.querySelector('[data-machine-remove-confirm]'),
    machineRemoveCancel: document.querySelector('[data-machine-remove-cancel]'),
    machineSearch: document.querySelector('[data-machine-search]'),
    machineSearchClear: document.querySelector('[data-machine-search-clear]'),
    machineCategoryFilterSelect: document.querySelector('[data-machine-category-filter-select]'),
    machineCategoryFilterInput: document.querySelector('[data-machine-category-filter-input]'),
    machineCategoryFilterTrigger: document.querySelector('[data-machine-category-filter-trigger]'),
    machineCategoryFilterLabel: document.querySelector('[data-machine-category-filter-label]'),
    machineCategoryFilterMenu: document.querySelector('[data-machine-category-filter-menu]'),
    machineStatusFilterSelect: document.querySelector('[data-machine-status-filter-select]'),
    machineStatusFilterInput: document.querySelector('[data-machine-status-filter-input]'),
    machineStatusFilterTrigger: document.querySelector('[data-machine-status-filter-trigger]'),
    machineStatusFilterLabel: document.querySelector('[data-machine-status-filter-label]'),
    machineStatusFilterMenu: document.querySelector('[data-machine-status-filter-menu]'),
    machineActiveFilterSelect: document.querySelector('[data-machine-active-filter-select]'),
    machineActiveFilterInput: document.querySelector('[data-machine-active-filter-input]'),
    machineActiveFilterTrigger: document.querySelector('[data-machine-active-filter-trigger]'),
    machineActiveFilterLabel: document.querySelector('[data-machine-active-filter-label]'),
    machineActiveFilterMenu: document.querySelector('[data-machine-active-filter-menu]'),
    machineFeaturedFilterSelect: document.querySelector('[data-machine-featured-filter-select]'),
    machineFeaturedFilterInput: document.querySelector('[data-machine-featured-filter-input]'),
    machineFeaturedFilterTrigger: document.querySelector('[data-machine-featured-filter-trigger]'),
    machineFeaturedFilterLabel: document.querySelector('[data-machine-featured-filter-label]'),
    machineFeaturedFilterMenu: document.querySelector('[data-machine-featured-filter-menu]'),
    machineClearFilters: document.querySelector('[data-machine-clear-filters]'),
    form: document.querySelector('[data-machine-form]'),
    formTitle: document.querySelector('[data-form-title]'),
    formMessage: document.querySelector('[data-form-message]'),
    newButton: document.querySelector('[data-new-machine]'),
    cancelButton: document.querySelector('[data-cancel-edit]'),
    imageInput: document.querySelector('[data-image-url]'),
    galleryInput: document.querySelector('[data-gallery-urls]'),
    fileInput: document.querySelector('[data-image-file]'),
    uploadDropzone: document.querySelector('[data-upload-dropzone]'),
    imageList: document.querySelector('[data-image-list]'),
    imageEmpty: document.querySelector('[data-image-empty]'),
    imageLightbox: document.querySelector('[data-image-lightbox]'),
    imageLightboxImg: document.querySelector('[data-image-lightbox-img]'),
    imageLightboxCaption: document.querySelector('[data-image-lightbox-caption]'),
    imageLightboxClose: document.querySelector('[data-image-lightbox-close]'),
    statusSelect: document.querySelector('[data-status-select]'),
    statusInput: document.querySelector('[data-status-input]'),
    statusTrigger: document.querySelector('[data-status-trigger]'),
    statusLabel: document.querySelector('[data-status-label]'),
    statusMenu: document.querySelector('[data-status-menu]'),
    conditionSelect: document.querySelector('[data-condition-select]'),
    conditionInput: document.querySelector('[data-condition-input]'),
    conditionTrigger: document.querySelector('[data-condition-trigger]'),
    conditionLabel: document.querySelector('[data-condition-label]'),
    conditionMenu: document.querySelector('[data-condition-menu]'),
    driveSelect: document.querySelector('[data-drive-select]'),
    driveInput: document.querySelector('[data-drive-input]'),
    driveTrigger: document.querySelector('[data-drive-trigger]'),
    driveLabel: document.querySelector('[data-drive-label]'),
    driveMenu: document.querySelector('[data-drive-menu]'),
    voltageSelect: document.querySelector('[data-voltage-select]'),
    voltageInput: document.querySelector('[data-voltage-input]'),
    voltageTrigger: document.querySelector('[data-voltage-trigger]'),
    voltageLabel: document.querySelector('[data-voltage-label]'),
    voltageMenu: document.querySelector('[data-voltage-menu]'),
    weightUnitSelect: document.querySelector('[data-weight-unit-select]'),
    weightUnitInput: document.querySelector('[data-weight-unit-input]'),
    weightUnitTrigger: document.querySelector('[data-weight-unit-trigger]'),
    weightUnitLabel: document.querySelector('[data-weight-unit-label]'),
    weightUnitMenu: document.querySelector('[data-weight-unit-menu]'),
    categorySelect: document.querySelector('[data-category-select]'),
    categoryInput: document.querySelector('[data-category-input]'),
    categoryTrigger: document.querySelector('[data-category-trigger]'),
    categoryLabel: document.querySelector('[data-category-label]'),
    categoryMenu: document.querySelector('[data-category-menu]'),
    categoryForm: document.querySelector('[data-category-form]'),
    categoryMessage: document.querySelector('[data-category-message]'),
    categoryList: document.querySelector('[data-category-list]'),
    categoryFormTitle: document.querySelector('[data-category-form-title]'),
    categoryFormPanel: document.querySelector('[data-category-form-panel]'),
    categoryListSummary: document.querySelector('[data-category-list-summary]'),
    categorySearch: document.querySelector('[data-category-search]'),
    categoryStatusFilterButtons: document.querySelectorAll('[data-category-status-filter]'),
    categoryRemoveModal: document.querySelector('[data-category-remove-modal]'),
    categoryRemoveTitle: document.querySelector('[data-category-remove-title]'),
    categoryRemoveMessage: document.querySelector('[data-category-remove-message]'),
    categoryRemoveDetail: document.querySelector('[data-category-remove-detail]'),
    categoryRemoveConfirm: document.querySelector('[data-category-remove-confirm]'),
    categoryRemoveCancel: document.querySelector('[data-category-remove-cancel]'),
    cancelCategoryButton: document.querySelector('[data-cancel-category]'),
    settingsForm: document.querySelector('[data-settings-form]'),
    settingsMessage: document.querySelector('[data-settings-message]'),
    resetSettingsButton: document.querySelector('[data-reset-settings]'),
    settingsPreviewCatalog: document.querySelector('[data-settings-preview-catalog]'),
    settingsPreviewTitle: document.querySelector('[data-settings-preview-title]'),
    settingsPreviewDescription: document.querySelector('[data-settings-preview-description]'),
    settingsPreviewWhatsapp: document.querySelector('[data-settings-preview-whatsapp]'),
    settingsPreviewMessage: document.querySelector('[data-settings-preview-message]'),
    settingsWhatsappTest: document.querySelector('[data-settings-whatsapp-test]'),
    settingsResetModal: document.querySelector('[data-settings-reset-modal]'),
    settingsResetConfirm: document.querySelector('[data-settings-reset-confirm]'),
    settingsResetCancel: document.querySelector('[data-settings-reset-cancel]'),
  };

  const state = {
    machines: [],
    categories: [],
    settings: {},
    editingId: '',
    editingCategoryId: '',
    machineRemoveTargetId: '',
    machineRemoveLastFocus: null,
    machineRemovePreviousOverflow: '',
    categoryRemoveTargetId: '',
    categoryRemoveLastFocus: null,
    categoryRemovePreviousOverflow: '',
    pendingRemoteDeletes: {
      products: new Set(),
      categories: new Set(),
    },
    remotePersistQueue: Promise.resolve(),
    toastTimer: 0,
    settingsResetLastFocus: null,
    settingsResetPreviousOverflow: '',
    images: [],
    draggingImageId: '',
    pointerImageDrag: null,
    touchImageDrag: null,
    machineFilters: {
      search: '',
      category: '',
      status: '',
      active: '',
      featured: '',
    },
    categoryFilters: {
      search: '',
      status: '',
    },
    currentView: 'inicio',
    lastScrollY: window.scrollY,
    charts: {
      status: null,
      category: null,
    },
  };

  const backend = window.ALSAdminBackend || null;
  const hasRemoteBackend = () => Boolean(backend?.isConfigured?.());

  // Admin - inicializacao e eventos globais
  const init = async () => {
    bindEvents();
    if (hasRemoteBackend()) {
      await backend.ready;
    } else {
      loadLocalData();
    }
    await syncAuthView();
  };

  const bindEvents = () => {
    els.loginForm?.addEventListener('submit', handleLogin);
    els.passwordToggle?.addEventListener('click', togglePasswordVisibility);
    els.logout?.addEventListener('click', handleLogout);
    els.form?.addEventListener('submit', handleSave);
    els.newButton?.addEventListener('click', () => {
      resetForm();
      openView('cadastrar');
    });
    els.cancelButton?.addEventListener('click', () => resetForm());
    els.fileInput?.addEventListener('change', handleImageFileInput);
    els.uploadDropzone?.addEventListener('click', () => els.fileInput?.click());
    els.uploadDropzone?.addEventListener('dragover', handleUploadDragOver);
    els.uploadDropzone?.addEventListener('dragleave', handleUploadDragLeave);
    els.uploadDropzone?.addEventListener('drop', handleUploadDrop);
    els.imageList?.addEventListener('click', handleImageListClick);
    els.imageList?.addEventListener('pointerdown', handleImagePointerStart);
    els.imageList?.addEventListener('touchstart', handleImageTouchStart, { passive: false });
    els.imageList?.addEventListener('touchmove', handleImageTouchMove, { passive: false });
    els.imageList?.addEventListener('touchend', handleImageTouchEnd);
    els.imageList?.addEventListener('touchcancel', handleImageTouchEnd);
    els.imageList?.addEventListener('dragstart', handleImageDragStart);
    els.imageList?.addEventListener('dragover', handleImageDragOver);
    els.imageList?.addEventListener('drop', handleImageDrop);
    els.imageList?.addEventListener('dragend', handleImageDragEnd);
    window.addEventListener('pointermove', handleImagePointerMove);
    window.addEventListener('pointerup', handleImagePointerEnd);
    window.addEventListener('pointercancel', handleImagePointerEnd);
    els.imageLightbox?.addEventListener('click', handleImageLightboxClick);
    els.imageLightboxClose?.addEventListener('click', closeImageLightbox);
    customSelectTypes.forEach((type) => {
      const select = getCustomSelect(type);
      select.trigger?.addEventListener('click', () => toggleCustomSelect(type));
      select.root?.addEventListener('keydown', (event) => handleCustomSelectKeydown(event, type));
      select.menu?.addEventListener('click', (event) => handleCustomSelectClick(event, type));
    });
    els.categoryForm?.addEventListener('submit', handleCategorySave);
    els.categorySearch?.addEventListener('input', (event) => {
      state.categoryFilters.search = event.target.value.trim();
      renderCategories();
    });
    els.categoryStatusFilterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.categoryFilters.status = button.dataset.categoryStatusFilter || '';
        renderCategories();
      });
    });
    els.categoryRemoveModal?.addEventListener('click', handleCategoryRemoveModalClick);
    els.categoryRemoveCancel?.addEventListener('click', () => closeCategoryRemoveModal());
    els.categoryRemoveConfirm?.addEventListener('click', confirmCategoryRemove);
    els.cancelCategoryButton?.addEventListener('click', resetCategoryForm);
    els.settingsForm?.addEventListener('submit', handleSettingsSave);
    els.settingsForm?.addEventListener('input', () => {
      updateSettingsPreview(getSettingsFormValues());
      hideMessage(els.settingsMessage);
    });
    els.resetSettingsButton?.addEventListener('click', openSettingsResetModal);
    els.settingsResetModal?.addEventListener('click', handleSettingsResetModalClick);
    els.settingsResetCancel?.addEventListener('click', () => closeSettingsResetModal());
    els.settingsResetConfirm?.addEventListener('click', confirmSettingsReset);
    els.settingsWhatsappTest?.addEventListener('click', (event) => {
      if (els.settingsWhatsappTest.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
      }
    });
    els.machineSearch?.addEventListener('input', (event) => {
      updateMachineFilter('search', event.target.value);
      syncMachineSearchClear();
    });
    els.machineSearchClear?.addEventListener('click', () => {
      updateMachineFilter('search', '');
      syncMachineFilterControls();
      els.machineSearch?.focus();
    });
    els.machineRemoveModal?.addEventListener('click', handleMachineRemoveModalClick);
    els.machineRemoveCancel?.addEventListener('click', () => closeMachineRemoveModal());
    els.machineRemoveConfirm?.addEventListener('click', confirmMachineRemove);
    els.machineFiltersToggle?.addEventListener('click', toggleMachineFilters);
    els.machineClearFilters?.addEventListener('click', resetMachineFilters);
    els.alerts?.addEventListener('click', handleDashboardClick);
    els.recentMachines?.addEventListener('click', handleDashboardClick);
    els.mobileActionsToggle?.addEventListener('click', toggleMobileActions);
    window.addEventListener('scroll', handleMobileNavScroll, { passive: true });
    window.addEventListener('resize', handleMobileNavScroll);
    window.addEventListener('keydown', handleGlobalKeydown);
    window.addEventListener('als:admin-publish-status', handlePublishStatus);
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('hashchange', () => {
      const view = getViewFromHash();
      if (view) openView(view, { preserveHash: true });
    });

    els.viewTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const view = trigger.dataset.viewTarget;
        if (view === 'cadastrar') resetForm();
        openView(view);
      });
    });

    els.table?.addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-edit-machine]');
      const toggleButton = event.target.closest('[data-toggle-machine]');
      const deleteButton = event.target.closest('[data-delete-machine]');

      if (editButton) startEdit(editButton.dataset.editMachine);
      if (toggleButton) toggleActive(toggleButton.dataset.toggleMachine);
      if (deleteButton) deleteMachine(deleteButton.dataset.deleteMachine);
    });

    els.categoryList?.addEventListener('click', (event) => {
      const actionsTrigger = event.target.closest('[data-category-actions-trigger]');
      const editButton = event.target.closest('[data-edit-category]');
      const toggleButton = event.target.closest('[data-toggle-category]');
      const deleteButton = event.target.closest('[data-delete-category]');

      if (actionsTrigger) {
        toggleCategoryActionsMenu(actionsTrigger);
        return;
      }

      if (editButton || toggleButton || deleteButton) closeCategoryActionsMenus();
      if (editButton) startCategoryEdit(editButton.dataset.editCategory);
      if (toggleButton) toggleCategory(toggleButton.dataset.toggleCategory);
      if (deleteButton) deleteCategory(deleteButton.dataset.deleteCategory);
    });
  };

  // Admin - autenticacao e navegacao
  const togglePasswordVisibility = () => {
    const input = els.loginForm?.elements.password;
    if (!input || !els.passwordToggle) return;

    const shouldShow = input.type === 'password';
    input.type = shouldShow ? 'text' : 'password';
    els.passwordToggle.setAttribute('aria-pressed', String(shouldShow));
    els.passwordToggle.setAttribute('aria-label', shouldShow ? 'Ocultar senha' : 'Mostrar senha');
  };

  const handleDashboardClick = (event) => {
    const viewButton = event.target.closest('[data-dashboard-view]');
    const editButton = event.target.closest('[data-dashboard-edit]');

    if (viewButton) {
      openView(viewButton.dataset.dashboardView);
    }

    if (editButton) {
      startEdit(editButton.dataset.dashboardEdit);
    }
  };

  const handlePublishStatus = (event) => {
    const message = event.detail?.message;
    if (!message) return;
    showToast(message, event.detail?.type || 'success');
  };

  const syncAuthView = async () => {
    const session = readSession();
    const isLogged = Boolean(session?.email);
    els.login.hidden = isLogged;

    if (!isLogged) {
      els.shell.hidden = true;
      return;
    }

    const targetView = getInitialAdminView();
    setViewState(targetView);
    await loadAdminData();
    if (els.userEmail) els.userEmail.textContent = session.email;
    if (els.userEmailInline) els.userEmailInline.textContent = session.email;
    renderAdmin();
    openView(targetView, {
      preserveHash: true,
      instant: true,
    });
    els.shell.hidden = false;
  };

  const setLoginLoading = (isLoading) => {
    if (!els.loginSubmit) {
      return;
    }

    const label = els.loginSubmit.querySelector('[data-login-submit-label]');
    els.loginSubmit.disabled = isLoading;
    els.loginSubmit.classList.toggle('is-loading', isLoading);
    els.loginSubmit.setAttribute('aria-busy', String(isLoading));

    if (label) {
      label.textContent = isLoading ? 'Entrando...' : 'Entrar no painel';
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (els.loginSubmit?.classList.contains('is-loading')) {
      return;
    }

    const formData = new FormData(els.loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();

    if (!email || !password) {
      showMessage(els.loginMessage, 'Informe e-mail e senha para acessar o painel.', 'error');
      return;
    }

    setLoginLoading(true);

    try {
      if (hasRemoteBackend()) {
        await backend.signIn(email, password);
      } else {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ email, loggedAt: new Date().toISOString() }),
        );
      }
      els.loginForm.reset();
      await syncAuthView();
    } catch (error) {
      showMessage(els.loginMessage, getFriendlyErrorMessage(error, 'login'), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (hasRemoteBackend()) {
      await backend.signOut().catch(() => {});
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    localStorage.removeItem(VIEW_KEY);
    window.location.hash = '';
    await syncAuthView();
  };

  const openView = (view, options = {}) => {
    const target = views.includes(view) ? view : 'inicio';
    localStorage.setItem(VIEW_KEY, target);
    closeMobileActions();
    setViewState(target);

    if (!options.preserveHash && window.location.hash !== `#${target}`) {
      window.location.hash = target;
    }

    window.scrollTo({ top: 0, behavior: options.instant ? 'auto' : 'smooth' });
  };

  const setViewState = (view) => {
    const target = views.includes(view) ? view : 'inicio';
    state.currentView = target;

    els.views.forEach((section) => {
      const isActive = section.dataset.adminView === target;
      section.classList.toggle('active', isActive);
      section.hidden = !isActive;
    });

    els.navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.viewTarget === target);
    });
  };

  const toggleMobileActions = () => {
    const isOpen = els.sidebar.classList.toggle('mobile-actions-open');
    els.mobileActionsToggle.setAttribute('aria-expanded', String(isOpen));
  };

  const closeMobileActions = () => {
    els.sidebar?.classList.remove('mobile-actions-open');
    els.mobileActionsToggle?.setAttribute('aria-expanded', 'false');
  };

  const toggleCustomSelect = (type) => {
    const select = getCustomSelect(type);
    if (!select.root) return;

    if (select.root.classList.contains('open')) {
      closeCustomSelect(type);
      return;
    }

    openCustomSelect(type);
  };

  const openCustomSelect = (type) => {
    const select = getCustomSelect(type);
    if (!select.root || !select.menu || !select.trigger) return;

    customSelectTypes
      .filter((customSelectType) => customSelectType !== type)
      .forEach((customSelectType) => closeCustomSelect(customSelectType));
    select.root.classList.add('open');
    select.trigger.setAttribute('aria-expanded', 'true');
    select.menu.hidden = false;

    const selected = getCustomOptions(type).find((option) => option.classList.contains('active'));
    focusCustomOption(type, selected || getCustomOptions(type)[0]);
  };

  const closeCustomSelect = (type, { focusTrigger = false } = {}) => {
    const select = getCustomSelect(type);
    if (!select.root || !select.menu || !select.trigger) return;

    select.root.classList.remove('open');
    select.trigger.setAttribute('aria-expanded', 'false');
    select.menu.hidden = true;
    clearFocusedCustomOption(type);
    if (focusTrigger) select.trigger.focus();
  };

  const closeAllCustomSelects = () => {
    customSelectTypes.forEach((type) => closeCustomSelect(type));
  };

  const handleCustomSelectClick = (event, type) => {
    const option = event.target.closest('[data-select-option]');
    if (!option) return;
    selectCustomOption(type, option.dataset.selectValue || '');
    closeCustomSelect(type, { focusTrigger: true });
  };

  const handleCustomSelectKeydown = (event, type) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const options = getCustomOptions(type);
    if (!options.length) return;

    const select = getCustomSelect(type);
    const isOpen = select.root?.classList.contains('open');
    const currentIndex = Math.max(
      options.findIndex((option) => option.classList.contains('is-focused')),
      options.findIndex((option) => option.classList.contains('active')),
      0,
    );

    if (event.key === 'Escape') {
      event.preventDefault();
      closeCustomSelect(type, { focusTrigger: true });
      return;
    }

    if (!isOpen) {
      event.preventDefault();
      openCustomSelect(type);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[currentIndex] || options[0];
      selectCustomOption(type, option.dataset.selectValue || '');
      closeCustomSelect(type, { focusTrigger: true });
      return;
    }

    event.preventDefault();

    if (event.key === 'Home') {
      focusCustomOption(type, options[0]);
      return;
    }

    if (event.key === 'End') {
      focusCustomOption(type, options[options.length - 1]);
      return;
    }

    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    focusCustomOption(type, options[nextIndex]);
  };

  const handleGlobalKeydown = (event) => {
    if (event.key === 'Escape') {
      if (isSettingsResetModalOpen()) {
        closeSettingsResetModal();
        return;
      }
      if (isMachineRemoveModalOpen()) {
        closeMachineRemoveModal();
        return;
      }
      if (isCategoryRemoveModalOpen()) {
        closeCategoryRemoveModal();
        return;
      }
      closeAllCustomSelects();
      closeCategoryActionsMenus();
      closeImageLightbox();
    }
  };

  const handleSettingsResetModalClick = (event) => {
    if (event.target.closest('[data-settings-reset-dismiss]')) {
      closeSettingsResetModal();
    }
  };

  const handleMachineRemoveModalClick = (event) => {
    if (event.target.closest('[data-machine-remove-dismiss]')) {
      closeMachineRemoveModal();
    }
  };

  const handleCategoryRemoveModalClick = (event) => {
    if (event.target.closest('[data-category-remove-dismiss]')) {
      closeCategoryRemoveModal();
    }
  };

  const handleDocumentClick = (event) => {
    const clickedCustomSelect = customSelectTypes.some((type) => {
      const select = getCustomSelect(type);
      return select.root?.contains(event.target);
    });

    if (!clickedCustomSelect) closeAllCustomSelects();
    if (!event.target.closest('.admin-category-actions')) closeCategoryActionsMenus();
  };

  const handleMobileNavScroll = () => {
    if (!els.shell || els.shell.hidden) return;

    const isMobile = window.matchMedia('(max-width: 980px)').matches;
    if (!isMobile) {
      els.shell.classList.remove('mobile-nav-hidden');
      closeMobileActions();
      state.lastScrollY = window.scrollY;
      return;
    }

    const currentScroll = Math.max(window.scrollY, 0);
    const scrollDelta = currentScroll - state.lastScrollY;
    const isGoingDown = scrollDelta > 0 && currentScroll > 84;
    const isGoingUp = scrollDelta < -24 || currentScroll < 18;

    if (isGoingDown) {
      els.shell.classList.add('mobile-nav-hidden');
      closeMobileActions();
      state.lastScrollY = currentScroll;
      return;
    }

    if (isGoingUp) {
      els.shell.classList.remove('mobile-nav-hidden');
      state.lastScrollY = currentScroll;
      return;
    }
  };

  // Admin - renderizacao principal e dashboard
  const renderAdmin = () => {
    hydrateOptions();
    renderDashboard();
    renderTable();
    renderCategories();
    syncSettingsForm();
    resetForm();
    resetCategoryForm();
  };

  const renderDashboard = () => {
    const stats = getDashboardStats();
    renderMetrics(stats);
    renderRecentMachines();
    renderAlerts(stats);
    renderCharts(stats);
  };

  const getDashboardStats = () => {
    const total = state.machines.length;
    const active = state.machines.filter((machine) => machine.active).length;
    const inactive = total - active;
    const available = countByStatuses(['disponivel', 'pronta-entrega']);
    const consult = countByStatuses(['sob-consulta']);
    const unavailable = countByStatuses(['indisponivel']);
    const maintenance = countByStatuses(['manutencao']);
    const reserved = countByStatuses(['reservada']);
    const soldOrLeased = countByStatuses(['vendida', 'locada']);
    const lowStockMachines = state.machines.filter(isLowStock);
    const featuredMachines = state.machines.filter(isFeaturedMachine);
    const unavailableMachines = state.machines.filter((machine) =>
      ['indisponivel', 'manutencao'].includes(machine.commercialStatus),
    );
    const inactiveMachines = state.machines.filter((machine) => !machine.active);
    const withoutImageMachines = state.machines.filter(hasNoImage);
    const withoutCategoryMachines = state.machines.filter(hasNoCategory);

    return {
      total,
      active,
      inactive,
      available,
      consult,
      unavailable,
      maintenance,
      unavailableOperational: unavailable + maintenance,
      reserved,
      soldOrLeased,
      lowStock: lowStockMachines.length,
      featured: featuredMachines.length,
      lowStockMachines,
      featuredMachines,
      unavailableMachines,
      inactiveMachines,
      withoutImageMachines,
      withoutCategoryMachines,
    };
  };

  const renderMetrics = (stats) => {
    const metrics = [
      {
        label: 'Total de m&aacute;quinas',
        value: stats.total,
        detail: 'cadastradas',
        icon: 'stack',
      },
      {
        label: 'M&aacute;quinas ativas',
        value: stats.active,
        detail: 'no cat&aacute;logo',
        icon: 'check',
      },
      {
        label: 'Dispon&iacute;veis',
        value: stats.available,
        detail: 'para consulta',
        icon: 'trend',
      },
      {
        label: 'Sob consulta',
        value: stats.consult,
        detail: 'em negocia&ccedil;&atilde;o',
        icon: 'calendar',
      },
      {
        label: 'Indispon&iacute;veis',
        value: stats.unavailableOperational,
        detail: 'fora de disponibilidade',
        icon: 'alert',
      },
      {
        label: 'M&aacute;quinas em destaque',
        value: stats.featured,
        detail: 'priorizadas no cat&aacute;logo',
        icon: 'star',
      },
    ];

    els.metrics.innerHTML = metrics
      .map(
        ({ label, value, detail, icon }) => `
          <article class="admin-metric">
            <span class="admin-metric-icon admin-metric-icon-${icon}" aria-hidden="true">${getMetricIcon(icon)}</span>
            <span class="admin-metric-copy">
              <span>${label}</span>
              <strong>${value}</strong>
              <small>${detail}</small>
            </span>
          </article>
        `,
      )
      .join('');
  };

  const renderCharts = (stats) => {
    try {
      renderStatusChart(stats);
    } catch (error) {
      destroyChart('status');
      if (els.statusChart && els.statusChartEmpty) {
        showChartEmpty(els.statusChart, els.statusChartEmpty, 'N&atilde;o foi poss&iacute;vel renderizar este gr&aacute;fico.');
      }
    }

    try {
      renderCategoryChart();
    } catch (error) {
      destroyChart('category');
      if (els.categoryChart && els.categoryChartEmpty) {
        showChartEmpty(els.categoryChart, els.categoryChartEmpty, 'N&atilde;o foi poss&iacute;vel renderizar este gr&aacute;fico.');
      }
    }
  };

  const renderStatusChart = (stats) => {
    if (!els.statusChart || !els.statusChartEmpty) return;

    const labels = statusBuckets.map((bucket) => decodeHtml(bucket.label));
    const values = statusBuckets.map((bucket) => countByStatuses(bucket.statuses));
    const hasData = values.some((value) => value > 0);

    if (els.statusChartSummary) {
      els.statusChartSummary.innerHTML = `${stats.total} m&aacute;quina${stats.total === 1 ? '' : 's'} cadastrada${stats.total === 1 ? '' : 's'}.`;
    }

    if (!hasData) {
      destroyChart('status');
      showChartEmpty(els.statusChart, els.statusChartEmpty, 'Nenhuma m&aacute;quina cadastrada para gerar o gr&aacute;fico.');
      return;
    }

    if (!isChartAvailable()) {
      destroyChart('status');
      showChartEmpty(els.statusChart, els.statusChartEmpty, 'Chart.js n&atilde;o carregou. Os dados seguem dispon&iacute;veis nos cards.');
      return;
    }

    hideChartEmpty(els.statusChart, els.statusChartEmpty);

    const config = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: chartColors,
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxHeight: 10,
              boxWidth: 10,
              color: '#4b5563',
              font: {
                family: 'Figtree, sans-serif',
                size: 12,
                weight: 700,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}`,
            },
          },
        },
      },
    };

    updateChart('status', els.statusChart, config);
  };

  const renderCategoryChart = () => {
    if (!els.categoryChart || !els.categoryChartEmpty) return;

    const categoryData = getCategoryDataset();
    const labels = categoryData.map(([label]) => label);
    const values = categoryData.map(([, value]) => value);
    const hasData = values.some((value) => value > 0);

    if (els.categoryChartSummary) {
      els.categoryChartSummary.innerHTML = `${labels.length} categoria${labels.length === 1 ? '' : 's'} com m&aacute;quinas cadastradas.`;
    }

    if (!hasData) {
      destroyChart('category');
      showChartEmpty(els.categoryChart, els.categoryChartEmpty, 'Nenhuma categoria com m&aacute;quinas cadastradas.');
      return;
    }

    if (!isChartAvailable()) {
      destroyChart('category');
      showChartEmpty(els.categoryChart, els.categoryChartEmpty, 'Chart.js n&atilde;o carregou. Confira as categorias na listagem.');
      return;
    }

    hideChartEmpty(els.categoryChart, els.categoryChartEmpty);

    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: decodeHtml('M&aacute;quinas'),
            data: values,
            backgroundColor: '#cf162d',
            borderColor: '#be0119',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.parsed.x} ${decodeHtml(
                  context.parsed.x === 1 ? 'm&aacute;quina' : 'm&aacute;quinas',
                )}`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#6b7280',
            },
            grid: {
              color: 'rgba(15, 15, 21, 0.08)',
            },
          },
          y: {
            ticks: {
              color: '#374151',
              font: {
                family: 'Figtree, sans-serif',
                weight: 700,
              },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    };

    updateChart('category', els.categoryChart, config);
  };

  const renderRecentMachines = () => {
    if (!els.recentMachines) return;

    const recent = [...state.machines]
      .sort((left, right) => getMachineTime(right) - getMachineTime(left))
      .slice(0, 3);

    if (!recent.length) {
      els.recentMachines.innerHTML = `
        <div class="admin-empty-state">
          Nenhuma m&aacute;quina cadastrada ainda.
        </div>
      `;
      return;
    }

    els.recentMachines.innerHTML = recent
      .map((machine) => {
        const status = getStatus(machine.commercialStatus);
        const image = assetPath(machine.mainImageUrl);
        const machineId = escapeHtml(machine.id);
        const machineName = displayText(machine.name);
        const machineCategory = displayText(machine.category || 'Sem categoria');
        const machineImage = escapeHtml(image);
        const statusLabel = displayText(status.label);
        const updatedDate = displayText(formatDate(machine.updatedAt || machine.createdAt));
        return `
          <article class="admin-recent-item">
            <div class="admin-recent-media">
              ${
                image
                  ? `<img src="${machineImage}" alt="${machineName}" loading="lazy">`
                  : '<span>Sem imagem</span>'
              }
            </div>
            <div class="admin-recent-copy">
              <strong>${machineName}</strong>
              <span>${machineCategory}</span>
              <div class="admin-recent-meta">
                <span class="admin-badge ${getStatusClass(machine.commercialStatus)}">${statusLabel}</span>
                <span>Atualizado em ${updatedDate}</span>
              </div>
            </div>
            <button class="admin-btn" type="button" data-dashboard-edit="${machineId}">Editar</button>
          </article>
        `;
      })
      .join('');
  };

  const renderAlerts = (stats) => {
    if (!els.alerts) return;

    const alerts = [
      {
        count: stats.unavailableMachines.length,
        title: 'M&aacute;quinas indispon&iacute;veis',
        text: `${stats.unavailableMachines.length} m&aacute;quina${stats.unavailableMachines.length === 1 ? '' : 's'} indispon&iacute;vel${stats.unavailableMachines.length === 1 ? '' : 'eis'} ou em manuten&ccedil;&atilde;o.`,
        tone: 'critical',
        level: 'Aten&ccedil;&atilde;o',
        icon: 'unavailable',
        machines: stats.unavailableMachines,
      },
      {
        count: stats.withoutImageMachines.length,
        title: 'M&aacute;quinas sem imagem',
        text: `${stats.withoutImageMachines.length} cadastro${stats.withoutImageMachines.length === 1 ? '' : 's'} sem imagem principal.`,
        tone: 'warn',
        level: 'Conte&uacute;do',
        icon: 'image',
        machines: stats.withoutImageMachines,
      },
      {
        count: stats.inactiveMachines.length,
        title: 'M&aacute;quinas inativas',
        text: `${stats.inactiveMachines.length} cadastro${stats.inactiveMachines.length === 1 ? '' : 's'} fora do cat&aacute;logo p&uacute;blico.`,
        tone: 'neutral',
        level: 'Publica&ccedil;&atilde;o',
        icon: 'inactive',
        machines: stats.inactiveMachines,
      },
      {
        count: stats.withoutCategoryMachines.length,
        title: 'M&aacute;quinas sem categoria',
        text: `${stats.withoutCategoryMachines.length} cadastro${stats.withoutCategoryMachines.length === 1 ? '' : 's'} sem categoria definida.`,
        tone: 'neutral',
        level: 'Organiza&ccedil;&atilde;o',
        icon: 'category',
        machines: stats.withoutCategoryMachines,
      },
    ].filter((alert) => alert.count > 0);

    if (!alerts.length) {
      els.alerts.innerHTML = `
        <div class="admin-alert-empty">
          <span class="admin-alert-empty-icon" aria-hidden="true">${getAlertIcon('ok')}</span>
          <div>
            <strong>Nenhum alerta operacional</strong>
            <span>O cat&aacute;logo n&atilde;o possui pend&ecirc;ncias importantes no momento.</span>
          </div>
        </div>
      `;
      return;
    }

    const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);

    els.alerts.innerHTML = [
      `<div class="admin-alert-footnote">${totalAlerts} ${totalAlerts === 1 ? 'alerta ativo' : 'alertas ativos'} no cat&aacute;logo</div>`,
      ...alerts
      .map((alert, index) => {
        const preview = getAlertPreview(alert.machines);
        return `
          <article class="admin-alert-item ${alert.tone}">
            <span class="admin-alert-icon" aria-hidden="true">${getAlertIcon(alert.icon)}</span>
            <div>
              <div class="admin-alert-title-row">
                <strong>${alert.title}</strong>
                <span class="admin-alert-level">${alert.level}</span>
              </div>
              <span>${alert.text}</span>
              ${preview ? `<small>${preview}</small>` : ''}
            </div>
            <button class="admin-btn" type="button" data-dashboard-view="maquinas">Ver</button>
          </article>
        `;
      })
    ]
      .join('');
  };

  const renderTable = () => {
    const filteredMachines = getFilteredMachines();
    renderMachinesTableSummary(filteredMachines);

    if (!filteredMachines.length) {
      els.table.innerHTML = `
        <tr>
          <td colspan="7">${state.machines.length ? 'Nenhuma m&aacute;quina encontrada com os filtros atuais.' : 'Nenhuma m&aacute;quina cadastrada.'}</td>
        </tr>
      `;
      return;
    }

    els.table.innerHTML = filteredMachines
      .map((machine) => {
        const status = getStatus(machine.commercialStatus);
        const machineId = escapeHtml(machine.id);
        const machineName = displayText(machine.name);
        const machineSlug = displayText(machine.slug);
        const machineCategory = displayText(machine.category);
        const machineImage = escapeHtml(assetPath(machine.mainImageUrl));
        const statusLabel = displayText(status.label);
        const detailUrl = escapeHtml(`../catalogo/maquinas/${encodeURIComponent(machine.slug)}/`);
        const featured = isFeaturedMachine(machine);
        return `
          <tr>
            <td>
              <div class="admin-machine-cell">
                <span class="admin-thumb-frame">
                  <img class="admin-thumb" src="${machineImage}" alt="${machineName}" loading="lazy">
                </span>
                <div>
                  <strong>${machineName}</strong>
                  <span>${machineSlug}</span>
                </div>
              </div>
            </td>
            <td>${machineCategory}</td>
            <td><span class="admin-badge admin-status-badge ${getStatusClass(machine.commercialStatus)}">${statusLabel}</span></td>
            <td class="admin-table-number">${machine.quantityAvailable || 0}</td>
            <td>${featured ? '<span class="admin-badge admin-table-badge featured">Destaque</span>' : '<span class="admin-muted-text">N&atilde;o</span>'}</td>
            <td><span class="admin-badge admin-table-badge ${machine.active ? 'good' : 'warn'}">${machine.active ? 'Ativa' : 'Inativa'}</span></td>
            <td>
              <div class="admin-row-actions">
                <a class="admin-btn" href="${detailUrl}">Ver</a>
                <button class="admin-btn" type="button" data-edit-machine="${machineId}">Editar</button>
                <button class="admin-btn admin-toggle-machine-btn" type="button" data-toggle-machine="${machineId}">${machine.active ? 'Desativar' : 'Ativar'}</button>
                <button class="admin-btn danger" type="button" data-delete-machine="${machineId}">Excluir</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
    applyRatioImageZoom(els.table);
  };

  // Admin - maquinas, filtros e formulario de cadastro
  const renderMachinesTableSummary = (machines = state.machines) => {
    const total = machines.length;
    const active = machines.filter((machine) => machine.active).length;
    const featured = machines.filter(isFeaturedMachine).length;
    const hasFilters = hasActiveMachineFilters();

    if (els.machinesSummary) {
      els.machinesSummary.textContent =
        hasFilters
          ? `${total} resultado${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'} com os filtros atuais.`
          : total > 0
          ? 'Controle de status, disponibilidade e prioridade no cat\u00e1logo.'
          : 'Nenhuma m\u00e1quina cadastrada para gerenciamento.';
    }

    if (els.machinesActiveSummary) {
      els.machinesActiveSummary.textContent = `${active} ativa${active === 1 ? '' : 's'}`;
    }

    if (els.machinesFeaturedSummary) {
      els.machinesFeaturedSummary.textContent = `${featured} destaque${featured === 1 ? '' : 's'}`;
    }

    updateMachineFiltersToggle();
  };

  const updateMachineFilter = (key, value) => {
    state.machineFilters[key] = String(value || '').trim();
    renderTable();
  };

  const toggleMachineFilters = () => {
    const isOpen = !els.machinesPanel?.classList.contains('filters-open');
    setMachineFiltersOpen(isOpen);
  };

  const setMachineFiltersOpen = (isOpen) => {
    if (!els.machinesPanel || !els.machineFiltersToggle) return;
    els.machinesPanel.classList.toggle('filters-open', isOpen);
    els.machineFiltersToggle.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) closeAllCustomSelects();
  };

  const updateMachineFiltersToggle = () => {
    if (!els.machineFiltersCount) return;
    const count = getActiveMachineFilterCount();
    els.machineFiltersCount.textContent = String(count);
    els.machineFiltersCount.hidden = count === 0;
  };

  const getActiveMachineFilterCount = () =>
    Object.values(state.machineFilters).filter((value) => String(value || '').trim()).length;

  const resetMachineFilters = () => {
    state.machineFilters = {
      search: '',
      category: '',
      status: '',
      active: '',
      featured: '',
    };
    syncMachineFilterControls();
    renderTable();
  };

  const syncMachineFilterControls = () => {
    if (els.machineSearch) els.machineSearch.value = state.machineFilters.search;
    syncMachineSearchClear();
    setCustomSelectValue('machineCategoryFilter', state.machineFilters.category);
    setCustomSelectValue('machineStatusFilter', state.machineFilters.status);
    setCustomSelectValue('machineActiveFilter', state.machineFilters.active);
    setCustomSelectValue('machineFeaturedFilter', state.machineFilters.featured);
  };

  const syncMachineSearchClear = () => {
    if (!els.machineSearchClear) return;
    els.machineSearchClear.hidden = !String(els.machineSearch?.value || '').trim();
  };

  const hasActiveMachineFilters = () => Object.values(state.machineFilters).some(Boolean);

  const getFilteredMachines = () => {
    const search = decodeHtml(state.machineFilters.search).toLowerCase();

    return state.machines.filter((machine) => {
      const haystack = [machine.name, machine.slug, machine.category]
        .map((value) => decodeHtml(value).toLowerCase())
        .join(' ');

      if (search && !haystack.includes(search)) return false;
      if (state.machineFilters.category && machine.category !== state.machineFilters.category) return false;
      if (state.machineFilters.status && machine.commercialStatus !== state.machineFilters.status) return false;
      if (state.machineFilters.active === 'active' && !machine.active) return false;
      if (state.machineFilters.active === 'inactive' && machine.active) return false;
      if (state.machineFilters.featured === 'featured' && !isFeaturedMachine(machine)) return false;
      if (state.machineFilters.featured === 'regular' && isFeaturedMachine(machine)) return false;
      return true;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    syncImageFields();
    const data = getFormValues();
    const validation = validateMachine(data);

    if (validation) {
      showMessage(els.formMessage, validation, 'error');
      return;
    }

    let successMessage = '';

    if (state.editingId) {
      const current = state.machines.find((machine) => machine.id === state.editingId);
      const previousRemoteId = getRemoteDocumentId(current);
      const nextRemoteId = getRemoteDocumentId({ ...current, ...data });
      if (previousRemoteId && nextRemoteId && previousRemoteId !== nextRemoteId) {
        markRemoteDelete('products', previousRemoteId);
      }

      state.machines = state.machines.map((machine) =>
        machine.id === state.editingId
          ? {
              ...machine,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : machine,
      );
      successMessage = 'M&aacute;quina atualizada com sucesso.';
    } else {
      const machine = {
        id: createId(data.name),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      unmarkRemoteDelete('products', getRemoteDocumentId(machine));
      state.machines = [
        {
          ...machine,
        },
        ...state.machines,
      ];
      successMessage = 'M&aacute;quina cadastrada com sucesso.';
    }

    resetForm({ keepMessage: true });
    const synced = await persistAndRender({ errorTarget: els.formMessage });
    if (synced) showMessage(els.formMessage, successMessage, 'success');
  };

  const getFormValues = () => {
    const data = new FormData(els.form);
    const slug = String(data.get('slug') || '').trim();
    const name = String(data.get('name') || '').trim();

    return {
      name,
      slug: slugify(slug || name),
      category: String(data.get('category') || '').trim(),
      shortDescription: String(data.get('shortDescription') || '').trim(),
      fullDescription: String(data.get('fullDescription') || '').trim(),
      mainImageUrl: String(data.get('mainImageUrl') || '').trim(),
      galleryImageUrls: String(data.get('galleryImageUrls') || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      specs: {
        modelo: String(data.get('modelo') || '').trim(),
        capacidade: String(data.get('capacidade') || '').trim(),
        ano: String(data.get('ano') || '').trim(),
        estado: decodeHtml(String(data.get('estado') || '').trim()),
        acionamento: decodeHtml(String(data.get('acionamento') || '').trim()),
        tensao: decodeHtml(String(data.get('tensao') || '').trim()),
        dimensoes: String(data.get('dimensoes') || '').trim(),
        peso: formatWeightValue(data.get('pesoValor'), data.get('pesoUnidade')),
        aplicacao: String(data.get('aplicacao') || '').trim(),
        observacoes: String(data.get('observacoes') || '').trim(),
      },
      active: data.get('active') === 'on',
      featured: data.get('featured') === 'on',
      destaque: data.get('featured') === 'on',
      allowQuote: true,
      commercialStatus: String(data.get('commercialStatus') || '').trim(),
      quantityAvailable: toNumber(data.get('quantityAvailable')),
      quantityReserved: toNumber(data.get('quantityReserved')),
      minimumStock: toNumber(data.get('minimumStock')),
      internalNote: String(data.get('internalNote') || '').trim(),
    };
  };

  const validateMachine = (data) => {
    if (!data.name) return 'Nome da m&aacute;quina &eacute; obrigat&oacute;rio.';
    if (!data.slug) return 'Informe um slug v&aacute;lido para a m&aacute;quina.';
    if (isMachineSlugInUse(data.slug, state.editingId)) {
      return 'Este slug j&aacute; est&aacute; em uso. Escolha outro caminho para a p&aacute;gina do produto.';
    }
    if (!data.category) return 'Categoria &eacute; obrigat&oacute;ria.';
    if (!data.shortDescription) return 'Descri&ccedil;&atilde;o curta &eacute; obrigat&oacute;ria.';
    if (!data.mainImageUrl) return 'Adicione pelo menos uma imagem do produto.';
    if (!data.commercialStatus) return 'Status comercial &eacute; obrigat&oacute;rio.';
    if (data.quantityAvailable < 0 || data.quantityReserved < 0 || data.minimumStock < 0) {
      return 'Quantidades n&atilde;o podem ser negativas.';
    }
    return '';
  };

  const applyRatioImageZoom = (root = document) => {
    root.querySelectorAll('.admin-thumb').forEach(prepareRatioImageZoom);
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

  const isMachineSlugInUse = (slug, ignoredId = '') => {
    const normalizedSlug = slugify(slug);
    const normalizedIgnoredId = String(ignoredId || '').trim();
    if (!normalizedSlug) return false;

    return state.machines.some((machine) => {
      const sameMachine = normalizedIgnoredId && String(machine.id || '').trim() === normalizedIgnoredId;
      if (sameMachine) return false;
      return slugify(machine.slug || machine.name || '') === normalizedSlug;
    });
  };

  const startEdit = (id) => {
    const machine = state.machines.find((item) => item.id === id);
    if (!machine) return;
    state.editingId = id;
    els.formTitle.textContent = decodeHtml('Editar m&aacute;quina');
    hideMessage(els.formMessage);
    setFormValues(machine);
    openView('cadastrar');
  };

  const setFormValues = (machine) => {
    const fields = {
      name: machine.name,
      slug: machine.slug,
      category: machine.category,
      shortDescription: machine.shortDescription,
      fullDescription: machine.fullDescription,
      commercialStatus: machine.commercialStatus,
      quantityAvailable: machine.quantityAvailable,
      quantityReserved: machine.quantityReserved,
      minimumStock: machine.minimumStock,
      internalNote: machine.internalNote,
      ...machine.specs,
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = els.form.elements[name];
      if (input) input.value = decodeFieldValue(value);
    });

    setWeightFields(machine.specs?.peso || '');
    els.form.elements.active.checked = Boolean(machine.active);
    els.form.elements.featured.checked = isFeaturedMachine(machine);
    setImageCollection(getMachineImages(machine));
    syncFormCustomSelects();
  };

  const toggleActive = (id) => {
    state.machines = state.machines.map((machine) =>
      machine.id === id
        ? { ...machine, active: !machine.active, updatedAt: new Date().toISOString() }
        : machine,
    );
    persistAndRender({ errorTarget: els.formMessage });
  };

  const deleteMachine = (id) => {
    const machine = state.machines.find((item) => item.id === id);
    if (!machine) return;

    openConfirmMachineRemoveModal(machine);
  };

  const openConfirmMachineRemoveModal = (machine) => {
    openMachineRemoveModal({
      targetId: machine.id,
      title: 'Excluir produto?',
      message: `O produto <strong>${displayText(
        machine.name,
      )}</strong> ser&aacute; removido do invent&aacute;rio administrativo.`,
      detail: '',
    });
  };

  const openMachineRemoveModal = ({ targetId, title, message, detail }) => {
    if (!els.machineRemoveModal) return;

    const wasOpen = isMachineRemoveModalOpen();
    state.machineRemoveTargetId = targetId;
    if (!wasOpen) {
      state.machineRemoveLastFocus = document.activeElement;
      state.machineRemovePreviousOverflow = document.body.style.overflow;
    }

    els.machineRemoveModal.classList.add('confirm');
    els.machineRemoveTitle.innerHTML = title;
    els.machineRemoveMessage.innerHTML = message;
    els.machineRemoveDetail.innerHTML = detail;
    els.machineRemoveDetail.hidden = !detail;
    els.machineRemoveModal.hidden = false;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      els.machineRemoveConfirm?.focus();
    }, 0);
  };

  const closeMachineRemoveModal = ({ restoreFocus = true } = {}) => {
    if (!els.machineRemoveModal || els.machineRemoveModal.hidden) return;

    els.machineRemoveModal.hidden = true;
    els.machineRemoveModal.classList.remove('confirm');
    els.machineRemoveDetail.hidden = false;
    state.machineRemoveTargetId = '';
    document.body.style.overflow = state.machineRemovePreviousOverflow;

    if (restoreFocus && state.machineRemoveLastFocus?.focus) {
      state.machineRemoveLastFocus.focus();
    }

    state.machineRemoveLastFocus = null;
    state.machineRemovePreviousOverflow = '';
  };

  const isMachineRemoveModalOpen = () =>
    Boolean(els.machineRemoveModal && !els.machineRemoveModal.hidden);

  const confirmMachineRemove = async () => {
    const id = state.machineRemoveTargetId;
    const machine = state.machines.find((item) => item.id === id);
    if (!machine) {
      closeMachineRemoveModal();
      return;
    }

    markRemoteDelete('products', getRemoteDocumentId(machine));
    state.machines = state.machines.filter((item) => item.id !== id);
    closeMachineRemoveModal({ restoreFocus: false });
    await persistAndRender({ errorTarget: els.formMessage });
    resetForm();
  };

  const resetForm = ({ keepMessage = false } = {}) => {
    state.editingId = '';
    els.form.reset();
    els.formTitle.textContent = decodeHtml('Cadastrar m&aacute;quina');
    els.form.elements.active.checked = true;
    customSelectTypes.forEach((type) => setCustomSelectValue(type, ''));
    setCustomSelectValue('weightUnit', 'kg');
    setImageCollection([]);
    if (!keepMessage) hideMessage(els.formMessage);
  };

  // Admin - normalizacao de dados de maquinas
  const formatWeightValue = (value, unit) => {
    const normalizedValue = String(value || '').replace(',', '.').trim();
    if (!normalizedValue) return '';

    const number = Number(normalizedValue);
    if (!Number.isFinite(number) || number < 0) return '';

    const normalizedUnit = ['g', 'kg', 't'].includes(String(unit || '').trim())
      ? String(unit).trim()
      : 'kg';
    const cleanValue = String(number).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
    return `${cleanValue} ${normalizedUnit}`;
  };

  const setWeightFields = (weight) => {
    const parsed = parseWeightValue(weight);
    const weightInput = els.form.elements.pesoValor;
    if (weightInput) weightInput.value = parsed.value;
    setCustomSelectValue('weightUnit', parsed.unit || 'kg');
  };

  const parseWeightValue = (weight) => {
    const value = decodeHtml(String(weight || '')).trim().replace(',', '.');
    const match = value.match(
      /^([0-9]+(?:\.[0-9]+)?)\s*(g|grama|gramas|kg|quilo|quilos|quilograma|quilogramas|t|ton|tons|tonelada|toneladas)$/i,
    );

    if (!match) return { value: '', unit: 'kg' };

    const unit = match[2].toLowerCase();
    if (['g', 'grama', 'gramas'].includes(unit)) return { value: match[1], unit: 'g' };
    if (['t', 'ton', 'tons', 'tonelada', 'toneladas'].includes(unit)) {
      return { value: match[1], unit: 't' };
    }
    return { value: match[1], unit: 'kg' };
  };

  const handleImageFileInput = () => {
    handleImageFiles(Array.from(els.fileInput.files || []));
    els.fileInput.value = '';
  };

  const handleUploadDragOver = (event) => {
    event.preventDefault();
    els.uploadDropzone?.classList.add('dragging');
  };

  const handleUploadDragLeave = () => {
    els.uploadDropzone?.classList.remove('dragging');
  };

  const handleUploadDrop = (event) => {
    event.preventDefault();
    els.uploadDropzone?.classList.remove('dragging');
    handleImageFiles(Array.from(event.dataTransfer?.files || []));
  };

  const handleImageFiles = async (files) => {
    const validFiles = files.filter(validateImageFile);
    if (!validFiles.length) return;

    const cloudinaryConfig =
      hasRemoteBackend() && backend.uploadImage ? {} : getCloudinaryConfig();

    if (!cloudinaryConfig) {
      const localImages = validFiles.map((file) => ({
        id: createImageId(),
        name: file.name,
        url: '',
        previewUrl: URL.createObjectURL(file),
        status: 'local',
      }));
      state.images = [...state.images, ...localImages];
      renderImageGallery();
      showMessage(
        els.formMessage,
        'N&atilde;o foi poss&iacute;vel carregar a imagem agora. Tente novamente em instantes.',
        'error',
      );
      return;
    }

    const pendingImages = validFiles.map((file) => ({
      id: createImageId(),
      name: file.name,
      url: '',
      previewUrl: URL.createObjectURL(file),
      file,
      status: 'uploading',
    }));

    state.images = [...state.images, ...pendingImages];
    renderImageGallery();
    showMessage(els.formMessage, 'Imagem carregando...', 'loading');

    const results = await Promise.all(
      pendingImages.map(async (image) => {
        try {
          const uploadedUrl = await uploadImageToCloudinary(image.file, cloudinaryConfig);
          return { image, uploadedUrl };
        } catch (error) {
          return { image, error };
        }
      }),
    );

    let failed = 0;
    const errors = [];

    results.forEach((result) => {
      if (result.error) {
        failed += 1;
        result.image.status = 'error';
        errors.push(getFriendlyErrorMessage(result.error, 'upload'));
        return;
      }

      const { image, uploadedUrl } = result;
      if (image.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(image.previewUrl);
      image.url = uploadedUrl;
      image.previewUrl = uploadedUrl;
      image.status = 'ready';
      delete image.file;
    });

    renderImageGallery();

    if (failed) {
      const detail = errors.length ? ` ${errors[0]}` : '';
      showMessage(
        els.formMessage,
        `${failed} imagem${failed === 1 ? '' : 's'} n&atilde;o ${failed === 1 ? 'foi carregada' : 'foram carregadas'}.${detail}`,
        'error',
      );
      return;
    }

    showMessage(
      els.formMessage,
      'Imagem carregada com sucesso!',
      'success',
    );
  };

  const validateImageFile = (file) => {
    const hasAllowedType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
    const hasAllowedExtension = /\.(jpe?g|png|webp)$/i.test(file.name || '');

    if (!hasAllowedType && !hasAllowedExtension) {
      showMessage(els.formMessage, 'Use apenas imagens PNG, JPEG, JPG ou WEBP.', 'error');
      return false;
    }

    if (file.size > 8 * 1024 * 1024) {
      showMessage(els.formMessage, 'Cada imagem deve ter no m&aacute;ximo 8MB.', 'error');
      return false;
    }

    return true;
  };

  const renderImageGallery = () => {
    syncImageFields();

    if (!els.imageList || !els.imageEmpty) return;

    els.imageEmpty.hidden = state.images.length > 0;
    els.imageList.innerHTML = state.images
      .map((image, index) => {
        const preview = escapeHtml(assetPath(image.previewUrl || image.url));
        const name = displayText(image.name || `Imagem ${index + 1}`);
        const statusLabel = getImageStatusLabel(image);
        const draggingClass = image.id === state.draggingImageId ? ' dragging' : '';
        return `
          <article class="admin-image-card${draggingClass}" draggable="true" data-image-id="${escapeAttr(image.id)}">
            <button class="admin-image-card-media" type="button" data-preview-image="${escapeAttr(image.id)}" aria-label="Ampliar ${name}">
              <span class="admin-image-position">${index + 1}</span>
              ${preview ? `<img src="${preview}" alt="${name}" loading="lazy">` : '<span>Carregando imagem</span>'}
            </button>
            ${statusLabel ? `<span class="admin-image-badge">${statusLabel}</span>` : ''}
            <div class="admin-image-card-actions">
              <span class="admin-image-drag" data-image-drag-handle aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
                </svg>
                <span class="admin-image-drag-label admin-image-drag-label-desktop">Arrastar</span>
                <span class="admin-image-drag-label admin-image-drag-label-mobile">Segure e arraste</span>
              </span>
              <div class="admin-image-mobile-order" aria-label="Reordenar imagem">
                <button class="admin-image-order-button" type="button" data-move-image="${escapeAttr(image.id)}" data-move-direction="-1" ${index === 0 ? 'disabled' : ''}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 19V5m0 0-6 6m6-6 6 6" />
                  </svg>
                  Subir
                </button>
                <button class="admin-image-order-button" type="button" data-move-image="${escapeAttr(image.id)}" data-move-direction="1" ${index === state.images.length - 1 ? 'disabled' : ''}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 5v14m0 0 6-6m-6 6-6-6" />
                  </svg>
                  Descer
                </button>
              </div>
              <button class="admin-image-remove" type="button" data-remove-image="${escapeAttr(image.id)}">Remover</button>
            </div>
          </article>
        `;
      })
      .join('');
  };

  const getImageStatusLabel = (image) => {
    if (image.status === 'uploading') return 'Enviando';
    if (image.status === 'error') return 'Falha';
    return '';
  };

  const handleImageListClick = (event) => {
    const removeButton = event.target.closest('[data-remove-image]');
    const moveButton = event.target.closest('[data-move-image]');
    const previewButton = event.target.closest('[data-preview-image]');

    if (moveButton) {
      moveImageByOffset(moveButton.dataset.moveImage, Number(moveButton.dataset.moveDirection));
      return;
    }

    if (previewButton) {
      openImageLightbox(previewButton.dataset.previewImage);
      return;
    }

    if (!removeButton) return;

    removeImage(removeButton.dataset.removeImage);
  };

  const openImageLightbox = (id) => {
    const image = state.images.find((item) => item.id === id);
    const source = image?.previewUrl || image?.url;
    if (!image || !source || !els.imageLightbox || !els.imageLightboxImg) return;

    const index = state.images.findIndex((item) => item.id === id);
    els.imageLightboxImg.src = assetPath(source);
    els.imageLightboxImg.alt = decodeHtml(image.name || `Imagem ${index + 1}`);

    if (els.imageLightboxCaption) {
      els.imageLightboxCaption.textContent = `Imagem ${index + 1}`;
    }

    els.imageLightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeImageLightbox = () => {
    if (!els.imageLightbox) return;
    els.imageLightbox.hidden = true;
    if (els.imageLightboxImg) {
      els.imageLightboxImg.removeAttribute('src');
      els.imageLightboxImg.alt = '';
    }
    document.body.style.overflow = '';
  };

  const handleImageLightboxClick = (event) => {
    if (event.target === els.imageLightbox) closeImageLightbox();
  };

  const handleImageDragStart = (event) => {
    if (state.pointerImageDrag) {
      event.preventDefault();
      return;
    }

    const card = event.target.closest('[data-image-id]');
    if (!card) return;

    state.draggingImageId = card.dataset.imageId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', state.draggingImageId);
    card.classList.add('dragging');
  };

  const handleImageDragOver = (event) => {
    if (!state.draggingImageId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (event) => {
    if (!state.draggingImageId) return;
    event.preventDefault();

    const targetCard = event.target.closest('[data-image-id]');
    if (!targetCard || targetCard.dataset.imageId === state.draggingImageId) {
      handleImageDragEnd();
      return;
    }

    moveImageNearTarget(state.draggingImageId, targetCard, event.clientX, event.clientY);
    handleImageDragEnd();
  };

  const handleImageDragEnd = () => {
    state.draggingImageId = '';
    state.pointerImageDrag = null;
    clearImageTouchDrag();
    els.imageList
      ?.querySelectorAll('.admin-image-card.dragging')
      .forEach((card) => card.classList.remove('dragging'));
  };

  const handleImagePointerStart = (event) => {
    if (event.pointerType === 'touch') return;

    const handle = event.target.closest('[data-image-drag-handle]');
    if (!handle || !els.imageList?.contains(handle)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const card = handle.closest('[data-image-id]');
    if (!card) return;

    event.preventDefault();
    state.draggingImageId = card.dataset.imageId;
    state.pointerImageDrag = {
      id: state.draggingImageId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastTargetId: '',
      active: false,
    };
    card.classList.add('dragging');
    handle.setPointerCapture?.(event.pointerId);
  };

  const handleImagePointerMove = (event) => {
    const drag = state.pointerImageDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.active && distance < 8) return;

    drag.active = true;
    event.preventDefault();

    const targetCard = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-image-id]');
    if (!targetCard || !els.imageList?.contains(targetCard)) {
      drag.lastTargetId = '';
      return;
    }

    const targetId = targetCard.dataset.imageId;
    if (!targetId || targetId === drag.id) {
      drag.lastTargetId = '';
      return;
    }

    const insertAfter = shouldInsertImageAfterTarget(targetCard, event.clientX, event.clientY);
    const targetKey = `${targetId}:${insertAfter ? 'after' : 'before'}`;
    if (drag.lastTargetId === targetKey) return;

    moveImageRelativeToTarget(drag.id, targetId, insertAfter);
    drag.lastTargetId = targetKey;
  };

  const handleImagePointerEnd = (event) => {
    const drag = state.pointerImageDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    handleImageDragEnd();
  };

  const handleImageTouchStart = (event) => {
    const touch = event.touches?.[0];
    const handle = event.target.closest('[data-image-drag-handle]');
    if (!touch || !handle || !els.imageList?.contains(handle)) return;

    const card = handle.closest('[data-image-id]');
    if (!card) return;

    event.preventDefault();
    clearImageTouchDrag();

    state.touchImageDrag = {
      id: card.dataset.imageId,
      touchId: touch.identifier,
      card,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTargetId: '',
      active: false,
      timer: window.setTimeout(() => {
        activateImageTouchDrag();
        reorderImageFromTouchPosition();
      }, TOUCH_IMAGE_DRAG_DELAY),
    };
  };

  const handleImageTouchMove = (event) => {
    const drag = state.touchImageDrag;
    if (!drag) return;

    const touch = getImageTouch(event.touches, drag.touchId);
    if (!touch) return;

    const distance = Math.hypot(touch.clientX - drag.lastX, touch.clientY - drag.lastY);
    event.preventDefault();
    drag.lastX = touch.clientX;
    drag.lastY = touch.clientY;

    if (!drag.active && distance > 10) activateImageTouchDrag();
    if (!drag.active) return;

    reorderImageFromTouchPosition();
  };

  const handleImageTouchEnd = (event) => {
    const drag = state.touchImageDrag;
    if (!drag) return;

    const touch = getImageTouch(event.changedTouches, drag.touchId);
    if (!touch) return;

    handleImageDragEnd();
  };

  const activateImageTouchDrag = () => {
    const drag = state.touchImageDrag;
    if (!drag || drag.active) return;

    drag.active = true;
    state.draggingImageId = drag.id;
    drag.card?.classList.add('dragging');
    document.body.classList.add('admin-touch-reordering');
  };

  const reorderImageFromTouchPosition = () => {
    const drag = state.touchImageDrag;
    if (!drag || !drag.active) return;

    const targetCard = document.elementFromPoint(drag.lastX, drag.lastY)?.closest('[data-image-id]');
    if (!targetCard || !els.imageList?.contains(targetCard)) {
      drag.lastTargetId = '';
      return;
    }

    const targetId = targetCard.dataset.imageId;
    if (!targetId || targetId === drag.id) {
      drag.lastTargetId = '';
      return;
    }

    const insertAfter = shouldInsertImageAfterTarget(targetCard, drag.lastX, drag.lastY);
    const targetKey = `${targetId}:${insertAfter ? 'after' : 'before'}`;
    if (drag.lastTargetId === targetKey) return;

    moveImageRelativeToTarget(drag.id, targetId, insertAfter);
    drag.lastTargetId = targetKey;
  };

  const clearImageTouchDrag = () => {
    if (state.touchImageDrag?.timer) window.clearTimeout(state.touchImageDrag.timer);
    state.touchImageDrag = null;
    document.body.classList.remove('admin-touch-reordering');
  };

  const getImageTouch = (touches, touchId) => Array.from(touches || []).find((touch) => touch.identifier === touchId);

  const removeImage = (id) => {
    const image = state.images.find((item) => item.id === id);
    if (image?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(image.previewUrl);
    state.images = state.images.filter((item) => item.id !== id);
    renderImageGallery();
  };

  const moveImageByOffset = (id, offset) => {
    const currentIndex = state.images.findIndex((image) => image.id === id);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.images.length) return;

    const next = [...state.images];
    const [image] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, image);
    state.images = next;
    renderImageGallery();
  };

  const moveImageNearTarget = (draggedId, targetCard, clientX, clientY) => {
    const insertAfter = shouldInsertImageAfterTarget(targetCard, clientX, clientY);
    moveImageRelativeToTarget(draggedId, targetCard.dataset.imageId, insertAfter);
  };

  const shouldInsertImageAfterTarget = (targetCard, clientX, clientY) => {
    const rect = targetCard.getBoundingClientRect();
    const listRect = els.imageList?.getBoundingClientRect();
    const isSingleColumn = listRect ? rect.width > listRect.width * 0.72 : false;

    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      return isSingleColumn
        ? clientY > rect.top + rect.height / 2
        : clientX > rect.left + rect.width / 2;
    }

    const draggedIndex = state.images.findIndex((image) => image.id === state.draggingImageId);
    const targetIndex = state.images.findIndex((image) => image.id === targetCard.dataset.imageId);
    return draggedIndex < targetIndex;
  };

  const moveImageRelativeToTarget = (draggedId, targetId, insertAfter) => {
    const draggedIndex = state.images.findIndex((image) => image.id === draggedId);
    const targetIndex = state.images.findIndex((image) => image.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) return;

    const next = [...state.images];
    const [dragged] = next.splice(draggedIndex, 1);
    let insertIndex = targetIndex;
    if (draggedIndex < targetIndex) insertIndex -= 1;
    if (insertAfter) insertIndex += 1;
    insertIndex = Math.max(0, Math.min(insertIndex, next.length));
    next.splice(insertIndex, 0, dragged);
    state.images = next;
    renderImageGallery();
  };

  const setImageCollection = (urls) => {
    state.images.forEach((image) => {
      if (image.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(image.previewUrl);
    });

    const uniqueUrls = Array.from(new Set((urls || []).filter(Boolean)));
    state.images = uniqueUrls.map((url, index) => ({
      id: createImageId(),
      name: getImageName(url) || `Imagem ${index + 1}`,
      url,
      previewUrl: url,
      status: 'ready',
    }));
    renderImageGallery();
  };

  const getMachineImages = (machine) => [
    machine.mainImageUrl,
    ...(Array.isArray(machine.galleryImageUrls) ? machine.galleryImageUrls : []),
  ];

  const syncImageFields = () => {
    const readyImages = state.images.filter((image) => image.url && image.status === 'ready');
    const urls = readyImages.map((image) => image.url);

    if (els.imageInput) els.imageInput.value = urls[0] || '';
    if (els.galleryInput) els.galleryInput.value = urls.join('\n');
  };

  const getCloudinaryConfig = () => {
    const config = window.ALS_CLOUDINARY_CONFIG || {};
    const cloudName = String(config.cloudName || '').trim();
    const uploadPreset = String(config.uploadPreset || '').trim();
    const folder = String(config.folder || '').trim();

    if (!cloudName || !uploadPreset) return null;
    return { cloudName, uploadPreset, folder };
  };

  const uploadImageToCloudinary = async (file, config) => {
    if (hasRemoteBackend() && backend.uploadImage) {
      return backend.uploadImage(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    if (config.folder) formData.append('folder', config.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(await readUploadError(response, 'Cloudinary recusou o envio da imagem.'));
    }

    const data = await response.json();
    const url = data.secure_url || data.url;
    if (!url) throw new Error('Cloudinary response without URL');
    return getOptimizedCloudinaryUrl(url);
  };

  const readUploadError = async (response, fallback) => {
    try {
      const data = await response.json();
      return data.error?.message || data.error || data.message || fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Admin - categorias
  const renderCategories = () => {
    syncCategoryFilterControls();

    if (!state.categories.length) {
      renderCategoryListSummary([]);
      els.categoryList.innerHTML = '<div class="admin-dev-card"><p>Nenhuma categoria cadastrada.</p></div>';
      return;
    }

    const categories = getFilteredCategories();
    renderCategoryListSummary(categories);

    if (!categories.length) {
      els.categoryList.innerHTML = '<div class="admin-dev-card"><p>Nenhuma categoria encontrada com os filtros atuais.</p></div>';
      return;
    }

    els.categoryList.innerHTML = categories
      .map((category) => {
        const count = countMachinesByCategory(category.name);
        const id = escapeHtml(category.id);
        const isActive = Boolean(category.active);
        return `
          <article class="admin-category-item">
            <div class="admin-category-name">
              <strong>${displayText(category.name)}</strong>
              <span>${displayText(category.slug || '-')}</span>
            </div>
            <span class="admin-category-slug">${displayText(category.slug || '-')}</span>
            <span class="admin-category-count">${count}</span>
            <span class="admin-badge admin-category-status ${isActive ? 'good' : 'warn'}">${isActive ? 'Ativa' : 'Inativa'}</span>
            <div class="admin-category-actions">
              <button class="admin-category-actions-trigger" type="button" aria-label="Abrir a&ccedil;&otilde;es de ${displayText(category.name)}" aria-haspopup="menu" aria-expanded="false" data-category-actions-trigger>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="5.5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18.5" r="1.5" />
                </svg>
              </button>
              <div class="admin-category-actions-menu" role="menu" hidden>
                <button type="button" role="menuitem" data-edit-category="${id}">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m4 16.8-.7 3.9 3.9-.7L18.9 8.3l-3.2-3.2L4 16.8Z" />
                    <path d="m14.8 6 3.2 3.2" />
                  </svg>
                  Editar
                </button>
                <button type="button" role="menuitem" data-toggle-category="${id}">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M8 12h8" />
                    <path d="${isActive ? 'M15 7l5 5-5 5' : 'M9 7l-5 5 5 5'}" />
                  </svg>
                  ${isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button class="danger" type="button" role="menuitem" data-delete-category="${id}">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 7h14" />
                    <path d="M9.2 7V4.8h5.6V7" />
                    <path d="M7.2 9.4l.5 8.2a2.3 2.3 0 0 0 2.3 2.1h4a2.3 2.3 0 0 0 2.3-2.1l.5-8.2" />
                    <path class="admin-trash-inner-line" d="M10.4 11.4v5.2" />
                    <path class="admin-trash-inner-line" d="M13.6 11.4v5.2" />
                  </svg>
                  Remover
                </button>
              </div>
              <div class="admin-category-actions-inline" aria-label="A&ccedil;&otilde;es da categoria">
                <button type="button" data-edit-category="${id}">Editar</button>
                <button type="button" data-toggle-category="${id}">${isActive ? 'Desativar' : 'Ativar'}</button>
                <button class="danger" type="button" data-delete-category="${id}">Remover</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  };

  const getFilteredCategories = () => {
    const search = decodeHtml(state.categoryFilters.search).toLowerCase();
    const status = state.categoryFilters.status;

    return state.categories.filter((category) => {
      const haystack = decodeHtml(`${category.name} ${category.slug}`).toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesStatus =
        !status ||
        (status === 'active' && category.active) ||
        (status === 'inactive' && !category.active);
      return matchesSearch && matchesStatus;
    });
  };

  const renderCategoryListSummary = (categories) => {
    if (!els.categoryListSummary) return;
    const filtered = categories.length;
    const total = state.categories.length;
    const hasFilters = Boolean(state.categoryFilters.search || state.categoryFilters.status);

    els.categoryListSummary.textContent = hasFilters
      ? `${filtered} de ${total} categoria${total === 1 ? '' : 's'} exibida${filtered === 1 ? '' : 's'}.`
      : `${total} categoria${total === 1 ? '' : 's'} cadastrada${total === 1 ? '' : 's'}.`;
  };

  const syncCategoryFilterControls = () => {
    if (els.categorySearch && els.categorySearch.value !== state.categoryFilters.search) {
      els.categorySearch.value = state.categoryFilters.search;
    }

    els.categoryStatusFilterButtons.forEach((button) => {
      const isActive = (button.dataset.categoryStatusFilter || '') === state.categoryFilters.status;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const toggleCategoryActionsMenu = (trigger) => {
    const actions = trigger.closest('.admin-category-actions');
    const menu = actions?.querySelector('.admin-category-actions-menu');
    if (!actions || !menu) return;

    const isOpen = actions.classList.contains('open');
    closeAllCustomSelects();
    closeCategoryActionsMenus();

    if (isOpen) return;
    actions.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
  };

  const closeCategoryActionsMenus = () => {
    document.querySelectorAll('.admin-category-actions.open').forEach((actions) => {
      actions.classList.remove('open');
      actions.querySelector('[data-category-actions-trigger]')?.setAttribute('aria-expanded', 'false');
      const menu = actions.querySelector('.admin-category-actions-menu');
      if (menu) menu.hidden = true;
    });
  };

  const handleCategorySave = async (event) => {
    event.preventDefault();
    const data = new FormData(els.categoryForm);
    const name = String(data.get('name') || '').trim();
    const slugValue = String(data.get('slug') || '').trim();
    const category = {
      name,
      slug: slugify(slugValue || name),
      active: data.get('active') === 'on',
    };

    if (!category.name) {
      showMessage(els.categoryMessage, 'Informe o nome da categoria.', 'error');
      return;
    }

    const duplicate = state.categories.some(
      (item) =>
        item.id !== state.editingCategoryId &&
        decodeHtml(item.name).toLowerCase() === decodeHtml(category.name).toLowerCase(),
    );

    if (duplicate) {
      showMessage(els.categoryMessage, 'J&aacute; existe uma categoria com esse nome.', 'error');
      return;
    }

    let successMessage = '';

    if (state.editingCategoryId) {
      const current = state.categories.find((item) => item.id === state.editingCategoryId);
      const previousRemoteId = getRemoteDocumentId(current);
      const nextRemoteId = getRemoteDocumentId({ ...current, ...category });
      if (previousRemoteId && nextRemoteId && previousRemoteId !== nextRemoteId) {
        markRemoteDelete('categories', previousRemoteId);
      }

      state.categories = state.categories.map((item) =>
        item.id === state.editingCategoryId
          ? { ...item, ...category, updatedAt: new Date().toISOString() }
          : item,
      );

      if (current?.name && current.name !== category.name) {
        state.machines = state.machines.map((machine) =>
          sameText(machine.category, current.name)
            ? { ...machine, category: category.name, updatedAt: new Date().toISOString() }
            : machine,
        );
      }

      successMessage = 'Categoria atualizada com sucesso.';
    } else {
      const nextCategory = {
        id: createId(category.name),
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      unmarkRemoteDelete('categories', getRemoteDocumentId(nextCategory));
      state.categories = [nextCategory, ...state.categories];
      successMessage = 'Categoria cadastrada com sucesso.';
    }

    resetCategoryForm({ keepMessage: true });
    const synced = await persistAndRender({ errorTarget: els.categoryMessage });
    if (synced) showMessage(els.categoryMessage, successMessage, 'success');
  };

  const startCategoryEdit = (id) => {
    const category = state.categories.find((item) => item.id === id);
    if (!category) return;
    state.editingCategoryId = id;
    els.categoryFormTitle.textContent = 'Editar categoria';
    els.categoryForm.elements.name.value = decodeHtml(category.name);
    els.categoryForm.elements.slug.value = category.slug || '';
    els.categoryForm.elements.active.checked = Boolean(category.active);
    hideMessage(els.categoryMessage);
    scrollCategoryFormIntoView();
  };

  const scrollCategoryFormIntoView = () => {
    if (!window.matchMedia('(max-width: 980px)').matches || !els.categoryFormPanel) return;

    const top = els.categoryFormPanel.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const toggleCategory = (id) => {
    state.categories = state.categories.map((category) =>
      category.id === id
        ? { ...category, active: !category.active, updatedAt: new Date().toISOString() }
        : category,
    );
    persistAndRender({ errorTarget: els.categoryMessage });
  };

  const deleteCategory = (id) => {
    const category = state.categories.find((item) => item.id === id);
    if (!category) return;

    const count = countMachinesByCategory(category.name);
    if (count > 0) {
      openBlockedCategoryRemoveModal(category, count);
      return;
    }

    openConfirmCategoryRemoveModal(category);
  };

  const openBlockedCategoryRemoveModal = (category, count) => {
    const usageText =
      count === 1 ? 'existe 1 m&aacute;quina vinculada' : `existem ${count} m&aacute;quinas vinculadas`;

    openCategoryRemoveModal({
      mode: 'blocked',
      targetId: '',
      title: 'Categoria em uso',
      message: `N&atilde;o &eacute; poss&iacute;vel remover <strong>${displayText(
        category.name,
      )}</strong> porque ${usageText} a ela.`,
      detail: 'Edite ou remova essas m&aacute;quinas antes de excluir a categoria.',
    });
  };

  const openConfirmCategoryRemoveModal = (category) => {
    openCategoryRemoveModal({
      mode: 'confirm',
      targetId: category.id,
      title: 'Remover categoria?',
      message: `A categoria <strong>${displayText(
        category.name,
      )}</strong> n&atilde;o possui m&aacute;quinas vinculadas.`,
      detail: '',
    });
  };

  const openCategoryRemoveModal = ({ mode, targetId, title, message, detail }) => {
    if (!els.categoryRemoveModal) return;

    const wasOpen = isCategoryRemoveModalOpen();
    state.categoryRemoveTargetId = targetId;
    if (!wasOpen) {
      state.categoryRemoveLastFocus = document.activeElement;
      state.categoryRemovePreviousOverflow = document.body.style.overflow;
    }

    els.categoryRemoveModal.classList.remove('confirm', 'blocked');
    els.categoryRemoveModal.classList.add(mode);
    els.categoryRemoveTitle.innerHTML = title;
    els.categoryRemoveMessage.innerHTML = message;
    els.categoryRemoveDetail.innerHTML = detail;
    els.categoryRemoveDetail.hidden = !detail;
    els.categoryRemoveCancel.textContent = mode === 'blocked' ? 'Fechar' : 'Cancelar';
    els.categoryRemoveConfirm.hidden = mode !== 'confirm';
    els.categoryRemoveConfirm.disabled = mode !== 'confirm';
    els.categoryRemoveModal.hidden = false;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      (mode === 'confirm' ? els.categoryRemoveConfirm : els.categoryRemoveCancel)?.focus();
    }, 0);
  };

  const closeCategoryRemoveModal = ({ restoreFocus = true } = {}) => {
    if (!els.categoryRemoveModal || els.categoryRemoveModal.hidden) return;

    els.categoryRemoveModal.hidden = true;
    els.categoryRemoveModal.classList.remove('confirm', 'blocked');
    els.categoryRemoveConfirm.hidden = false;
    els.categoryRemoveConfirm.disabled = false;
    els.categoryRemoveDetail.hidden = false;
    state.categoryRemoveTargetId = '';
    document.body.style.overflow = state.categoryRemovePreviousOverflow;

    if (restoreFocus && state.categoryRemoveLastFocus?.focus) {
      state.categoryRemoveLastFocus.focus();
    }

    state.categoryRemoveLastFocus = null;
    state.categoryRemovePreviousOverflow = '';
  };

  const isCategoryRemoveModalOpen = () =>
    Boolean(els.categoryRemoveModal && !els.categoryRemoveModal.hidden);

  const confirmCategoryRemove = async () => {
    const id = state.categoryRemoveTargetId;
    const category = state.categories.find((item) => item.id === id);
    if (!category) {
      closeCategoryRemoveModal();
      return;
    }

    const count = countMachinesByCategory(category.name);
    if (count > 0) {
      openBlockedCategoryRemoveModal(category, count);
      return;
    }

    markRemoteDelete('categories', getRemoteDocumentId(category));
    state.categories = state.categories.filter((item) => item.id !== id);
    closeCategoryRemoveModal({ restoreFocus: false });
    const synced = await persistAndRender({ errorTarget: els.categoryMessage });
    resetCategoryForm();
    if (synced) showMessage(els.categoryMessage, 'Categoria removida com sucesso.', 'success');
  };

  const resetCategoryForm = ({ keepMessage = false } = {}) => {
    state.editingCategoryId = '';
    els.categoryForm.reset();
    els.categoryFormTitle.textContent = 'Nova categoria';
    els.categoryForm.elements.active.checked = true;
    if (!keepMessage) hideMessage(els.categoryMessage);
  };

  // Admin - configuracoes do catalogo
  const handleSettingsSave = async (event) => {
    event.preventDefault();
    state.settings = getSettingsFormValues();

    if (!state.settings.whatsappNumber) {
      showMessage(els.settingsMessage, 'Informe um WhatsApp para or&ccedil;amentos.', 'error');
      updateSettingsPreview(state.settings);
      return;
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    const synced = await persistRemoteData({ errorTarget: els.settingsMessage });
    updateSettingsPreview(state.settings);
    if (synced) showMessage(els.settingsMessage, 'Configura&ccedil;&otilde;es salvas com sucesso.', 'success');
  };

  const getSettingsFormValues = () => {
    const data = new FormData(els.settingsForm);
    return {
      catalogName: String(data.get('catalogName') || '').trim(),
      whatsappNumber: String(data.get('whatsappNumber') || '').trim(),
      heroTitle: String(data.get('heroTitle') || '').trim(),
      heroDescription: String(data.get('heroDescription') || '').trim(),
      quoteMessage: String(data.get('quoteMessage') || '').trim(),
    };
  };

  const syncSettingsForm = () => {
    const settings = { ...defaultSettings, ...state.settings };
    Object.entries(settings).forEach(([name, value]) => {
      const input = els.settingsForm.elements[name];
      if (input) input.value = decodeHtml(value);
    });
    updateSettingsPreview(settings);
  };

  const updateSettingsPreview = (settings = getSettingsFormValues()) => {
    const merged = { ...defaultSettings, ...settings };
    const catalogName = decodeHtml(merged.catalogName || defaultSettings.catalogName);
    const heroTitle = decodeHtml(merged.heroTitle || defaultSettings.heroTitle);
    const heroDescription = decodeHtml(merged.heroDescription || defaultSettings.heroDescription);
    const quoteMessage = decodeHtml(merged.quoteMessage || defaultSettings.quoteMessage);
    const whatsappNumber = normalizePhoneNumber(merged.whatsappNumber || defaultSettings.whatsappNumber);

    if (els.settingsPreviewCatalog) els.settingsPreviewCatalog.textContent = catalogName;
    if (els.settingsPreviewTitle) els.settingsPreviewTitle.textContent = heroTitle;
    if (els.settingsPreviewDescription) els.settingsPreviewDescription.textContent = heroDescription;
    if (els.settingsPreviewMessage) els.settingsPreviewMessage.textContent = quoteMessage;
    if (els.settingsPreviewWhatsapp) {
      els.settingsPreviewWhatsapp.textContent = whatsappNumber
        ? formatWhatsappNumber(whatsappNumber)
        : decodeHtml('N&atilde;o informado');
    }

    if (els.settingsWhatsappTest) {
      if (whatsappNumber) {
        els.settingsWhatsappTest.href = `https://wa.me/${whatsappNumber}`;
        els.settingsWhatsappTest.setAttribute('aria-disabled', 'false');
      } else {
        els.settingsWhatsappTest.href = '#';
        els.settingsWhatsappTest.setAttribute('aria-disabled', 'true');
      }
    }
  };

  const openSettingsResetModal = () => {
    if (!els.settingsResetModal) return;

    state.settingsResetLastFocus = document.activeElement;
    state.settingsResetPreviousOverflow = document.body.style.overflow;
    els.settingsResetModal.classList.add('confirm');
    els.settingsResetModal.hidden = false;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      els.settingsResetConfirm?.focus();
    }, 0);
  };

  const closeSettingsResetModal = ({ restoreFocus = true } = {}) => {
    if (!els.settingsResetModal || els.settingsResetModal.hidden) return;

    els.settingsResetModal.hidden = true;
    els.settingsResetModal.classList.remove('confirm');
    document.body.style.overflow = state.settingsResetPreviousOverflow;

    if (restoreFocus && state.settingsResetLastFocus?.focus) {
      state.settingsResetLastFocus.focus();
    }

    state.settingsResetLastFocus = null;
    state.settingsResetPreviousOverflow = '';
  };

  const isSettingsResetModalOpen = () =>
    Boolean(els.settingsResetModal && !els.settingsResetModal.hidden);

  const confirmSettingsReset = () => {
    closeSettingsResetModal({ restoreFocus: false });
    resetSettings();
  };

  const resetSettings = async () => {
    state.settings = { ...defaultSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    const synced = await persistRemoteData({ errorTarget: els.settingsMessage });
    syncSettingsForm();
    if (synced) showMessage(els.settingsMessage, 'Configura&ccedil;&otilde;es padr&atilde;o restauradas.', 'success');
  };

  const loadLocalData = () => {
    seedMachines();
    seedCategories();
    seedSettings();
    state.machines = normalizeMachines(readJson(MACHINES_KEY, []));
    state.categories = normalizeCategories(readJson(CATEGORIES_KEY, []));
    state.settings = readJson(SETTINGS_KEY, defaultSettings);
  };

  const loadAdminData = async () => {
    if (!hasRemoteBackend() || !backend.getCurrentUser?.()) {
      loadLocalData();
      return;
    }

    try {
      const remoteData = await backend.loadAll();
      const remoteMachines = Array.isArray(remoteData.machines) ? remoteData.machines : [];
      const remoteCategories = Array.isArray(remoteData.categories) ? remoteData.categories : [];
      state.machines = normalizeMachines(remoteMachines);
      state.categories = normalizeCategories(remoteCategories);
      state.settings = { ...defaultSettings, ...(remoteData.settings || {}) };

      if (!state.machines.length && !state.categories.length && !remoteData.settings) {
        loadLocalData();
        await persistRemoteData({ errorTarget: els.loginMessage, triggerBuild: false });
      }
    } catch (error) {
      loadLocalData();
      showMessage(
        els.loginMessage,
        'N&atilde;o foi poss&iacute;vel carregar o Firebase. Usando dados locais como fallback.',
        'error',
      );
    }
  };

  const persistAndRender = async ({ errorTarget = els.formMessage, triggerBuild = true } = {}) => {
    localStorage.setItem(MACHINES_KEY, JSON.stringify(state.machines));
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(state.categories));
    hydrateOptions();
    renderDashboard();
    renderTable();
    renderCategories();
    return persistRemoteData({ errorTarget, triggerBuild });
  };

  const persistRemoteData = ({ errorTarget = els.formMessage, triggerBuild = true } = {}) => {
    if (!hasRemoteBackend() || !backend.getCurrentUser?.()) return Promise.resolve(true);

    const task = state.remotePersistQueue.then(() =>
      persistRemoteDataNow({ errorTarget, triggerBuild }),
    );
    state.remotePersistQueue = task.catch(() => false);
    return task;
  };

  const persistRemoteDataNow = async ({ errorTarget = els.formMessage, triggerBuild = true } = {}) => {
    const deletedProducts = Array.from(state.pendingRemoteDeletes.products);
    const deletedCategories = Array.from(state.pendingRemoteDeletes.categories);

    try {
      await backend.persistAll({
        machines: state.machines,
        categories: state.categories,
        settings: state.settings,
        deletedProducts,
        deletedCategories,
        triggerBuild,
      });
      deletedProducts.forEach((id) => state.pendingRemoteDeletes.products.delete(id));
      deletedCategories.forEach((id) => state.pendingRemoteDeletes.categories.delete(id));
      return true;
    } catch (error) {
      showMessage(
        errorTarget || els.formMessage || els.settingsMessage,
        getFriendlyErrorMessage(error, 'sync'),
        'error',
      );
      return false;
    }
  };

  const getRemoteDocumentId = (item) => String(item?.slug || item?.id || '').trim();

  const markRemoteDelete = (collectionName, id) => {
    const value = String(id || '').trim();
    if (!value || !state.pendingRemoteDeletes[collectionName]) return;
    state.pendingRemoteDeletes[collectionName].add(value);
  };

  const unmarkRemoteDelete = (collectionName, id) => {
    const value = String(id || '').trim();
    if (!value || !state.pendingRemoteDeletes[collectionName]) return;
    state.pendingRemoteDeletes[collectionName].delete(value);
  };

  const seedMachines = () => {
    if (localStorage.getItem(MACHINES_KEY)) return;

    const source = window.ALS_CATALOG_MACHINES || [];
    const seeded = source.map((machine, index) => {
      const featured = machine.featured === true || machine.destaque === true || index < 2;
      return {
        id: machine.id,
        name: machine.name,
        slug: machine.slug,
        category: machine.category,
        shortDescription: machine.shortDescription,
        fullDescription: machine.fullDescription || '',
        mainImageUrl: machine.image,
        galleryImageUrls: machine.gallery || [],
        specs: machine.specs || {},
        active: machine.active !== false,
        featured,
        destaque: featured,
        commercialStatus: machine.status,
        quantityAvailable: machine.allowQuote ? 1 : 0,
        quantityReserved: 0,
        minimumStock: 0,
        allowQuote: machine.allowQuote,
        internalNote: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    localStorage.setItem(MACHINES_KEY, JSON.stringify(seeded));
  };

  const seedCategories = () => {
    if (localStorage.getItem(CATEGORIES_KEY)) return;

    const names = Array.from(
      new Set((window.ALS_CATALOG_MACHINES || []).map((machine) => machine.category)),
    );
    const categories = names.map((name) => ({
      id: createId(name),
      name,
      slug: slugify(name),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  };

  const seedSettings = () => {
    if (!localStorage.getItem(SETTINGS_KEY)) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    }
  };

  const hydrateOptions = () => {
    const categories = state.categories
      .filter((category) => category.active)
      .map((category) => category.name);
    const usedCategories = state.machines.map((machine) => machine.category);
    const allCategories = Array.from(new Set([...categories, ...usedCategories])).filter(Boolean);

    renderCustomSelectOptions(
      'category',
      allCategories.map((category) => ({ value: category, label: category })),
    );
    renderCustomSelectOptions('status', commercialStatuses);
    renderCustomSelectOptions('condition', technicalConditionOptions);
    renderCustomSelectOptions('drive', driveOptions);
    renderCustomSelectOptions('voltage', voltageOptions);
    renderCustomSelectOptions('weightUnit', weightUnitOptions);
    if (!els.weightUnitInput?.value) setCustomSelectValue('weightUnit', 'kg');
    hydrateMachineFilterOptions(allCategories);
  };

  const hydrateMachineFilterOptions = (categories) => {
    renderCustomSelectOptions('machineCategoryFilter', categories);
    renderCustomSelectOptions(
      'machineStatusFilter',
      commercialStatuses.map((status) => ({ value: status.value, label: status.label })),
    );
    renderCustomSelectOptions('machineActiveFilter', [
      { value: 'active', label: 'Ativas' },
      { value: 'inactive', label: 'Inativas' },
    ]);
    renderCustomSelectOptions('machineFeaturedFilter', [
      { value: 'featured', label: 'Em destaque' },
      { value: 'regular', label: 'Sem destaque' },
    ]);
    syncMachineFilterControls();
  };

  const syncFormCustomSelects = () => customSelectTypes.forEach((type) => syncCustomSelect(type));

  const renderCustomSelectOptions = (type, options) => {
    const select = getCustomSelect(type);
    if (!select.menu) return;

    const includeEmptyOption = type !== 'weightUnit';
    const emptyLabel = getCustomSelectEmptyLabel(type);
    const normalizedOptions = [
      ...(includeEmptyOption ? [{ value: '', label: emptyLabel }] : []),
      ...options.map((option) =>
        typeof option === 'string'
          ? { value: option, label: option }
          : { value: option.value, label: option.label },
      ),
    ];

    select.menu.innerHTML = normalizedOptions
      .map((option, index) => {
        const value = String(option.value || '');
        const label = value ? displayText(option.label || value) : displayText(emptyLabel);
        return `
          <button
            class="admin-custom-select-option"
            id="machine-${type}-option-${index}"
            type="button"
            role="option"
            data-select-option
            data-select-value="${escapeAttr(value)}"
          >
            ${label}
          </button>
        `;
      })
      .join('');

    syncCustomSelect(type);
    closeCustomSelect(type);
  };

  const setCustomSelectValue = (type, value) => {
    const select = getCustomSelect(type);
    if (!select.input) return;
    select.input.value = decodeFieldValue(value);
    syncCustomSelect(type);
  };

  const selectCustomOption = (type, value) => {
    setCustomSelectValue(type, value);

    const filterKey = machineFilterSelectMap[type];
    if (filterKey) updateMachineFilter(filterKey, value);
  };

  const syncCustomSelect = (type) => {
    const select = getCustomSelect(type);
    if (!select.input || !select.label) return;

    const value = select.input.value || '';
    const activeOption =
      getCustomOptions(type).find((option) => option.dataset.selectValue === value) ||
      getCustomOptions(type).find((option) => value && sameText(option.dataset.selectValue, value));
    select.label.textContent = value
      ? decodeHtml(activeOption?.textContent?.trim() || value)
      : getCustomSelectEmptyLabel(type);
    updateCustomOptionStates(type, value);
  };

  const updateCustomOptionStates = (type, value = getCustomSelect(type).input?.value || '') => {
    getCustomOptions(type).forEach((option) => {
      const isActive = option.dataset.selectValue === value || Boolean(value && sameText(option.dataset.selectValue, value));
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', String(isActive));
    });
  };

  const getCustomSelect = (type) => ({
    root: els[`${type}Select`],
    input: els[`${type}Input`],
    trigger: els[`${type}Trigger`],
    label: els[`${type}Label`],
    menu: els[`${type}Menu`],
  });

  const getCustomOptions = (type) => {
    const select = getCustomSelect(type);
    return select.menu ? Array.from(select.menu.querySelectorAll('[data-select-option]')) : [];
  };

  const getCustomSelectEmptyLabel = (type) => {
    const labels = {
      machineCategoryFilter: 'Todas categorias',
      machineStatusFilter: 'Todos status',
      machineActiveFilter: 'Todas situa\u00e7\u00f5es',
      machineFeaturedFilter: 'Todos destaques',
    };

    return labels[type] || 'Selecione...';
  };

  const focusCustomOption = (type, option) => {
    if (!option) return;
    clearFocusedCustomOption(type);
    option.classList.add('is-focused');
    option.focus({ preventScroll: true });
  };

  const clearFocusedCustomOption = (type) => {
    getCustomOptions(type).forEach((option) => option.classList.remove('is-focused'));
  };

  const getViewFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    return views.includes(hash) ? hash : '';
  };

  const getInitialAdminView = () => {
    const hashView = getViewFromHash();
    if (hashView) return hashView;

    const storedView = localStorage.getItem(VIEW_KEY);
    return views.includes(storedView) ? storedView : 'inicio';
  };

  const readSession = () => {
    if (hasRemoteBackend()) return backend.getCurrentUser?.() || null;
    return readJson(SESSION_KEY, null);
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Admin - mensagens, modais e utilitarios
  const showMessage = (node, text, type) => {
    if (!node) {
      showToast(text, type);
      return;
    }

    if (node !== els.loginMessage) {
      hideMessage(node);
      showToast(text, type);
      return;
    }

    node.innerHTML = text;
    node.className = `admin-message active ${type}`;
  };

  const hideMessage = (node) => {
    if (!node) return;
    node.className = 'admin-message';
    node.textContent = '';
  };

  const showToast = (text, type = 'success') => {
    const toast = getToast();
    window.clearTimeout(state.toastTimer);
    toast.innerHTML = text;
    toast.className = `admin-toast active ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove('active');
    }, type === 'error' ? 6500 : 4200);
  };

  const getToast = () => {
    let toast = document.querySelector('[data-admin-toast]');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.dataset.adminToast = '';
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    return toast;
  };

  const getFriendlyErrorMessage = (error, context = 'default') => {
    const code = String(error?.code || '').toLowerCase();
    const message = decodeHtml(String(error?.message || '')).toLowerCase();

    if (context === 'login') {
      if (
        code.includes('auth/invalid-credential')
        || code.includes('auth/wrong-password')
        || code.includes('auth/user-not-found')
        || message.includes('invalid')
        || message.includes('credential')
        || message.includes('password')
      ) {
        return 'E-mail ou senha incorretos.';
      }

      if (code.includes('auth/too-many-requests')) {
        return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
      }

      if (code.includes('auth/network-request-failed') || message.includes('network')) {
        return 'Falha de conex&atilde;o. Verifique sua internet e tente novamente.';
      }

      return 'N&atilde;o foi poss&iacute;vel acessar o painel. Verifique seus dados e tente novamente.';
    }

    if (context === 'sync') {
      if (message.includes('permission') || code.includes('permission')) {
        return 'Sua sess&atilde;o n&atilde;o tem permiss&atilde;o para salvar. Fa&ccedil;a login novamente.';
      }

      if (message.includes('network') || code.includes('unavailable')) {
        return 'N&atilde;o foi poss&iacute;vel conectar ao Firebase. Tente novamente em instantes.';
      }

      return 'Os dados ficaram salvos neste navegador, mas ainda n&atilde;o foram sincronizados com o site.';
    }

    if (context === 'upload' || message.includes('cloudinary') || message.includes('upload')) {
      if (
        message.includes('fun&ccedil;&otilde;es netlify')
        || message.includes('netlify')
        || message.includes('servi&ccedil;o de envio indispon')
      ) {
        return 'N&atilde;o foi poss&iacute;vel carregar imagens neste ambiente. Tente novamente pelo painel correto.';
      }

      if (message.includes('unsupported') || message.includes('type')) {
        return 'Use apenas imagens PNG, JPG ou WEBP.';
      }

      if (message.includes('size') || message.includes('8mb')) {
        return 'A imagem precisa ter no m&aacute;ximo 8MB.';
      }

      return 'N&atilde;o foi poss&iacute;vel carregar a imagem. Tente novamente ou use outro arquivo.';
    }

    return 'N&atilde;o foi poss&iacute;vel concluir a a&ccedil;&atilde;o. Tente novamente.';
  };

  const decodeFieldValue = (value) => {
    if (value === null || value === undefined) return '';
    return decodeHtml(String(value));
  };

  const decodeDataValue = (value) => {
    if (Array.isArray(value)) return value.map(decodeDataValue);
    if (!value || typeof value !== 'object') {
      return typeof value === 'string' ? decodeFieldValue(value) : value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, decodeDataValue(entry)]),
    );
  };

  const getMetricIcon = (name) => {
    const icons = {
      stack: `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M4 6.5 12 3l8 3.5-8 3.5-8-3.5Z" />
          <path d="M4 11.2 12 14.7l8-3.5" />
          <path d="M4 15.8 12 19.3l8-3.5" />
        </svg>
      `,
      check: `
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="8.2" />
          <path d="m8.4 12.1 2.4 2.4 5-5" />
        </svg>
      `,
      trend: `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M8.2 5.5H7A2.7 2.7 0 0 0 4.3 8.2v9.1A2.7 2.7 0 0 0 7 20h7.2" />
          <path d="M15.8 5.5H17a2.7 2.7 0 0 1 2.7 2.7v5" />
          <rect x="8.8" y="3.2" width="6.4" height="4.4" rx="1.25" />
          <circle cx="16" cy="16.1" r="5" fill="#fbe7ea" />
          <path d="m13.8 16 1.5 1.5 2.9-3.1" />
        </svg>
      `,
      calendar: `
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="5" y="5.8" width="14" height="13.2" rx="2" />
          <path d="M8.4 4v4" />
          <path d="M15.6 4v4" />
          <path d="M5 10h14" />
          <path d="m9.8 14.5 1.3 1.3 3.1-3.2" />
        </svg>
      `,
      alert: `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 5.2 19.4 18.1H4.6L12 5.2Z" />
          <path d="M12 11.2v2.1" />
          <path d="M12 15.4h.01" />
        </svg>
      `,
      star: `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="m12 4.4 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4.4Z" />
        </svg>
      `,
    };

    return icons[name] || icons.stack;
  };

  const getAlertIcon = (name) => {
    const icons = {
      unavailable: `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 5.2 19.4 18.1H4.6L12 5.2Z" />
          <path d="M12 11.2v2.1" />
          <path d="M12 15.4h.01" />
        </svg>
      `,
      image: `
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="4" y="5" width="16" height="14" rx="2.4" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m6.8 17 4-4 2.7 2.7 2.1-2.1 2.8 3.4" />
        </svg>
      `,
      inactive: `
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="7.5" />
          <path d="m7.2 7.2 9.6 9.6" />
        </svg>
      `,
      category: `
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="4.5" y="5" width="6" height="6" rx="1.4" />
          <rect x="13.5" y="5" width="6" height="6" rx="1.4" />
          <rect x="4.5" y="14" width="6" height="6" rx="1.4" />
          <path d="M15 17h4" />
          <path d="M17 15v4" />
        </svg>
      `,
      ok: `
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.2 2.2 2.2 4.8-5" />
        </svg>
      `,
    };

    return icons[name] || icons.unavailable;
  };

  const getAlertPreview = (machines) => {
    const names = (machines || []).slice(0, 2).map((machine) => displayText(machine.name));
    if (!names.length) return '';

    const remaining = machines.length - names.length;
    return remaining > 0
      ? `${names.join(', ')} e mais ${remaining}.`
      : names.join(', ');
  };

  const countByStatuses = (statuses) =>
    state.machines.filter((machine) => statuses.includes(machine.commercialStatus)).length;

  const isFeaturedMachine = (machine) => machine?.featured === true || machine?.destaque === true;

  const normalizeMachines = (machines) =>
    machines.map((machine) => {
      const decoded = decodeDataValue(machine);
      const normalized =
        typeof catalogNormalizer.normalizeProduct === 'function'
          ? catalogNormalizer.normalizeProduct(decoded, decoded.slug || decoded.id)
          : decoded;
      const featured = isFeaturedMachine(normalized);
      return {
        ...decoded,
        ...normalized,
        featured,
        destaque: featured,
      };
    });

  const normalizeCategories = (categories) => categories.map((category) => decodeDataValue(category));

  const isLowStock = (machine) =>
    machine.active &&
    toNumber(machine.minimumStock) > 0 &&
    toNumber(machine.quantityAvailable) <= toNumber(machine.minimumStock);

  const hasNoImage = (machine) => !String(machine.mainImageUrl || '').trim();

  const hasNoCategory = (machine) => !String(machine.category || '').trim();

  const isChartAvailable = () => typeof window.Chart === 'function';

  const showChartEmpty = (canvas, emptyNode, message) => {
    canvas.hidden = true;
    emptyNode.hidden = false;
    emptyNode.innerHTML = message;
  };

  const hideChartEmpty = (canvas, emptyNode) => {
    canvas.hidden = false;
    emptyNode.hidden = true;
    emptyNode.textContent = '';
  };

  const updateChart = (key, canvas, config) => {
    if (state.charts[key]) {
      state.charts[key].data = config.data;
      state.charts[key].options = config.options;
      state.charts[key].update();
      return;
    }

    state.charts[key] = new window.Chart(canvas, config);
  };

  const destroyChart = (key) => {
    if (!state.charts[key]) return;
    state.charts[key].destroy();
    state.charts[key] = null;
  };

  const getCategoryDataset = () => {
    const counts = state.machines.reduce((acc, machine) => {
      const category = decodeHtml(machine.category || 'Sem categoria').trim() || 'Sem categoria';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'pt-BR'),
    );
  };

  const getMachineTime = (machine) => {
    const timestamp = Date.parse(machine.updatedAt || machine.createdAt || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  };

  const formatDate = (value) => {
    const timestamp = Date.parse(value || '');
    if (!Number.isFinite(timestamp)) return 'Sem data';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(timestamp));
  };

  const getStatus = (value) =>
    commercialStatuses.find((status) => status.value === value) || {
      value,
      label: value || 'Sem status',
    };

  const getStatusClass = (value) => {
    if (['disponivel', 'pronta-entrega'].includes(value)) return 'good';
    if (['reservada', 'vendida', 'locada', 'manutencao', 'indisponivel'].includes(value)) {
      return 'warn';
    }
    return '';
  };

  const countMachinesByCategory = (categoryName) =>
    state.machines.filter((machine) => sameText(machine.category, categoryName)).length;

  const sameText = (left, right) =>
    decodeHtml(left).trim().toLowerCase() === decodeHtml(right).trim().toLowerCase();

  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const createId = (name) => `${slugify(name)}-${Date.now().toString(36)}`;

  const createImageId = () =>
    `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const normalizePhoneNumber = (value) => String(value || '').replace(/\D/g, '');

  const formatWhatsappNumber = (value) => {
    const digits = normalizePhoneNumber(value);
    if (!digits) return '';

    if (digits.startsWith('55') && digits.length >= 12) {
      const country = digits.slice(0, 2);
      const area = digits.slice(2, 4);
      const local = digits.slice(4);
      const firstPart = local.length > 8 ? local.slice(0, 5) : local.slice(0, 4);
      const secondPart = local.slice(firstPart.length);
      return `+${country} ${area} ${firstPart}${secondPart ? `-${secondPart}` : ''}`;
    }

    if (digits.length >= 10) {
      const area = digits.slice(0, 2);
      const local = digits.slice(2);
      const firstPart = local.length > 8 ? local.slice(0, 5) : local.slice(0, 4);
      const secondPart = local.slice(firstPart.length);
      return `(${area}) ${firstPart}${secondPart ? `-${secondPart}` : ''}`;
    }

    return digits;
  };

  const getImageName = (url) => {
    try {
      const cleanUrl = String(url || '').split('?')[0];
      return decodeURIComponent(cleanUrl.split('/').pop() || '');
    } catch (error) {
      return '';
    }
  };

  const getOptimizedCloudinaryUrl = (url) => {
    const value = String(url || '').trim();
    if (!value.includes('/upload/')) return value;
    if (/\/upload\/[^/]*(f_webp|q_auto)/.test(value)) return value;
    return value.replace('/upload/', '/upload/f_webp,q_auto:best/');
  };

  const assetPath = (path) => {
    const value = String(path || '').trim();
    if (
      !value ||
      value.startsWith('../') ||
      value.startsWith('/') ||
      value.startsWith('blob:') ||
      value.startsWith('data:') ||
      /^https?:\/\//.test(value)
    ) {
      return value;
    }

    return `../${value}`;
  };

  const slugify = (value) =>
    decodeHtml(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const displayText = (value) => escapeHtml(decodeHtml(value));

  const escapeAttr = (value) => escapeHtml(value).replace(/`/g, '&#096;');

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return entities[char];
    });

  const decodeHtml = (value) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value || '';
    return textarea.value;
  };

  init();
})();
