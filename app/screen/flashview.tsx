import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { getCurrentUser, signInAnonymouslyHelper, signOutHelper } from '@/utils/firebaseHelpers';
import { useRouter } from 'expo-router';
import { ArrowLeft as BackIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { select } from '../../config/functions';

export default function FlashCardLibraryView() {
  const router = useRouter();
  const [fontsLoaded] = useAppFonts();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // models state (fetched from DB)
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Animate the header and grid entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // fetch models to compute category counts and enable navigation to filtered lists
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await select('models', {});
        const rows = res.success && Array.isArray(res.data) ? res.data : [];
        if (mounted) setModels(rows);
      } catch (e) {
        console.error('Failed to fetch models for categories', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
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
      image: require('@/assets/images/animal.png'),
    },
    {
      id: 'fruits',
      name: 'Fruits',
      image: require('@/assets/images/fruits.png'),
    },
    {
      id: 'vehicles',
      name: 'Vehicles',
      image: require('@/assets/images/vehicle.png'),
    },
    {
      id: 'shapes',
      name: 'Shapes & Color',
      image: require('@/assets/images/shape.png'),
    },
  ];

  // compute counts for categories from fetched models (optional)
  const categoryCounts = categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = models.filter(m => m.category === c.id).length;
    return acc;
  }, {});

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
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
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
      </Animated.View>
      <ScrollView style={styles.scrollContainer}>
        <Animated.View 
          style={[
            styles.grid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {categories.map((category, index) => (
            <AnimatedCard
              key={category.id}
              category={category}
              index={index}
              onPress={() => {
                // navigate to entity view filtered by category
                router.push({ pathname: '/screen/entityview', params: { category: category.id } });
              }}
              count={categoryCounts[category.id] ?? 0}
            />
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Animated card component
const AnimatedCard = ({ category, index, onPress, count }: { category: any; index: number; onPress?: () => void; count?: number }) => {
   const scaleAnim = useRef(new Animated.Value(0.8)).current;
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const router = useRouter();

   useEffect(() => {
     // Staggered entrance animation for each card
     Animated.parallel([
       Animated.timing(fadeAnim, {
         toValue: 1,
         duration: 600,
         delay: index * 100,
         easing: Easing.out(Easing.exp),
         useNativeDriver: true,
       }),
       Animated.spring(scaleAnim, {
         toValue: 1,
         friction: 8,
         tension: 50,
         delay: index * 100,
         useNativeDriver: true,
       })
     ]).start();
     
     // Add a subtle hover effect on load
     setTimeout(() => {
       Animated.timing(scaleAnim, {
         toValue: 1.03,
         duration: 300,
         useNativeDriver: true,
       }).start(() => {
         Animated.timing(scaleAnim, {
           toValue: 1,
           duration: 300,
           useNativeDriver: true,
         }).start();
       });
     }, 1000 + index * 100);
   }, []);

   return (
     <Animated.View 
       style={[
         styles.card,
         // Remove marginRight for every second item (last item in row)
         (index + 1) % 2 === 0 && { marginRight: 0 },
         {
           opacity: fadeAnim,
           transform: [{ scale: scaleAnim }]
         }
       ]}
     >
      <TouchableOpacity
        onPress={onPress ?? (() => router.push('/screen/entityview'))}
        activeOpacity={0.8}
        style={{ flex: 1 }}
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
          <Text style={{ fontSize: 12, color: '#fff', marginTop: 4 }}>{typeof count === 'number' ? `${count} cards` : ''}</Text>
        </View>
      </TouchableOpacity>
     </Animated.View>
   );
 };
 
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