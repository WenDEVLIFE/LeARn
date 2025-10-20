import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { useRouter } from 'expo-router';
import { ArrowLeft as BackIcon } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FlashCardLibraryView() {
  const router = useRouter();
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Loading fonts...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/screen/mainview')}
        >
          <BackIcon color="black" size={24} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Flash Card Library
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <ThemedText>Flash Card Library Content</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f1e5c3',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#808080', // Gray background for header
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d3d3d3', // Light gray circular background
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // White text for better contrast on gray background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});