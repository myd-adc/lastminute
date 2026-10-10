import { Stack } from 'expo-router';

import { useIsWide } from '@/lib/layout';
import { useTheme } from '@/theme';

// M01 → M02 → M03 → M04 → M05. `login` is the entry; each step pushes the next one.
export const unstable_settings = { initialRouteName: 'login' };

export default function AuthLayout() {
  const { c } = useTheme();
  const wide = useIsWide();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: wide ? 'none' : 'default' }} />;
}
