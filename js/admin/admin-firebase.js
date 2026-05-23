(() => {
  const runtime = window.ALS_RUNTIME_CONFIG || {};
  const firebaseConfig = runtime.firebase || {};
  const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const isConfigured =
    typeof window.firebase !== 'undefined'
    && requiredConfig.every((key) => String(firebaseConfig[key] || '').trim());

  if (!isConfigured) {
    window.ALSAdminBackend = {
      isConfigured: () => false,
      ready: Promise.resolve(null),
    };
    return;
  }

  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  const auth = window.firebase.auth(app);
  let currentUser = null;
  let publishTimer = null;

  const ready = new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      resolve(user);
    });
  });

  const fetchFunctionEndpoint = (name, options = {}) => fetch(`/${name}`, options);

  const readErrorMessage = async (response, fallback) => {
    try {
      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) return fallback;

      const data = await response.json();
      return data.message || data.error?.message || data.error || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const getIdToken = async () => {
    const idToken = await currentUser?.getIdToken();
    if (!idToken) throw new Error('Sessao administrativa expirada. Faca login novamente.');
    return idToken;
  };

  const loadAllFromFunction = async () => {
    const idToken = await getIdToken();
    const response = await fetchFunctionEndpoint('admin-catalog', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Nao foi possivel carregar o catalogo.'));
    }

    return response.json();
  };

  const loadAll = async () => loadAllFromFunction();

  const persistAllFromFunction = async ({
    machines = [],
    categories = [],
    settings = {},
    deletedProducts = [],
    deletedCategories = [],
  }) => {
    const idToken = await getIdToken();
    const response = await fetchFunctionEndpoint('admin-catalog', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        machines,
        categories,
        settings,
        deletedProducts,
        deletedCategories,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Nao foi possivel salvar as alteracoes.'));
    }
  };

  const persistAll = async ({
    machines = [],
    categories = [],
    settings = {},
    deletedProducts = [],
    deletedCategories = [],
    triggerBuild = true,
  }) => {
    await persistAllFromFunction({
      machines,
      categories,
      settings,
      deletedProducts,
      deletedCategories,
    });

    if (triggerBuild) scheduleCatalogPublish();
  };

  const signIn = async (email, password) => {
    const credential = await auth.signInWithEmailAndPassword(email, password);
    const hasAccess = await verifyAdminAccess(credential.user);
    if (!hasAccess) {
      await auth.signOut();
      throw new Error('Usuario sem permissao administrativa.');
    }
    currentUser = credential.user;
    return getCurrentUser();
  };

  const verifyAdminAccess = async (user) => {
    const idToken = await user?.getIdToken();
    if (!idToken) return false;

    try {
      const response = await fetchFunctionEndpoint('admin-catalog?check=1', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const signOut = async () => {
    await auth.signOut();
    currentUser = null;
  };

  const getCurrentUser = () =>
    currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
        }
      : null;

  const uploadImage = async (file) => {
    const idToken = await getIdToken();
    const signatureResponse = await fetchFunctionEndpoint('cloudinary-signature', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: file.name, type: file.type, size: file.size }),
    });

    if (!signatureResponse.ok) {
      throw new Error(
        await readErrorMessage(signatureResponse, 'Nao foi possivel autorizar o envio da imagem.'),
      );
    }

    const signature = await signatureResponse.json();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('upload_preset', signature.uploadPreset);
    if (signature.folder) formData.append('folder', signature.folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!uploadResponse.ok) {
      throw new Error(await readErrorMessage(uploadResponse, 'Nao foi possivel enviar a imagem.'));
    }

    const data = await uploadResponse.json();
    const url = data.secure_url || data.url;
    if (!url) throw new Error('Nao foi possivel concluir o envio da imagem.');
    return getOptimizedCloudinaryUrl(url);
  };

  const getOptimizedCloudinaryUrl = (url) => {
    const value = String(url || '').trim();
    if (!value.includes('/upload/')) return value;
    if (/\/upload\/[^/]*(f_auto|f_webp|q_auto)/.test(value)) return value;
    return value.replace('/upload/', '/upload/f_auto,q_auto:best/');
  };

  const scheduleCatalogPublish = () => {
    window.clearTimeout(publishTimer);
    publishTimer = window.setTimeout(runCatalogPublish, 1500);
  };

  const runCatalogPublish = async () => {
    notifyPublish('Alteracoes salvas. Atualizando o site...', 'loading');

    try {
      const idToken = await currentUser?.getIdToken();
      const response = await fetchFunctionEndpoint('trigger-build', {
        method: 'POST',
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });

      if (!response.ok) throw new Error('publish_failed');

      const data = await response.json().catch(() => ({}));

      if (data.skipped && data.reason === 'Build hook cooldown') {
        notifyPublish('Alteracoes salvas. A atualizacao do site ja esta em andamento.', 'success');
        return;
      }

      if (data.skipped) {
        notifyPublish(
          'Alteracoes salvas. Configure a publicacao automatica para atualizar o site.',
          'error',
        );
        return;
      }

      notifyPublish('Alteracoes salvas. O site esta sendo atualizado.', 'success');
    } catch (error) {
      notifyPublish(
        'Alteracoes salvas, mas nao foi possivel iniciar a atualizacao automatica do site.',
        'error',
      );
    }
  };

  const notifyPublish = (message, type) => {
    window.dispatchEvent(
      new CustomEvent('als:admin-publish-status', {
        detail: { message, type },
      }),
    );
  };

  window.ALSAdminBackend = {
    isConfigured: () => true,
    getCurrentUser,
    loadAll,
    persistAll,
    ready,
    signIn,
    signOut,
    uploadImage,
  };
})();
