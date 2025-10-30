// Firebase configuration for web and Expo
import Constants from 'expo-constants';
import { getApp, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Initialize Firebase with error handling (NO toast - toast is shown in hooks after app mounts)
const initializeFirebase = () => {
  try {
    // Check if Firebase app is already initialized
    let app;
    try {
      app = getApp();
      return app;
    } catch {
      // Firebase config - Replace with your actual config from Firebase Console
      const firebaseConfig = {
        apiKey: Constants?.expoConfig?.extra?.firebase?.apiKey || "AIzaSyD0Qov1Vx6ZqCNY1YwvZZpbcoHNlGEfKm8",
        authDomain: Constants?.expoConfig?.extra?.firebase?.authDomain || "learn-9fd4e.firebaseapp.com",
        projectId: Constants?.expoConfig?.extra?.firebase?.projectId || "learn-9fd4e",
        storageBucket: Constants?.expoConfig?.extra?.firebase?.storageBucket || "learn-9fd4e.firebasestorage.app",
        messagingSenderId: Constants?.expoConfig?.extra?.firebase?.messagingSenderId || "462459983821",
        appId: Constants?.expoConfig?.extra?.firebase?.appId || "1:462459983821:android:7ca5334da837715fb05684"
      };

      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      return app;
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Don't throw - return null so app can still work without Firebase
    return null;
  }
};

// Initialize Firebase app (without toast notifications - toast is handled in hooks)
let app: any = null;
try {
  app = initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  app = null;
}

// Get Firebase Auth instance (safe getter)
let auth: any = null;
if (app) {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.error('Failed to get Firebase Auth:', error);
    auth = null;
  }
}

export { app, auth };
