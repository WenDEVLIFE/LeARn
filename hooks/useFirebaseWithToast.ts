import { app } from '@/config/firebaseConfig';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

/**
 * Hook to show Firebase initialization status via toast notifications
 */
export const useFirebaseWithToast = () => {
  useEffect(() => {
    const showFirebaseStatus = () => {
      try {
        if (app) {
          // Firebase is initialized, show success toast
          Toast.show({
            type: 'success',
            text1: 'Firebase Connected',
            text2: 'Firebase services are ready to use!',
            visibilityTime: 3000, // 3 seconds
            autoHide: true,
          });
        } else {
          // Firebase is not initialized, show error toast
          Toast.show({
            type: 'error',
            text1: 'Firebase Connection Failed',
            text2: 'Firebase services are not available.',
            visibilityTime: 5000, // 5 seconds for error messages
            autoHide: true,
          });
        }
      } catch (error) {
        // Error occurred, show error toast
        Toast.show({
          type: 'error',
          text1: 'Firebase Error',
          text2: 'An error occurred with Firebase services.',
          visibilityTime: 5000, // 5 seconds for error messages
          autoHide: true,
        });
        console.error('Firebase error:', error);
      }
    };

    // Show Firebase status when component mounts
    showFirebaseStatus();
  }, []);
};