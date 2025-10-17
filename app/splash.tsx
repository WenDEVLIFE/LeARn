import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// This is the main splash screen component that displays when the app first loads
// Features modern loading animation and automatic navigation to home screen
export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for fade-in effect
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Animation for scale effect
  const loadingAnim = useRef(new Animated.Value(0)).current; // Animation for loading bar

  useEffect(() => {
    // Start entrance animations when component mounts
    Animated.parallel([
      // Fade in the content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Scale up the content
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start loading animation
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false, // Cannot use native driver for width animation
      })
    ).start();

    // Navigate to home screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, loadingAnim, router]);

  return (
    <ThemedView style={styles.container}>
      {/* Background image - covers the entire screen behind other elements */}
      <Image
        source={require('@/assets/images/app_bg.jpeg')}
        style={styles.backgroundImage}
      />
      {/* Modern gradient overlay using multiple layers */}
      <ThemedView style={styles.overlayTop}>
        <ThemedView style={styles.overlayBottom}>
        {/* Animated content container */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* The splash icon image - this is the main visual element */}
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
          />
          {/* Main title text using themed text component for consistent styling */}
          <ThemedText type="title" style={styles.title}>
            LeARn
          </ThemedText>
          {/* Subtitle text with reduced opacity for visual hierarchy */}
          {/* Modern loading indicator - pulsing dots */}
          <ThemedView style={styles.loadingContainer}>
            <ThemedView style={styles.dotsContainer}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      opacity: loadingAnim.interpolate({
                        inputRange: [0, 0.33, 0.66, 1],
                        outputRange: [
                          index === 0 ? 1 : 0.3,
                          index === 1 ? 1 : 0.3,
                          index === 2 ? 1 : 0.3,
                          index === 0 ? 1 : 0.3,
                        ],
                      }),
                      transform: [
                        {
                          scale: loadingAnim.interpolate({
                            inputRange: [0, 0.33, 0.66, 1],
                            outputRange: [
                              index === 0 ? 1.2 : 1,
                              index === 1 ? 1.2 : 1,
                              index === 2 ? 1.2 : 1,
                              index === 0 ? 1.2 : 1,
                            ],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </ThemedView>
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </ThemedView>
        </Animated.View>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Remove default background color from ThemedView to show background image
    backgroundColor: 'transparent',
  },
  // Background image style - positioned absolutely to cover entire screen
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Ensures image covers entire area
  },
  // Top overlay layer - subtle gradient
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Light overlay at top
  },
  // Bottom overlay layer - stronger gradient for text readability
  overlayBottom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Stronger overlay at bottom
    width: '100%',
    height: '100%',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  // Container for animated content
  contentContainer: {
    alignItems: 'center',
  },
  // Loading animation container
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  // Loading bar background
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  // Animated loading progress bar
  loadingProgress: {
    height: '100%',
    borderRadius: 2,
  },
  // Loading text
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    opacity: 0.8,
  },
  // Container for animated dots
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  // Individual animated dot
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});