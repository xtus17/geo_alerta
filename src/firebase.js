import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA6bSjw1tYjZ99Ol9qZ9_FgAEPK0hUjRRc",
  authDomain: "earthsismos.firebaseapp.com",
  databaseURL: "https://earthsismos-default-rtdb.firebaseio.com",
  projectId: "earthsismos",
  storageBucket: "earthsismos.firebasestorage.app",
  messagingSenderId: "147937053167",
  appId: "1:147937053167:web:c4e7f4f1ddc75b6b1e0e1a",
};

const app = initializeApp(firebaseConfig);

// 🔹 Exportar autenticación
export const auth = getAuth(app);
export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// 🔹 Exportar Firestore y Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
