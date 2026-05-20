import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Paste your Firebase project config here.
// Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBe-Py4IaKW1pv2r-Euf43E3iHCGS8_5O4',
  authDomain: 'buffet-on-wheels-ba58b.firebaseapp.com',
  projectId: 'buffet-on-wheels-ba58b',
  storageBucket: 'buffet-on-wheels-ba58b.firebasestorage.app',
  messagingSenderId: '802892849557',
  appId: '1:802892849557:web:9232e8c7d6edba6c74969c',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
