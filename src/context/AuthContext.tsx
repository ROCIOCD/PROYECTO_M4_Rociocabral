// ─────────────────────────────────────────────────────────────────
// src/context/AuthContext.tsx
// Estado global de autenticación. Mapea FirebaseUser → UserProfile
// para mantener el resto de la app desacoplado de Firebase.
// Incluye updateProfile para editar displayName y photoURL.
// ─────────────────────────────────────────────────────────────────

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

import { auth } from '../services/firebase';
import type { AuthContextType, UserProfile, ProfileUpdate } from '../types';

// ── Contexto — null inicial obliga a verificar en useAuth ────────
export const AuthContext = createContext<AuthContextType | null>(null);

// ── Helper: mapea FirebaseUser → UserProfile del dominio ─────────
function mapFirebaseUser(firebaseUser: FirebaseUser): UserProfile {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

// ── Provider ─────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  // loading: true mientras Firebase resuelve el estado inicial.
  // Evita el flash de redirección a /login antes de saber
  // si hay una sesión persistida.
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setLoading(false);
    });

    // Limpia el listener al desmontar el provider
    return unsubscribe;
  }, []);

  // ── login ──────────────────────────────────────────────────────
  async function login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged actualizará `user` automáticamente
  }

  // ── register ───────────────────────────────────────────────────
  async function register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged actualizará `user` automáticamente
  }

  // ── logout ─────────────────────────────────────────────────────
  async function logout(): Promise<void> {
    await signOut(auth);
  }

  // ── updateProfile ──────────────────────────────────────────────
  // Actualiza displayName y photoURL en Firebase Auth y en el
  // estado local inmediatamente (sin esperar onAuthStateChanged).
  async function updateProfile({ displayName, photoURL }: ProfileUpdate): Promise<void> {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado.');

    await firebaseUpdateProfile(auth.currentUser, {
      displayName: displayName.trim() || null,
      photoURL: photoURL.trim() || null,
    });

    // Actualiza el estado local de forma optimista
    setUser((prev) =>
      prev
        ? {
            ...prev,
            displayName: displayName.trim() || null,
            photoURL: photoURL.trim() || null,
          }
        : null
    );
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
