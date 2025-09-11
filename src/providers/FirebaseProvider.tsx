import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCltPuGZ5AnRNxRNcMqMIidLxoLUlgcRe4",
  authDomain: "pull-push-ai.firebaseapp.com",
  projectId: "pull-push-ai",
  storageBucket: "pull-push-ai.firebasestorage.app",
  messagingSenderId: "160707453652",
  appId: "1:160707453652:web:1783fe97d151dcc0a25141",
  measurementId: "G-Z4ZZ1T3MQY"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Создаем контекст
const FirebaseContext = createContext({ app, auth, db, storage });

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  return (
    <FirebaseContext.Provider value={{ app, auth, db, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Хук для использования Firebase в компонентах
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};