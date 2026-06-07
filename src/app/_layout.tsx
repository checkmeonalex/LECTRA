import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from '@/context/AppThemeContext';
import { TimetableProvider } from '@/context/TimetableContext';
import { useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Patch Text defaultProps so every <Text> uses Outfit by default
(Text as any).defaultProps = {
  ...((Text as any).defaultProps ?? {}),
  style: [{ fontFamily: 'Outfit_400Regular' }],
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <TimetableProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </TimetableProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
