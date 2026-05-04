import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const REQUIRED_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

/**
 * Returns true when all required NEXT_PUBLIC_FIREBASE_* environment variables
 * are present (non-empty) in the built bundle.  For a static export these vars
 * must be set at *build* time in the Render (or CI) environment.
 */
export function isFirebaseConfigured() {
  return REQUIRED_VARS.every((key) => Boolean(process.env[key]));
}

function createApp() {
  if (!isFirebaseConfigured()) {
    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
    throw new Error(
      `Firebase is not configured. Missing environment variable(s): ${missing.join(', ')}. ` +
        'Set all NEXT_PUBLIC_FIREBASE_* variables in your Render (or CI) environment and redeploy.'
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
