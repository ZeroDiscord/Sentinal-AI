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
        let firestoreRole = 'student';
        let schoolVal = null;
        let hostelVal = null;
        try {
          const res = await fetch(`/api/users/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            firestoreRole = data.role || 'student';
            schoolVal = data.school || null;
            hostelVal = data.hostel || null;
          }
        } catch (e) {
          console.error('Failed to fetch user from Firestore', e);
        }
        setRole(firestoreRole);
        setSchool(schoolVal);
        setHostel(hostelVal);
        // Sync user to Firestore if not present
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/users/${user.uid}`);
          if (res.status === 404) {
            await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                role: firestoreRole,
                isAnonymous: user.isAnonymous || false,
              }),
            });
          }
        } catch (e) {
          console.error('Failed to sync user to Firestore via API', e);
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
      // If user is anonymous, delete their Firestore user document
      if (user && user.isAnonymous) {
        await fetch(`/api/users/${user.uid}`, { method: 'DELETE' });
      }
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add a method to refresh user Firestore data
  const refreshUserFromFirestore = async (uid) => {
    if (!uid) return;
    try {
      const res = await fetch(`/api/users/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role || 'student');
        setSchool(data.school || null);
        setHostel(data.hostel || null);
      }
    } catch (e) {
      console.error('Failed to refresh user from Firestore', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, school, hostel, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshUserFromFirestore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 