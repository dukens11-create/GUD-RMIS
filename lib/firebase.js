import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Direct references to each required NEXT_PUBLIC_FIREBASE_* env var.
// These MUST be written out literally (not via bracket notation) so that
// Next.js can inline them at build time in the static export bundle.
const _apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const _authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const _projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const _storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const _messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const _appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Map of env var name → resolved value for missing-var reporting.
const ENV_VAR_MAP = {
  NEXT_PUBLIC_FIREBASE_API_KEY: _apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: _authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: _projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: _storageBucket,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: _messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: _appId,
};

/**
 * List of required NEXT_PUBLIC_FIREBASE_* variable names that are missing
 * (empty or undefined) in the current build. An empty array means the app is
 * fully configured. On static hosting, these values are baked in at build
 * time — if any are missing the deployment was built without credentials.
 */
export const missingFirebaseVars = Object.entries(ENV_VAR_MAP)
  .filter(([, v]) => !v)
  .map(([k]) => k);

/**
 * Returns true when every required NEXT_PUBLIC_FIREBASE_* variable is a
 * non-empty string. On static hosting the values are baked in at build time, so
 * an empty/undefined value means the deployment was built without credentials.
 */
export function isFirebaseConfigured() {
  return missingFirebaseVars.length === 0;
}

function createApp() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  const config = {
    apiKey: _apiKey,
    authDomain: _authDomain,
    projectId: _projectId,
    storageBucket: _storageBucket,
    messagingSenderId: _messagingSenderId,
    appId: _appId,
  };
  return getApps().length ? getApp() : initializeApp(config);
}

// Lazy getters — Firebase is only initialised on first access, not at import time.
// Each getter returns null when Firebase is not configured so callers can guard
// without catching a thrown error.
let _app, _auth, _db;

export function firebaseApp() {
  if (_app === undefined) _app = createApp();
  return _app;
}

export function auth() {
  if (!_auth) {
    const app = firebaseApp();
    if (!app) return null;
    _auth = getAuth(app);
  }
  return _auth;
}

export function db() {
  if (!_db) {
    const app = firebaseApp();
    if (!app) return null;
    _db = getFirestore(app);
  }
  return _db;
}
