// Test Firebase connection
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔧 Testing Firebase Configuration...');
console.log('Config:', {
  apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
  authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing',
});

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized successfully');

  // Test Auth
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');

  // Test Firestore
  const db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');

  // Test Storage
  const storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');

  console.log('\n🎉 All Firebase services are properly configured!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure Authentication is enabled in Firebase Console');
  console.log('2. Make sure Firestore Database is created');
  console.log('3. Make sure Storage is enabled');
  console.log('4. Create admin user and initial data');

} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('\n🔍 Troubleshooting:');
  console.log('1. Check your .env.local file');
  console.log('2. Verify Firebase project settings');
  console.log('3. Make sure all environment variables are set correctly');
}