import { Tabs, usePathname } from 'expo-router';

import { activeTabFor, GlassTabBar } from '@/components/ui';
import { useIsWide } from '@/lib/layout';
import { unreadCount } from '@/lib/selectors';
import { useNow, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme';

// Four tabs (Події · Сцена · Чати · Профіль). Phone: floating glass bar; wide web: the WebShell sidebar instead.
export default function TabsLayout() {
  const { c } = useTheme();
  const { state } = useStore();
  const now = useNow();
  const wide = useIsWide();
  const active = activeTabFor(usePathname());
  const unread = unreadCount(state, now) > 0;

  return (
    <Tabs
      tabBar={() => (wide ? null : <GlassTabBar active={active} unread={unread} />)}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Події' }} />
      <Tabs.Screen name="scene" options={{ title: 'Сцена' }} />
      <Tabs.Screen name="chats" options={{ title: 'Чати' }} />
      <Tabs.Screen name="me" options={{ title: 'Профіль' }} />
    </Tabs>
  );
}
