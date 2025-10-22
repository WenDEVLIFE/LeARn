import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { getCurrentUser, signInAnonymouslyHelper, signOutHelper } from '@/utils/firebaseHelpers';
import { useRouter } from 'expo-router';
import { ArrowLeft as BackIcon } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FlashCardLibraryView() {
  const router = useRouter();
  const [fontsLoaded] = useAppFonts();

  const handleFirebaseAuth = async () => {
    try {
      const result = await signInAnonymouslyHelper();
      if (!result.success) {
        console.error('Firebase auth failed');
      }
    } catch (error) {
      console.error('Firebase auth error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const result = await signOutHelper();
      if (!result.success) {
        console.error('Firebase sign out failed');
      }
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
  };

  const handleCheckAuth = () => {
    const user = getCurrentUser();
    if (user) {
      console.log('Current user ID:', user.uid);
    } else {
      console.log('No user is currently signed in');
    }
  };

  // Define categories for flashcards
  const categories = [
    {
      id: 'animals',
      name: 'Animals',
      image: require('@/assets/images/logo.png'),
    },
    {
      id: 'fruits',
      name: 'Fruits',
      image: require('@/assets/images/logo.png'),
    },
    {
      id: 'vehicles',
      name: 'Vehicles',
      image: require('@/assets/images/logo.png'),
    },
    {
      id: 'shapes',
      name: 'Shapes & Color',
      image: require('@/assets/images/logo.png'),
    },
  ];

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
          Flashcard Library
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.grid}>
          {categories.map((category, index) => (
            <View 
              key={category.id} 
              style={[
                styles.card,
                // Remove marginRight for every second item (last item in row)
                (index + 1) % 2 === 0 && { marginRight: 0 }
              ]}
            >
              <View style={styles.imageContainer}>
                {/* Fixed: Using Image component correctly */}
                <Image 
                  source={category.image} 
                  style={styles.image} 
                  resizeMode="contain"
                />
              </View>
              <View style={styles.buttonContainer}>
                <ThemedText style={styles.buttonText}>{category.name}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
    paddingTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    width: '48%',
    marginBottom: 16,
    marginRight: 8,
  },
  imageContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
  },
  buttonContainer: {
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: '#FFB300',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});