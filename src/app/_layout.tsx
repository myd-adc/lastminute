import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppStoreProvider } from '@/store/AppStore';
import { colors } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <AppStoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.grouped } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="join" options={{ presentation: 'modal' }} />
        <Stack.Screen name="verify" options={{ presentation: 'modal' }} />
      </Stack>
    </AppStoreProvider>
  );
}
