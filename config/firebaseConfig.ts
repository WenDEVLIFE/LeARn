// Firebase configuration for web and Expo
import Constants from 'expo-constants';
import { getApp, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import Toast from 'react-native-toast-message';

// Initialize Firebase with error handling and toast notification
const initializeFirebase = () => {
  try {
    // Check if Firebase app is already initialized
    let app;
    try {
      app = getApp();
      // If app already exists, show a different message
      Toast.show({
        type: 'info',
        text1: 'Firebase Already Initialized',
        text2: 'Firebase was already initialized in this session.',
        visibilityTime: 3000, // 3 seconds
        autoHide: true,
      });
    } catch {
      // Firebase config - Replace with your actual config from Firebase Console
 const firebaseConfig = {
  apiKey: Constants?.expoConfig?.extra?.firebase?.apiKey || "AIzaSyD0Qov1Vx6ZqCNY1YwvZZpbcoHNlGEfKm8",
  authDomain: Constants?.expoConfig?.extra?.firebase?.authDomain || "learn-9fd4e.firebaseapp.com", // ✅ FIXED (back to proper domain)
  projectId: Constants?.expoConfig?.extra?.firebase?.projectId || "learn-9fd4e",
  storageBucket: Constants?.expoConfig?.extra?.firebase?.storageBucket || "learn-9fd4e.firebasestorage.app", // ✅ FIXED (new domain)
  messagingSenderId: Constants?.expoConfig?.extra?.firebase?.messagingSenderId || "462459983821",
  appId: Constants?.expoConfig?.extra?.firebase?.appId || "1:462459983821:android:7ca5334da837715fb05684"
};


      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      
      // Show toast notification when Firebase is initialized successfully
      Toast.show({
        type: 'success',
        text1: 'Firebase Initialized',
        text2: 'Firebase has been successfully initialized!',
        visibilityTime: 3000, // 3 seconds
        autoHide: true,
      });
    }
    return app;
  } catch (error) {
    // Show error toast if initialization fails
    Toast.show({
      type: 'error',
      text1: 'Firebase Initialization Failed',
      text2: 'Failed to initialize Firebase. Please check your configuration.',
      visibilityTime: 5000, // 5 seconds for error messages
      autoHide: true,
    });
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Initialize Firebase app
const app = initializeFirebase();

// Get Firebase Auth instance
const auth = getAuth(app);

export { app, auth };

