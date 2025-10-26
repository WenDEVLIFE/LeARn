import { Spacer } from '@/components/spacer';
import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft as BackIcon, Pause as PauseIcon, Play as PlayIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { select } from '../../config/functions';

interface ModelItem {
  id: string;
  name: string;
  image?: { uri: string } | null;
  model?: string | null;
  audio?: string | null;
  description: string;
  activated?: boolean | null;
  additionalInfo: Record<string, any>;
  raw: any;
}

export default function InfoView() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id?: string };
  const [fontsLoaded] = useAppFonts();

  const [item, setItem] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(false);

  const playerRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const lastAudioUriRef = useRef<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let mounted = true;

    const fetchModel = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await select('models', { id });
        let row: any = null;

        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          row = res.data[0];
        } else if (res?.success && res.data && typeof res.data === 'object') {
          row = res.data;
        }

        if (!row) return;

        const additionalInfoArray = Array.isArray(row.additionalInfo)
          ? row.additionalInfo
          : [];
        const additionalInfoObj = additionalInfoArray.reduce((acc: any, it: any) => {
          const k = it?.key ?? it?.name ?? null;
          const v = it?.value ?? it?.val ?? null;
          if (k) acc[k] = v;
          return acc;
        }, {});

        const mapped: ModelItem = {
          id: row.id ?? row._id ?? id,
          name: row.name || row.filename || 'Untitled',
          image: row.image
            ? typeof row.image === 'string'
              ? { uri: row.image }
              : { uri: row.image.url ?? row.image.path }
            : null,
          model: row.model?.url ?? row.model ?? null,
          audio:
            (row.audio &&
              (row.audio.url ?? row.audio.path ?? row.audio)) ??
            null,
          description: row.description || row.desc || row.summary || '',
          activated:
            typeof row.activated === 'boolean'
              ? row.activated
              : row.active ?? null,
          additionalInfo: additionalInfoObj,
          raw: row,
        };

        if (mounted) setItem(mapped);
      } catch (e) {
        console.error('Failed to fetch model', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchModel();

    return () => {
      mounted = false;
      (async () => {
        if (playerRef.current) {
          await playerRef.current.unloadAsync().catch(() => {});
          playerRef.current = null;
        }
      })();
    };
  }, [id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleToggleAudio = async () => {
    if (!item?.audio) return;
    try {
      setAudioLoading(true);

      // If currently playing, stop (so it can be restarted fresh next time)
      if (isPlaying && playerRef.current) {
        try {
          await playerRef.current.setIsLoopingAsync(false);
          await playerRef.current.stopAsync();
        } catch (e) {
          // ignore
        }
        setIsPlaying(false);
        return;
      }

      // If audio changed from last loaded, unload previous
      if (playerRef.current && lastAudioUriRef.current !== item.audio) {
        try {
          await playerRef.current.unloadAsync();
        } catch (e) {}
        playerRef.current = null;
        lastAudioUriRef.current = null;
      }

      // Initialize if not yet loaded
      if (!playerRef.current) {
        playerRef.current = new Audio.Sound();
        await playerRef.current.loadAsync({ uri: item.audio }, { shouldPlay: false });
        lastAudioUriRef.current = item.audio;

        playerRef.current.setOnPlaybackStatusUpdate((status) => {
          const s: any = status;
          if (!s) return;
          // keep local playing state in sync with actual playback
          if (typeof s.isLoaded !== 'undefined' && s.isLoaded) {
            setIsPlaying(!!s.isPlaying);
          }
          // didJustFinish may not be typed — cast to any
          if (s.didJustFinish) {
            // finished naturally (not looping)
            setIsPlaying(false);
            // reset to start so user can replay immediately
            try {
              playerRef.current?.setPositionAsync(0);
            } catch (e) {}
          }
        });
      }

      // Enable looping while active and play
      await playerRef.current.setIsLoopingAsync(true);
      // ensure we start from beginning if it previously finished
      try {
        await playerRef.current.setPositionAsync(0);
      } catch (e) {}
      await playerRef.current.playAsync();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio error', err);
    } finally {
      setAudioLoading(false);
    }
  };

  const windowWidth = Dimensions.get('window').width;

  // ✅ Display .glb directly (no AR) — fallback html for WebView
  const modelViewerHtml = (modelUrl: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
      <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
      <style>
        html,body { height:100%; margin:0; background:#fff; overflow:hidden; }
        model-viewer { width:100%; height:100%; }
      </style>
    </head>
    <body>
      <model-viewer src="${modelUrl}" camera-controls autoplay exposure="1" ar-modes="webxr scene-viewer quick-look"></model-viewer>
    </body>
    </html>
  `;

  const handleViewAR = async () => {
    if (!item?.model) return;
    try {
      setLoading(true);

      // safe access to cacheDirectory (some envs/types may not expose it)
      const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
      if (!cacheDir) {
        // fallback: open remote url in browser
        await Linking.openURL(item.model);
        return;
      }

      const filename = `${item.id}.glb`;
      const fileUri = `${cacheDir}${filename}`;

      // Download if not already cached
      const info = await FileSystem.getInfoAsync(fileUri);
      if (!info.exists) {
        await FileSystem.downloadAsync(item.model, fileUri);
      }

      if (Platform.OS === 'android') {
        // On Android get a content:// uri so external apps/browsers can access it
        try {
          const contentUri = await (FileSystem as any).getContentUriAsync(fileUri);
          await Linking.openURL(contentUri);
        } catch (e) {
          // fallback: try to open the file:// uri
          await Linking.openURL(fileUri);
        }
      } else {
        // On iOS open the remote URL in browser (downloading .glb from app cache to Files/QuickLook
        // programmatically is more involved; opening remote URL is a reliable fallback)
        await Linking.openURL(item.model);
      }
    } catch (err) {
      console.error('AR open error:', err);
      Alert.alert('AR error', 'Unable to open file in browser/viewer.');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Loading fonts...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BackIcon color="black" size={20} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {item?.name ?? 'Animal Information'}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ padding: 16 }}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
          ]}
        >
          {item?.model ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
              <Image
                source={
                  // prefer mapped image, then try raw image/url fields, otherwise fallback local logo
                  item?.image ??
                  (item?.raw?.image
                    ? typeof item.raw.image === 'string'
                      ? { uri: item.raw.image }
                      : { uri: item.raw.image.url ?? item.raw.image.path }
                    : item?.raw?.url
                    ? { uri: item.raw.url }
                    : require('@/assets/images/logo.png'))
                }
                style={[styles.imageLarge, { width: windowWidth - 64, height: 260 }]}
                resizeMode="contain"
              />

              <Spacer height={12} />

              <TouchableOpacity
                style={styles.arButton}
                onPress={handleViewAR}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={{ color: '#fff', fontWeight: '700' }}>View in AR</ThemedText>
                )}
              </TouchableOpacity>
            </View>
           ) : (
             <View style={styles.imageContainer}>
               {loading ? (
                 <ActivityIndicator />
               ) : (
                 <Image
                   source={
                     item?.image ?? require('@/assets/images/logo.png')
                   }
                   style={[styles.imageLarge, { width: windowWidth - 64 }]}
                   resizeMode="contain"
                 />
               )}
             </View>
           )}

          <Spacer height={12} />

          <View style={styles.rowBetween}>
            <ThemedText type="defaultSemiBold" style={styles.name}>
              {item?.name}
            </ThemedText>

            {item?.audio && (
              <TouchableOpacity
                style={styles.audioButton}
                onPress={handleToggleAudio}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : isPlaying ? (
                  <PauseIcon color="#fff" size={18} />
                ) : (
                  <PlayIcon color="#fff" size={18} />
                )}
              </TouchableOpacity>
            )}
          </View>

          <Spacer height={8} />

          <ThemedText type="defaultSemiBold" style={styles.additionaltitle}>
            Description:
          </ThemedText>
          <Spacer height={6} />
          <ThemedText style={styles.description}>
            {item?.description || 'No description available.'}
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#808080',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scrollContainer: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  imageLarge: { height: 220, borderRadius: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: '#222' },
  audioButton: {
    backgroundColor: '#FFB300',
    padding: 10,
    borderRadius: 10,
  },
  description: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 8 },
  additionaltitle: { fontSize: 16, color: '#222', fontWeight: '700', marginTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  arButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
