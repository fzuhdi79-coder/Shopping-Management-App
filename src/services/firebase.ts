import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Ganti nilainya dengan config dari Firebase Console Anda nanti
const firebaseConfig = {
  apiKey: "AIzaSyB4IKn_IfOoecL46m87PH9fe-bKfR4Yw2s",
  authDomain: "shoppingapp-acbc1.firebaseapp.com",
  projectId: "shoppingapp-acbc1",
  storageBucket: "shoppingapp-acbc1.firebasestorage.app",
  messagingSenderId: "1:838874973654:web:5f460b83ddb56f92695077",
  appId: "APP_ID_ANDA"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Menggunakan getAuth() standar yang lebih ramah TypeScript
export const auth = getAuth(app);

// Inisialisasi Firestore Database
export const db = getFirestore(app);