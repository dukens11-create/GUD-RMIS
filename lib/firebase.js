import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Required NEXT_PUBLIC_FIREBASE_* env vars — must be set at build time on your
// hosting platform (Render → Environment settings) so they are embedded into
// the static JS bundle.
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

/**
 * Returns true when every required NEXT_PUBLIC_FIREBASE_* variable is a
 * non-empty string. On static hosting the values are baked in at build time, so
 * an empty/undefined value means the deployment was built without credentials.
 */
export function isFirebaseConfigured() {
  return REQUIRED_ENV_VARS.every(
    (key) => typeof process.env[key] === 'string' && process.env[key].length > 0
  );
}

function createApp() {
  if (!isFirebaseConfigured()) {
    const missing = REQUIRED_ENV_VARS.filter(
      (key) => !process.env[key]
    );
    throw new Error(
      `Firebase is not configured. Missing environment variables: ${missing.join(', ')}. ` +
      'Set all NEXT_PUBLIC_FIREBASE_* variables on your hosting platform and redeploy.'
    );
  }
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return getApps().length ? getApp() : initializeApp(config);
}

// Lazy getters — Firebase is only initialised on first access, not at import time
let _app, _auth, _db;

export function firebaseApp() {
  if (!_app) _app = createApp();
  return _app;
}

export function auth() {
  if (!_auth) _auth = getAuth(firebaseApp());
  return _auth;
}

export function db() {
  if (!_db) _db = getFirestore(firebaseApp());
  return _db;
}
