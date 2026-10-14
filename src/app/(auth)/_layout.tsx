import { Stack } from 'expo-router';

import { useIsWide } from '@/lib/layout';
import { useTheme } from '@/theme';

// W00 → M01 → M02 → M03 → M04. `welcome` is the entry (it redirects to `login` below wide web); each step pushes the next one.
export const unstable_settings = { initialRouteName: 'welcome' };

export default function AuthLayout() {
  const { c } = useTheme();
  const wide = useIsWide();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: wide ? 'none' : 'default' }} />;
}
