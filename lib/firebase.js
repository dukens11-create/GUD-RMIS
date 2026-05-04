import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Returns an array of missing NEXT_PUBLIC_FIREBASE_* env var names.
 * Uses direct property references (not dynamic access) so Next.js can inline
 * these values into the static bundle at build time.
 * On static hosting, an empty/undefined value means the deployment was built
 * without credentials — the vars must be set before deploying.
 *
 * Note: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is intentionally omitted — it is
 * only required for Firebase Analytics and the app works without it.
 */
export function getMissingFirebaseEnvVars() {
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
 * Returns true when every required NEXT_PUBLIC_FIREBASE_* variable is set.
 */
export function isFirebaseConfigured() {
  return getMissingFirebaseEnvVars().length === 0;
}

// Lazy singletons — Firebase is only initialised on first access, not at import time.
let _app, _auth, _db;

/**
 * Returns the Firebase app instance, or null when env vars are missing.
 * Never throws; callers should check isFirebaseConfigured() to branch on state.
 */
export function firebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return _app;
}

/**
 * Returns the Firebase Auth instance, or null when not configured.
 */
export function auth() {
  const app = firebaseApp();
  if (!app) return null;
  if (!_auth) _auth = getAuth(app);
  return _auth;
}

/**
 * Returns the Firestore instance, or null when not configured.
 */
export function db() {
  const app = firebaseApp();
  if (!app) return null;
  if (!_db) _db = getFirestore(app);
  return _db;
}
