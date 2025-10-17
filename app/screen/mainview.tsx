import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Spacer } from '@/components/spacer';
import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';

// Main view screen with Poppins font
// Design guidelines - based on standard mobile screen size (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Responsive scaling functions
const scale = (size: number) => (Dimensions.get('window').width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (Dimensions.get('window').height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export default function MainScreen() {
  // Get screen dimensions for responsive design
  const { width, height } = Dimensions.get('window');
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const popupAnim = useRef(new Animated.Value(0)).current;
  
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

    // Popup animation for the entire view
    Animated.spring(popupAnim, {
      toValue: 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();

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
        <Animated.View 
          style={[styles.contentContainer, {
            opacity: popupAnim,
            transform: [{
              scale: popupAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }]}
        >
          <Spacer height={height * 0.1} />
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
                    <Spacer height={height * 0.3} />
          {/* Button container for proper spacing */}
          <View style={styles.buttonContainer}>
            {/* Custom styled button */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/screen/scannerview')}
            >
              <Text style={styles.buttonText}>Start Scanning</Text>
            </TouchableOpacity>
            <Spacer height={20} />
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.buttonText}>Flash Card Library</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(60), // Push content down from top
  },
  // New style for horizontal layout
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(30),
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    marginRight: moderateScale(15),
    resizeMode: 'contain',
  },
  title: {
    fontSize: moderateScale(36),
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  button: {
    backgroundColor: '#FF5C4D',
    width: moderateScale(250), // Fixed width for consistent button sizes
    paddingVertical: moderateScale(15),
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
    fontSize: moderateScale(18),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center', // Ensure text is centered
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center', // Center buttons vertically
    width: '100%',
    alignItems: 'center',
    paddingBottom: moderateScale(50), // Add space at the bottom
  },
});