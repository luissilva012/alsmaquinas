const admin = require('firebase-admin');
require('dotenv').config();

const getServiceAccount = () => {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (encoded) {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);

  return null;
};

const getFirebaseAdmin = () => {
  if (admin.apps.length) return admin.app();

  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return null;
};

const getFirestore = () => {
  const app = getFirebaseAdmin();
  return app ? admin.firestore() : null;
};

module.exports = {
  admin,
  getFirebaseAdmin,
  getFirestore,
};
