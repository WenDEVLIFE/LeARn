import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Spacer } from '@/components/spacer';
import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';

// Main view screen with Poppins font
export default function MainScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const [fontsLoaded] = useAppFonts();

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
          {/* Logo and title in a row */}
          <View style={styles.logoTitleRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
            />
            <ThemedText type="title" style={styles.title}>
              LeARn
            </ThemedText>
          </View>
                    <Spacer height={20} />
          {/* Button container for proper spacing */}
          <View style={styles.buttonContainer}>
            {/* Custom styled button */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            <Spacer height={20} />
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.buttonText}>Flash Card Library</Text>
            </TouchableOpacity>
          </View>
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
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 60, // Push content down from top
  },
  // New style for horizontal layout
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 15,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  button: {
    backgroundColor: '#FF5C4D',
    width: 250, // Fixed width for consistent button sizes
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center', // Center text horizontally
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center', // Ensure text is centered
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center', // Center buttons vertically
    width: '100%',
    alignItems: 'center',
    paddingBottom: 50, // Add space at the bottom
  },
});