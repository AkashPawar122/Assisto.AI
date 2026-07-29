import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "assisto-d6da4.firebaseapp.com",
  projectId: "assisto-d6da4",
  storageBucket: "assisto-d6da4.firebasestorage.app",
  messagingSenderId: "389300004842",
  appId: "1:389300004842:web:e3c44d56f1626759a8b493"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export {auth , provider}

