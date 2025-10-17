import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

// Splash screen with modern loading bar
export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

    // Navigate to home screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Interpolate progress bar width
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/app_bg.jpeg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
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
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
    textAlign: 'center',
    color: '#fff',
  },
  // Modern loading bar styles
  progressBarBackground: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    opacity: 0.8,
    fontStyle: 'italic',
    color: '#fff',
  },
});