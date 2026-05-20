const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'js', 'config');
const outputPath = path.join(outputDir, 'runtime-config.generated.js');
const defaults = {
  FIREBASE_API_KEY: 'AIzaSyAfBUa-AtmKZIDMlpw4N8_SlBRhy-1fh1Y',
  FIREBASE_AUTH_DOMAIN: 'catalogo-als.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'catalogo-als',
  FIREBASE_STORAGE_BUCKET: 'catalogo-als.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: '171009163821',
  FIREBASE_APP_ID: '1:171009163821:web:ef28b7fc1232e60e5f2ea4',
  FIREBASE_MEASUREMENT_ID: 'G-Z0HH2XDHG5',
  CLOUDINARY_CLOUD_NAME: 'dooprpnho',
  CLOUDINARY_UPLOAD_PRESET: 'als_admin_products',
  CLOUDINARY_FOLDER: 'als-maquinas/produtos',
};

const config = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || defaults.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || defaults.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || defaults.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || defaults.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || defaults.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || defaults.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || defaults.FIREBASE_MEASUREMENT_ID,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || defaults.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || defaults.CLOUDINARY_UPLOAD_PRESET,
    folder: process.env.CLOUDINARY_FOLDER || defaults.CLOUDINARY_FOLDER,
  },
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputPath,
  [
    `window.ALS_RUNTIME_CONFIG = ${JSON.stringify(config, null, 2)};`,
    '',
    'window.ALS_CLOUDINARY_CONFIG = window.ALS_RUNTIME_CONFIG.cloudinary;',
    '',
  ].join('\n'),
);

console.log(`Generated ${path.relative(rootDir, outputPath)}`);
