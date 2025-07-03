"use client";
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth } from '../lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAuth,
  signInAnonymously,
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student');
  const [school, setSchool] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] onAuthStateChanged user:', user);
      if (user) {
        const idTokenResult = await user.getIdTokenResult(true);
        if (user.isAnonymous) {
          setRole('student');
          setSchool(null);
          setHostel(null);
          console.log('[Auth] Anonymous user detected, role set to student');
        } else {
          setRole(idTokenResult.claims.role || 'student');
          setSchool(idTokenResult.claims.school || null);
          setHostel(idTokenResult.claims.hostel || null);
          console.log('[Auth] Authenticated user, role:', idTokenResult.claims.role, 'school:', idTokenResult.claims.school, 'hostel:', idTokenResult.claims.hostel);
          // Sync non-anonymous user to Firestore via API
          try {
            const res = await fetch(`/api/users/${user.uid}`);
            if (res.status === 404) {
              const token = await user.getIdToken();
              await fetch('/api/users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  email: user.email,
                  displayName: user.displayName || "",
                  role: idTokenResult.claims.role || "student",
                }),
              });
            }
          } catch (e) {
            console.error("Failed to sync user to Firestore via API", e);
          }
        }
      } else {
        setRole('student');
        setSchool(null);
        setHostel(null);
        console.log('[Auth] No user, role set to student');
      }
      setUser(user);
      setLoading(false);
      console.log('[Auth] loading:', false, 'role:', role, 'user:', user);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  const signInWithEmail = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const signUpWithEmail = async (email, password) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, school, hostel, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 