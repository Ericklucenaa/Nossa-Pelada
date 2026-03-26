import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBZVN5tbaM0g3AhwoAz65GL_t48kH3Vm3s",
  authDomain: "nossa-pelada-59bae.firebaseapp.com",
  projectId: "nossa-pelada-59bae",
  storageBucket: "nossa-pelada-59bae.firebasestorage.app",
  messagingSenderId: "575576741208",
  appId: "1:575576741208:web:33819bd1485237a576012d",
  measurementId: "G-0F7CK4V4FF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
