import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAs8iJmHh91er_uQxrWmDp_6xVtmF83Dlo",
  authDomain: "kineo-804a1.firebaseapp.com",
  projectId: "kineo-804a1",
  storageBucket: "kineo-804a1.firebasestorage.app",
  messagingSenderId: "521149907285",
  appId: "1:521149907285:web:9bfa6d050f424a63d76fdc",
  measurementId: "G-RFVYTPDZG8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
