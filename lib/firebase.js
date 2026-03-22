import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function createApp() {
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
