import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
import { Unbounded_600SemiBold, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { WebShell } from '@/components/ui';
import { useIsWide } from '@/lib/layout';
import { AppStoreProvider, useStore } from '@/store/AppStore';
import { ThemeProvider, useTheme } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    Unbounded_600SemiBold,
    Unbounded_700Bold,
  });
  if (!fontsLoaded) return null;
  return (
    <AppStoreProvider>
      <Themed />
    </AppStoreProvider>
  );
}

function Themed() {
  const { state, hydrated } = useStore();
  if (!hydrated) return null;
  return (
    <ThemeProvider mode={state.settings.theme}>
      <Navigator />
    </ThemeProvider>
  );
}

const overlay = { presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } } as const;

function Navigator() {
  const { state } = useStore();
  const { c, scheme } = useTheme();
  const wide = useIsWide();
  const pathname = usePathname();
  const inShell = wide && state.onboarded && !pathname.startsWith('/match');

  const stack = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: wide ? 'none' : 'default' }}>
      {/* Onboarding is reachable only until it is completed; afterwards the app is. */}
      <Stack.Protected guard={!state.onboarded}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={state.onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]/index" options={overlay} />
        <Stack.Screen name="report/[userId]" options={overlay} />
        <Stack.Screen name="match/[eventId]/[userId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="event/[id]/after" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      {inShell ? <WebShell>{stack}</WebShell> : stack}
    </View>
  );
}
