import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Deep links (QR → /event/<id>) still get the events list underneath for "back".
export const unstable_settings = { initialRouteName: 'index' };

export default function EventsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.grouped } }} />;
}
