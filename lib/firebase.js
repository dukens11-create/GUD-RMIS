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
 *
 * Note: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is intentionally omitted — it is
 * only required for Firebase Analytics and the app works without it.
 */
export const missingFirebaseVars = Object.entries(ENV_VAR_MAP)
  .filter(([, v]) => !v)
  .map(([k]) => k);

/**
 * Returns the array of missing NEXT_PUBLIC_FIREBASE_* env var names.
 * Equivalent to missingFirebaseVars; exported as a function for call-site
 * compatibility.
 */
export function getMissingFirebaseEnvVars() {
  return missingFirebaseVars;
}

/**
 * Returns true when every required NEXT_PUBLIC_FIREBASE_* variable is set.
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

/**
 * Returns the Firebase app instance, or null when env vars are missing.
 * Never throws; callers should check isFirebaseConfigured() to branch on state.
 */
export function firebaseApp() {
  if (_app === undefined) _app = createApp();
  return _app;
}

/**
 * Returns the Firebase Auth instance, or null when not configured.
 */
export function auth() {
  if (_auth === undefined) {
    const app = firebaseApp();
    _auth = app ? getAuth(app) : null;
  }
  return _auth;
}

/**
 * Returns the Firestore instance, or null when not configured.
 */
export function db() {
  if (_db === undefined) {
    const app = firebaseApp();
    _db = app ? getFirestore(app) : null;
  }
  return _db;
}
