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
  const [firebaseError, setFirebaseError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.error(
        '[GUD-RMIS] Firebase is not configured. ' +
        'Set all NEXT_PUBLIC_FIREBASE_* environment variables on your hosting ' +
        'platform (e.g. Render → Environment) and redeploy so the values are ' +
        'embedded into the static build.'
      );
      setFirebaseError(
        'Firebase is not configured. ' +
        'Contact the site administrator to set the required environment variables.'
      );
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
      console.error('[GUD-RMIS] Firebase auth initialization error:', err.message);
      setFirebaseError('Authentication service unavailable. Please try again later.');
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  if (firebaseError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow">
          <h1 className="mb-2 text-xl font-bold text-red-800">Configuration Error</h1>
          <p className="text-sm text-red-700">{firebaseError}</p>
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
