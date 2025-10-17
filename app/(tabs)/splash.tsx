import { Image, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// This is the main splash screen component that displays when the app first loads
// In Expo Router, screens are automatically routed based on their file location
// This file is located at app/(tabs)/splash.tsx, making it accessible as a tab
export default function SplashScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* The splash icon image - this is the main visual element */}
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={styles.logo}
      />
      {/* Main title text using themed text component for consistent styling */}
      <ThemedText type="title" style={styles.title}>
        Welcome to LeARn
      </ThemedText>
      {/* Subtitle text with reduced opacity for visual hierarchy */}
      <ThemedText type="subtitle" style={styles.subtitle}>
        Your Learning App
      </ThemedText>
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