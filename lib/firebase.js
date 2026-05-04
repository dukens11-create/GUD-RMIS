import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Returns an array of NEXT_PUBLIC_FIREBASE_* variable names that are missing
 * or empty. Uses direct (literal) property access so Next.js can inline the
 * values at build time for static exports — dynamic bracket notation
 * (process.env[key]) is never inlined and always returns undefined in the
 * browser.
 */
export function getMissingFirebaseVars() {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  return missing;
}

/**
 * Returns true when every required NEXT_PUBLIC_FIREBASE_* variable is a
 * non-empty string. On static hosting the values are baked in at build time, so
 * an empty/undefined value means the deployment was built without credentials.
 */
export function isFirebaseConfigured() {
  return getMissingFirebaseVars().length === 0;
}

function createApp() {
  const missing = getMissingFirebaseVars();
  if (missing.length > 0) {
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
