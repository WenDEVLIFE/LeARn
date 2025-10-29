import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { useLocalSearchParams, useRouter } from 'expo-router'; // useLocalSearchParams for route params
import { ArrowLeft as BackIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { select } from '../../config/functions'; // added

export default function EntityView() {
  const router = useRouter();
  const [fontsLoaded] = useAppFonts();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const { category } = useLocalSearchParams() as { category?: string }; // category id passed from flashview
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch models filtered by category (if category param present)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // always require activated === true; include category when provided
        const filter = { ...(category ? { category } : {}), activated: true };
        const res = await select('models', filter);
        const rows = res.success && Array.isArray(res.data) ? res.data : [];

        // extra client-side safety: ensure only activated items are used
        const activeRows = rows.filter((r: any) =>
          r != null &&
          (r.activated === true || r.activated === 'true' || r.activated === 1)
        );

        // map DB rows to entities suitable for display
        const mapped = activeRows.map((r: any) => ({
          id: r.id,
          name: r.name || r.filename || 'Untitled',
          // prefer URL if present, otherwise try to use local placeholder
          image:
            typeof r.image === 'string'
              ? (r.image.startsWith('http') ? { uri: r.image } : require('@/assets/images/logo.png'))
              : (r.image && r.image.url ? { uri: r.image.url } : require('@/assets/images/logo.png')),
          raw: r,
        }));
        if (mounted) setEntities(mapped);
      } catch (e) {
        console.error('Failed to fetch entities for category', category, e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [category]);

  useEffect(() => {
    // Animate the header and list entrance
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
          onPress={() => router.back()}
        >
          <BackIcon color="black" size={24} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {category ? `${String(category).toUpperCase()} ` : 'Entities'}
        </ThemedText>
        <View style={{ width: 24 }} />
      </Animated.View>
      <ScrollView style={styles.scrollContainer}>
        <Animated.View 
          style={[
            styles.list,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            entities.map((entity, index) => (
              <AnimatedEntity
                key={entity.id ?? String(index)}
                entity={entity}
                index={index}
                onPress={() => router.push({ pathname: '/screen/infoview', params: { id: entity.id } })}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Animated entity component for list view
const AnimatedEntity = ({ entity, index, onPress }: { entity: any; index: number; onPress: () => void }) => {
   const scaleAnim = useRef(new Animated.Value(0.95)).current;
   const fadeAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
     // Staggered entrance animation for each entity
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
   }, []);

   return (
     <TouchableOpacity
       onPress={onPress}
       activeOpacity={0.8}
       style={styles.listItem}
     >
       <Animated.View 
         style={[
           styles.card,
           {
             opacity: fadeAnim,
             transform: [{ scale: scaleAnim }]
           }
         ]}
         onTouchStart={() => {
           Animated.timing(scaleAnim, {
             toValue: 0.98,
             duration: 100,
             useNativeDriver: true,
           }).start();
         }}
         onTouchEnd={() => {
           Animated.timing(scaleAnim, {
             toValue: 1,
             duration: 100,
             useNativeDriver: true,
           }).start();
         }}
       >
         <View style={styles.imageContainer}>
          <Image 
            source={entity.image} 
            style={styles.image} 
            resizeMode="contain"
          />
         </View>
         <View style={styles.textContainer}>
           <ThemedText style={styles.entityName}>{entity.name}</ThemedText>
         </View>
         <View style={styles.arrowContainer}>
           <ThemedText style={styles.arrow}>›</ThemedText>
         </View>
       </Animated.View>
     </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  image: {
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrowContainer: {
    width: 30,
    alignItems: 'flex-end',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
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