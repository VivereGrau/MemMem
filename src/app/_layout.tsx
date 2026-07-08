import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Appearance } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { getTheme } from '@/utils/storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function initSettings() {
      const savedTheme = await getTheme();
      if (savedTheme !== 'system') {
        Appearance.setColorScheme(savedTheme);
      }
      // If it is 'system', we don't force any specific scheme. Calling setColorScheme(null) causes crashes on some RN builds.
      SplashScreen.hideAsync();
    }
    initSettings();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
