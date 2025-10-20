import { app } from '@/config/firebaseConfig';
import { useEffect, useState } from 'react';

/**
 * Hook to monitor Firebase initialization status
 */
export const useFirebaseInit = () => {
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirebaseStatus = async () => {
      try {
        // Firebase app should already be initialized from config
        if (app) {
          setIsFirebaseInitialized(true);
        } else {
          setIsFirebaseInitialized(false);
        }
      } catch (error) {
        console.error('Error checking Firebase status:', error);
        setIsFirebaseInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirebaseStatus();
  }, []);

  return { isFirebaseInitialized, isLoading };
};