import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

export const contextoo = createContext();

export const useAutenticado = () => {
  return useContext(contextoo);
};

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = async () => {
    await signOut(auth);
    setUser(null); // Asegurar que el usuario se borra al cerrar sesión
  };
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

  return (
    <contextoo.Provider value={{ signup, login, logout, resetPassword, loginGoogle, user, loading }}>
      {!loading && children} {/* Evitar que renderice hasta saber si hay usuario */}
    </contextoo.Provider>
  );
}
