import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { useFirebaseInit } from '@/hooks/useFirebaseInit';
import { useFirebaseWithToast } from '@/hooks/useFirebaseWithToast';

// Design guidelines - based on standard mobile screen size (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Responsive scaling functions
const scale = (size: number) => (Dimensions.get('window').width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (Dimensions.get('window').height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Splash screen with modern loading bar and Poppins font
export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const [fontsLoaded] = useAppFonts();
  const { isFirebaseInitialized, isLoading } = useFirebaseInit();
  
  // Show Firebase toast notifications
  useFirebaseWithToast();

  useEffect(() => {
    // Simple fade in animation for the loading text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Animate the loading bar
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Only redirect from the splash screen. If user navigated directly to another route
    // (for example on web: /screen/model), skip the automatic redirect.
    const pathname = typeof window !== 'undefined' ? window.location.pathname : null;
    if (pathname && !pathname.includes('/screen/splash') && pathname !== '/' ) {
      // user opened a different route directly — do not auto-redirect
      return;
    }

    // Navigate to main view after 3 seconds (keeps existing behavior when on splash)
    const timer = setTimeout(() => {
      router.replace('/screen/mainview');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Interpolate progress bar width
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // If fonts are not loaded yet, you might want to show a loading indicator
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/app_bg.jpeg')}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <ThemedText>Loading fonts...</ThemedText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/app_bg.jpeg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
          <ThemedText type="title" style={styles.title}>
            LeARn
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Learning Augmented Reality
          </ThemedText>
          
          {/* Modern loading bar */}
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { width: progressBarWidth }
              ]} 
            />
          </View>  
          {/* Simple animated loading text */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <ThemedText style={styles.loadingText}>Loading experience...</ThemedText>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: moderateScale(20),
  },
  logo: {
    width: moderateScale(150),
    height: moderateScale(150),
    marginBottom: moderateScale(20),
    resizeMode: 'contain',
  },
  title: {
    fontSize: moderateScale(36),
    fontWeight: '700',
    marginBottom: moderateScale(8),
    textAlign: 'center',
    letterSpacing: 1,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: moderateScale(16),
    opacity: 0.8,
    marginBottom: moderateScale(30),
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  // Modern loading bar styles
  progressBarBackground: {
    width: '80%',
    height: moderateScale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: moderateScale(10),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(3),
  },
  loadingText: {
    marginTop: moderateScale(20),
    fontSize: moderateScale(14),
    opacity: 0.8,
    fontStyle: 'italic',
    color: '#fff',
    fontFamily: 'Poppins-Light',
  },
  // Firebase status styles
  statusContainer: {
    marginVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(5),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  successText: {
    color: '#4CAF50', // Green color for success
  },
  errorText: {
    color: '#F44336', // Red color for error
  },
});