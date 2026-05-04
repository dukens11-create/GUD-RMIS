'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(auth(), (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    } catch (err) {
      console.error('Firebase auth initialization error:', err.message);
      setConfigError(true);
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  if (configError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-red-700">Configuration Error</h1>
          <p className="text-sm text-red-600">
            Firebase is not configured. Set all{' '}
            <code className="rounded bg-red-100 px-1 font-mono text-xs">
              NEXT_PUBLIC_FIREBASE_*
            </code>{' '}
            environment variables in your Render (or CI) environment and trigger a new
            deploy so they are embedded in the static bundle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth(), email, password);
}

export async function signUp(email, password) {
  return createUserWithEmailAndPassword(auth(), email, password);
}

export async function signOut() {
  return firebaseSignOut(auth());
}
