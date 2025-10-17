import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft as BackIcon, Camera as CameraIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Responsive scaling setup
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (Dimensions.get('window').width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (Dimensions.get('window').height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export default function ScannerView() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      // Animate scan line
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Fade overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanning(false);
    alert(`Scanned ${type}: ${data}`);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Loading fonts...</ThemedText>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>No access to camera</ThemedText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/screen/mainview')}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128", "code39", "code93", "pdf417", "upc_e", "upc_a", "ean8"],
        }}
      />

      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
             <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.replace('/screen/mainview')}
          >
            <BackIcon color="white" size={moderateScale(24)} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Camera Object Detector
          </ThemedText>
    
        </View>

        {/* Scanner frame */}
        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, moderateScale(200)],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        {/* Camera button (lucide icon) */}
        <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.cameraButtonCurved} onPress={() => {}}>
  <CameraIcon color="black" size={moderateScale(35)} />
</TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  retryButton: {
    marginTop: moderateScale(20),
    backgroundColor: '#FF5C4D',
    paddingHorizontal: moderateScale(30),
    paddingVertical: moderateScale(10),
    borderRadius: 8,
  },
  retryButtonText: { color: 'white', fontSize: moderateScale(16), fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(20),
  },
  title: { color: 'white', fontSize: moderateScale(24), fontWeight: '700' },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
  },
  scannerFrame: {
    width: moderateScale(250),
    height: moderateScale(250),
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: moderateScale(30),
    height: moderateScale(30),
    borderColor: '#FF5C4D',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#FF5C4D' },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: moderateScale(20),
  },
  cameraButtonCurved: {
    position: 'absolute',
    bottom: moderateScale(20),
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#FFB915',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 10,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
