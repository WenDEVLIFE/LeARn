import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged, signInAnonymously, signOut, User } from 'firebase/auth';
import Toast from 'react-native-toast-message';

/**
 * Signs in the user anonymously
 * @returns Promise with success status and user or error
 */
export const signInAnonymouslyHelper = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    Toast.show({
      type: 'success',
      text1: 'Signed In',
      text2: 'You have been signed in anonymously.',
      visibilityTime: 3000, // 3 seconds
      autoHide: true,
    });
    return { success: true, user: userCredential.user, error: null };
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Sign In Failed',
      text2: 'Failed to sign in anonymously.',
      visibilityTime: 5000, // 5 seconds for error messages
      autoHide: true,
    });
    return { success: false, user: null, error };
  }
};

/**
 * Signs out the current user
 * @returns Promise with success status or error
 */
export const signOutHelper = async () => {
  try {
    await signOut(auth);
    Toast.show({
      type: 'success',
      text1: 'Signed Out',
      text2: 'You have been signed out successfully.',
      visibilityTime: 3000, // 3 seconds
      autoHide: true,
    });
    return { success: true, error: null };
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Sign Out Failed',
      text2: 'Failed to sign out.',
      visibilityTime: 5000, // 5 seconds for error messages
      autoHide: true,
    });
    return { success: false, error };
  }
};

/**
 * Listen for authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChangeHelper = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current authenticated user
 * @returns User | null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};