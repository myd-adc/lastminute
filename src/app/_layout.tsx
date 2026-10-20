import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
import { Unbounded_600SemiBold, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebShell, webScreenFade } from '@/components/ui';
import { CropperHost } from '@/components/ui/ImageCropper';
import { EmojiPreload } from '@/components/ui/emoji/EmojiPreload';
import { useIsWide } from '@/lib/layout';
import { AppStoreProvider, useStore } from '@/store/AppStore';
import { ThemeProvider, useTheme } from '@/theme';

// M00: the native splash (expo-splash-screen) and, on web, #boot in public/index.html stay up until the fonts
// and the saved state are in; Themed hides both on its first real render.
if (Platform.OS !== 'web') SplashScreen.preventAutoHideAsync().catch(() => {});

function hideSplash() {
  if (Platform.OS !== 'web') return SplashScreen.hide();
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('gone');
  setTimeout(() => boot.remove(), 320);
}

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
  useEffect(() => {
    if (hydrated) hideSplash();
  }, [hydrated]);
  if (!hydrated) return null;
  return (
    <ThemeProvider mode={state.settings.theme}>
      <Navigator />
    </ThemeProvider>
  );
}

// Overlays animate their own scrim and sheet (Sheet, event details), so the navigator adds nothing.
const overlay = { presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } } as const;
const fadeScreens = webScreenFade(['event/[id]/index', 'report/[userId]', 'language']);

function Navigator() {
  const { state } = useStore();
  const { c, scheme } = useTheme();
  const wide = useIsWide();
  const pathname = usePathname();
  const inShell = wide && state.onboarded && !pathname.startsWith('/match');
  // A browser has no status bar, so a zero top inset would pin headers to the window edge.
  const raw = useSafeAreaInsets();
  const insets = useMemo(() => (Platform.OS === 'web' ? { ...raw, top: Math.max(raw.top, 16) } : raw), [raw]);

  const stack = (
    <Stack
      screenLayout={fadeScreens}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: wide ? 'none' : 'default' }}
    >
      {/* Onboarding is reachable only until it is completed; afterwards the app is. */}
      <Stack.Protected guard={!state.onboarded}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={state.onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]/index" options={overlay} />
        <Stack.Screen name="report/[userId]" options={overlay} />
        <Stack.Screen name="language" options={overlay} />
        <Stack.Screen name="match/[eventId]/[userId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="event/[id]/after" options={{ presentation: 'fullScreenModal' }} />
        {/* Every other signed-in screen: listed so signing out (or deleting the account) leaves them too. */}
        <Stack.Screen name="event/[id]/going" />
        <Stack.Screen name="event/[id]/room" />
        <Stack.Screen name="event/[id]/group" />
        <Stack.Screen name="event/[id]/album" />
        <Stack.Screen name="event/new" />
        <Stack.Screen name="chat/[eventId]/[userId]" />
        <Stack.Screen name="community/new" />
        <Stack.Screen name="community/[id]/index" />
        <Stack.Screen name="community/[id]/new-event" />
        <Stack.Screen name="community/[id]/settings" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="blocked" />
      </Stack.Protected>
    </Stack>
  );

  return (
    <SafeAreaInsetsContext.Provider value={insets}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        {inShell ? <WebShell>{stack}</WebShell> : stack}
        <EmojiPreload />
        <CropperHost />
      </View>
    </SafeAreaInsetsContext.Provider>
  );
}
