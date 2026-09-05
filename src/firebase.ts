import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export function getFirebaseServices() {
  return { app, auth, db, isFirebaseConfigured };
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const provider = useMemo(() => new GoogleAuthProvider(), []);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });
  }, []);

  async function signIn() {
    if (!auth) {
      setAuthError("Firebase is not configured yet.");
      return;
    }

    try {
      setAuthError(null);
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign in failed.");
    }
  }

  async function signOutUser() {
    if (!auth) {
      return;
    }

    try {
      setAuthError(null);
      await signOut(auth);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign out failed.");
    }
  }

  return {
    authError,
    isAuthLoading,
    isFirebaseConfigured,
    signIn,
    signOut: signOutUser,
    user,
  };
}
