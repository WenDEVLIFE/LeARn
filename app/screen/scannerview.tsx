import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
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

  // Inline MindAR HTML. Update the paths below if your files are located elsewhere.
  const mindarHtml = `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
      <script src="https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v7.0.0/dist/aframe-extras.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
      <style>body { margin: 0; overflow: hidden; }</style>
    </head>
    <body>
      <a-scene mindar-image="imageTargetSrc: /assets/ar/animals.mind;" color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false">
        <a-assets>
          <!-- preload only existing models from /assets/glb/ -->
          ${animalNames.map((n, i) => availableModels.has(n) ? `<a-asset-item id="model${i}" src="/assets/glb/${filenameFor(n)}"></a-asset-item>` : '').join('\n')}
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        <!-- Create one entity per targetIndex (0..18). If model missing, show a placeholder box + label -->
        ${animalNames.map((n, i) => `
          <a-entity mindar-image-target="targetIndex: ${i}">
            ${availableModels.has(n) ? `<a-gltf-model rotation="0 0 0" position="0 -0.25 0" scale="0.05 0.05 0.05" src="#model${i}" animation-mixer></a-gltf-model>` : `<a-box position="0 -0.25 0" scale="0.2 0.2 0.2" color="#555"></a-box><a-text value="${n} (no model)" color="#FFF" align="center" position="0 -0.6 0" scale="0.5 0.5 0.5"></a-text>`}
          </a-entity>
        `).join('\n')}
      </a-scene>

      <script>
        // Notify React Native when AR scene has started rendering.
        function notifyLoaded(){
          try {
            if(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function'){
              window.ReactNativeWebView.postMessage('mindar-loaded');
            }
          } catch(e){}
        }

        document.addEventListener('DOMContentLoaded', function(){
          var scene = document.querySelector('a-scene');
          if(scene){
            scene.addEventListener('renderstart', function(){
              notifyLoaded();
            }, { once: true });
          }
          // Fallback: notify after 6s if renderstart not fired
          setTimeout(notifyLoaded, 6000);
        });
      </script>
    </body>
  </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mindarHtml }}
        style={StyleSheet.absoluteFillObject}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
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

      {/* Small alert/status box */}
      {showAlert && (
        <View style={styles.statusAlert}>
          <ThemedText style={styles.statusText}>
            {loaded ? 'AR ready — scripts & .mind loaded' : 'Loading AR scripts and .mind...'}
          </ThemedText>
        </View>
      )}
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
