import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// التحقق من وجود التكوين المطلوب
const hasValidConfig = firebaseConfig.apiKey &&
                      firebaseConfig.authDomain &&
                      firebaseConfig.projectId;

if (!hasValidConfig) {
  console.warn('⚠️ Firebase configuration is incomplete. Some features may not work.');
}

let app: any = null;
let auth: any = null;
let db: any = null;
let database: any = null;
let functions: any = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  database = getDatabase(app);
  functions = getFunctions(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  console.warn('Firebase services may not be available');
}

export { app, auth, db, database, functions };
// لا نصدر storage لأننا نستخدم Cloudinary
