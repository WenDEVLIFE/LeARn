import { Spacer } from '@/components/spacer';
import { ThemedText } from '@/components/themed-text';
import { useAppFonts } from '@/hooks/use-fonts';
import { useRouter } from 'expo-router';
import { ArrowLeft as BackIcon, Volume2 as SpeakerIcon } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function InfoView() {
  const router = useRouter();
  const [fontsLoaded] = useAppFonts();

  // Define information items for display
  const infoItems = [
    {
      id: 'lion',
      name: 'Lion',
      image: require('@/assets/images/logo.png'),
      description: 'The lion is a large cat of the genus Panthera native to Africa and India.',
      habitat: 'Savannas, grasslands',
      diet: 'Carnivore (primarily zebras, buffaloes)',
      size: 'Length: 8-10 ft, Weight: 265-420 lbs'
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
          Animal Information
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scrollContainer}>
        {/* Main image at the top, outside of cards */}
        <Spacer height={16} /> 
        <View style={styles.imageContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.image} 
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.content}>
          {infoItems.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Object Name with Speaker Icon */}
              <View style={styles.nameContainer}>
                <ThemedText type="defaultSemiBold" style={styles.name}>
                  {item.name}
                </ThemedText>
                <TouchableOpacity style={styles.speakerButton}>
                  <SpeakerIcon color="#FFB300" size={20} />
                </TouchableOpacity>
              </View>
        
                <ThemedText type="defaultSemiBold" style={styles.additionaltitle}>
                  Description:
                </ThemedText>
                <Spacer height={8} />
              {/* Description */}
              <ThemedText style={styles.description}>
                {item.description}
              </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.additionaltitle}>
                  Additional Information:
                </ThemedText>
              {/* Additional Information */}
              <View style={styles.infoContainer}>

                <View style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
                    Habitat:
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {item.habitat}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
                    Diet:
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {item.diet}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
                    Size:
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {item.size}
                  </ThemedText>
                </View>
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
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    color : 'black',
    marginBottom: 16,
    elevation: 3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black'
  },
  speakerButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: 'black',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 60,
    color : 'black',
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  additionaltitle: {
    fontSize: 16,
    color : 'black',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});