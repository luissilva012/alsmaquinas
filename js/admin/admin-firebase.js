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
  const db = window.firebase.firestore(app);
  let currentUser = null;
  let publishTimer = null;

  const ready = new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      resolve(user);
    });
  });

  const collectionToArray = async (collectionName) => {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...fromFirestoreData(doc.data()) }));
  };

  const fromFirestoreData = (value) => {
    if (Array.isArray(value)) return value.map(fromFirestoreData);
    if (!value || typeof value !== 'object') return value;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, fromFirestoreData(entry)]),
    );
  };

  const loadAll = async () => {
    const [machines, categories, settingsDoc] = await Promise.all([
      collectionToArray('products'),
      collectionToArray('categories'),
      db.collection('site_settings').doc('catalog').get(),
    ]);

    return {
      machines,
      categories,
      settings: settingsDoc.exists ? fromFirestoreData(settingsDoc.data()) : null,
    };
  };

  const WRITE_BATCH_LIMIT = 450;

  const persistAll = async ({
    machines = [],
    categories = [],
    settings = {},
    deletedProducts = [],
    deletedCategories = [],
    triggerBuild = true,
  }) => {
    await Promise.all([
      syncCollection('products', machines, deletedProducts),
      syncCollection('categories', categories, deletedCategories),
      db.collection('site_settings').doc('catalog').set(cleanPayload(settings), { merge: true }),
    ]);
    if (triggerBuild) scheduleCatalogPublish();
  };

  const syncCollection = async (collectionName, items, deletedIds = []) => {
    const collection = db.collection(collectionName);
    const nextIds = new Set(items.map((item) => getDocumentId(item)).filter(Boolean));
    const operations = [];

    deletedIds
      .map((id) => String(id || '').trim())
      .filter((id) => id && !nextIds.has(id))
      .forEach((id) => {
        operations.push({ type: 'delete', ref: collection.doc(id) });
      });

    items.forEach((item, index) => {
      const id = getDocumentId(item);
      if (!id) return;
      operations.push({
        type: 'set',
        ref: collection.doc(id),
        data: cleanPayload({
          ...item,
          id: item.id || id,
          documentId: id,
          sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
        }),
      });
    });

    await commitOperations(operations);
  };

  const commitOperations = async (operations) => {
    for (let index = 0; index < operations.length; index += WRITE_BATCH_LIMIT) {
      const batch = db.batch();
      operations.slice(index, index + WRITE_BATCH_LIMIT).forEach((operation) => {
        if (operation.type === 'delete') {
          batch.delete(operation.ref);
          return;
        }
        batch.set(operation.ref, operation.data, { merge: true });
      });
      await batch.commit();
    }
  };

  const getDocumentId = (item) => String(item?.slug || item?.id || '').trim();

  const cleanPayload = (value) => {
    if (Array.isArray(value)) return value.map(cleanPayload);
    if (!value || typeof value !== 'object') return value ?? null;

    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, cleanPayload(entry)]),
    );
  };

  const signIn = async (email, password) => {
    const credential = await auth.signInWithEmailAndPassword(email, password);
    const adminDoc = await db.collection('admins').doc(credential.user.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.active !== true) {
      await auth.signOut();
      throw new Error('Usu&aacute;rio sem permiss&atilde;o administrativa.');
    }
    currentUser = credential.user;
    return getCurrentUser();
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
    const idToken = await currentUser?.getIdToken();
    if (!idToken) {
      throw new Error('Sess&atilde;o administrativa expirada. Fa&ccedil;a login novamente para enviar imagens.');
    }

    const signatureResponse = await fetchFunctionEndpoint('cloudinary-signature', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: file.name, type: file.type, size: file.size }),
    });

    if (!signatureResponse.ok) {
      const message = await readErrorMessage(
        signatureResponse,
        signatureResponse.status === 404
          ? 'Servi&ccedil;o de envio indispon&iacute;vel neste ambiente.'
          : 'N&atilde;o foi poss&iacute;vel autorizar o envio da imagem.',
      );
      throw new Error(message);
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
      const message = await readErrorMessage(uploadResponse, 'Cloudinary recusou o envio da imagem.');
      throw new Error(message);
    }

    const data = await uploadResponse.json();
    const url = data.secure_url || data.url;
    if (!url) throw new Error('Cloudinary response without URL');
    return getOptimizedCloudinaryUrl(url);
  };

  const readErrorMessage = async (response, fallback) => {
    try {
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return data.error?.message || data.error || data.message || fallback;
      }
      const text = await response.text();
      return text ? `${fallback} ${text.slice(0, 160)}` : fallback;
    } catch (error) {
      return fallback;
    }
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
    notifyPublish('As alterações foram salvas. Atualizando o site...', 'loading');

    try {
      const idToken = await currentUser?.getIdToken();
      const response = await fetchFunctionEndpoint('trigger-build', {
        method: 'POST',
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });

      if (!response.ok) {
        throw new Error('publish_failed');
      }

      const data = await response.json().catch(() => ({}));

      if (data.skipped && data.reason === 'Build hook cooldown') {
        notifyPublish('As alterações foram salvas. A atualização do site já está em andamento.', 'success');
        return;
      }

      if (data.skipped) {
        notifyPublish(
          'As alterações foram salvas. Configure a publicação automática para atualizar o site.',
          'error',
        );
        return;
      }

      notifyPublish('Alterações salvas. O site está sendo atualizado.', 'success');
    } catch (error) {
      notifyPublish(
        'Alterações salvas, mas não foi possível iniciar a atualização automática do site.',
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

  const fetchFunctionEndpoint = (name, options = {}) => fetch(`/${name}`, options);

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
