import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import * as Linking from 'expo-linking'; // <-- added
import { useRouter } from 'expo-router';
import { ArrowLeft as BackIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Responsive scaling setup
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (Dimensions.get('window').width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (Dimensions.get('window').height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export default function ScannerView() {
  const router = useRouter();
  const [fontsLoaded] = useAppFonts();

  // show status alert and loaded flag
  const [loaded, setLoaded] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    // auto-hide alert a few seconds after loaded
    let t: ReturnType<typeof setTimeout> | undefined;
    if (loaded) {
      t = setTimeout(() => setShowAlert(false), 3000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [loaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Loading fonts...</ThemedText>
      </View>
    );
  }

  // List of 19 animal target/model names (order must match the compiled animals.mind targets)
  const animalNames = [
    'Zebra',
    'Alligator',
    'Beagle',
    'Capuchin',
    'Cat',
    'Cow',
    'Elephant',
    'Frog',
    'Giraffe',
    'Goat',
    'Horse',
    'Lion',
    'Panda',
    'Penguin',
    'Pig',
    'Rabbit',
    'Rooster',
    'Snake',
    'Tiger',
  ];

  // Models available as .glb in assets/glb/
  const availableModels = new Set([
    'Alligator',
    'Beagle',
    'Capuchin',
    'Cat',
    'Cow',
    'Goat',
    'Horse',
    'Pig',
    'Rabbit',
    'Rooster',
    'Snake',
    'Tiger',
  ]);

  // Helper to generate a safe lowercase filename for each animal (e.g. "Alligator" -> "alligator.glb")
  const filenameFor = (name: string) => name.toLowerCase().replace(/\s+/g, '_') + '.glb';

  // NOTE: render the remote server page instead of inline HTML
  const remoteUrl = 'https://dorsugympromanager.pythonanywhere.com/';

  // helper to detect id param in a url
  const extractIdFromUrl = (url: string) => {
    try {
      const m = url.match(/[?&]id=([^&]*)/);
      if (m && m[1] !== undefined) {
        const id = decodeURIComponent(m[1]);
        return id && id.length > 0 ? id : null;
      }
    } catch (e) {}
    return null;
  };

  // New helpers: determine http(s) and handle non-http / intent links by opening browser/fallback
  const isHttp = (u: string) => /^https?:\/\//i.test(u);

  const openExternalOrFallback = (url: string) => {
    if (!url) return;
    try {
      // handle Android intent:// URIs: try to extract browser fallback first
      if (url.startsWith('intent:')) {
        const m = url.match(/(?:S\.browser_fallback_url=|browser_fallback_url=)([^;]+)/);
        if (m && m[1]) {
          const fallback = decodeURIComponent(m[1]);
          Linking.openURL(fallback).catch(() => {});
          return;
        }
        // fallback: convert intent://host/...;... to https://host/...
        const converted = url.replace(/^intent:\/\//, 'https://').split(';')[0];
        Linking.openURL(converted).catch(() => {});
        return;
      }

      // non-http schemes (mailto:, tel:, whatsapp:, etc.) — try open directly, then fallback to https conversion
      const scheme = (url.split(':')[0] || '').toLowerCase();
      if (!isHttp(url) && scheme && scheme !== 'file' && scheme !== 'data' && scheme !== 'about') {
        Linking.openURL(url).catch(() => {
          // fallback: try to open as https by replacing the scheme
          const asHttps = url.replace(/^[^:]+:\/\//, 'https://');
          Linking.openURL(asHttps).catch(() => {});
        });
        return;
      }

      // default: open http(s) in external browser instead of inside Expo WebView
      if (isHttp(url)) {
        Linking.openURL(url).catch(() => {});
        return;
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: remoteUrl }}
        style={StyleSheet.absoluteFillObject}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}

        /* Android: allow http / mixed content */
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}

        /* Some pages block non‑Chrome UAs — present a Chrome UA */
        userAgent="Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

        /* Intercept navigation before it happens (Android+iOS) */
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url || '';
          const id = extractIdFromUrl(url);
          if (id) {
            router.replace(`/screen/infoview?id=${encodeURIComponent(id)}`);
            return false;
          }

          // If it's an http(s) url we allow it to load in the WebView.
          // For intent:// or other non-http(s) deep links (which Expo Go can't handle),
          // open them in the external browser / appropriate fallback and block the WebView.
          if (isHttp(url)) {
            return true;
          }

          // Non-http(s) — open externally and prevent WebView from loading it
          openExternalOrFallback(url);
          return false;
        }}

        /* Backup detection on navigation change */
        onNavigationStateChange={(navState) => {
          const url = navState.url || '';
          const id = extractIdFromUrl(url);
          if (id) {
            router.replace(`/screen/infoview?id=${encodeURIComponent(id)}`);
            return;
          }

          // If navigation changed to an intent or deep link, redirect externally
          if (!isHttp(url)) {
            openExternalOrFallback(url);
          }
        }}

        onMessage={(event) => {
          if (event.nativeEvent.data === 'mindar-loaded') {
            setLoaded(true);
            setShowAlert(true);
          }
        }}
      />

      {/* Back button top-left only */}
      <View style={styles.topLeftContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.replace('/screen/mainview')}
        >
          <BackIcon color="white" size={moderateScale(24)} />
        </TouchableOpacity>
      </View>

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

  // top-left container to keep back button above WebView
  topLeftContainer: {
    position: 'absolute',
    top: moderateScale(40),
    left: moderateScale(12),
    right: 0,
    alignItems: 'flex-start',
    zIndex: 20,
  },

  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // status alert box
  statusAlert: {
    position: 'absolute',
    top: moderateScale(50),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: 8,
    zIndex: 25,
  },
  statusText: {
    color: 'white',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },

  // removed bottom animated overlay / camera controls styles in UI (left in file in case needed)
  overlay: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(20),
  },
  title: { color: 'white', fontSize: moderateScale(24), fontWeight: '700' },
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
