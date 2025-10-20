import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppFonts } from '@/hooks/use-fonts';

export const unstable_settings = {
  // Set splash as the initial route instead of tabs
  initialRouteName: 'screen/splash',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useAppFonts();

  // If fonts are not loaded yet, you might want to show a loading indicator
  if (!fontsLoaded) {
    return (
      <ThemedText>Loading fonts...</ThemedText>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="screen/splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="screen/mainview" options={{ headerShown: false }} />
        <Stack.Screen name="screen/scannerview" options={{ headerShown: false }} />
        <Stack.Screen name="screen/flashview" options={{ headerShown: false }} />
        <Stack.Screen name="screen/infoview" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}