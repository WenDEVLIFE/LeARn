import { Image, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// This is the main splash screen component that displays when the app first loads
// In Expo Router, screens are automatically routed based on their file location
// This file is located at app/(tabs)/splash.tsx, making it accessible as a tab
export default function SplashScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Background image - covers the entire screen behind other elements */}
      <Image
        source={require('@/assets/images/app_bg.jpeg')}
        style={styles.backgroundImage}
      />
      {/* Overlay to ensure text readability over the background image */}
      <ThemedView style={styles.overlay}>
        {/* The splash icon image - this is the main visual element */}
        <ThemedText type="title" style={styles.title}>
          LeARn
        </ThemedText>
        {/* Subtitle text with reduced opacity for visual hierarchy */}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  // Semi-transparent overlay to ensure text is readable over background
  overlay: {
    position: 'absolute', // Position absolutely to fill entire screen
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay with 30% opacity
    width: '100%',
    height: '100%', // Ensure overlay fills entire screen
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
});