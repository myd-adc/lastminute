import { Tabs, useSegments } from 'expo-router';

import { GlassTabBar, type TabKey } from '@/components/GlassTabBar';
import { WebShell } from '@/components/WebShell';
import { useIsWide } from '@/lib/hooks';
import { colors } from '@/theme';

const tabOf = (segment: string | undefined): TabKey =>
  segment === 'matches' ? 'matches' : segment === 'profile' ? 'profile' : 'events';

export default function TabsLayout() {
  const segments = useSegments();
  const wide = useIsWide();
  const active = tabOf(segments[1]);

  const tabsNav = (
    <Tabs
      tabBar={() => (wide ? null : <GlassTabBar active={active} />)}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.grouped } }}
    >
      <Tabs.Screen name="(events)" options={{ title: 'Події' }} />
      <Tabs.Screen name="matches" options={{ title: 'Збіги' }} />
      <Tabs.Screen name="profile" options={{ title: 'Я' }} />
    </Tabs>
  );

  return wide ? <WebShell active={active}>{tabsNav}</WebShell> : tabsNav;
}
