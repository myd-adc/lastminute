import { router, usePathname } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getInterest, getScene } from '@/data/mock';
import { unreadCount } from '@/lib/selectors';
import { useT } from '@/i18n';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

import { Gradient } from './Gradient';
import { tabLabel, tabs, type TabKey } from './GlassTabBar';

export const SIDEBAR_WIDTH = 248;

export function activeTabFor(pathname: string): TabKey {
  if (pathname.startsWith('/scene')) return 'scene';
  if (pathname.startsWith('/chats') || pathname.startsWith('/chat') || pathname.startsWith('/match')) return 'chats';
  if (pathname.startsWith('/me') || pathname.startsWith('/settings') || pathname.startsWith('/blocked') || pathname.startsWith('/edit-profile') || pathname.startsWith('/preferences')) return 'me';
  return 'events';
}

// «Веб» frames: left sidebar (logo, scene switcher, nav, preferences) around the routed page.
export function WebShell({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const { state } = useStore();
  const { t } = useT();
  const now = useNow();
  const pathname = usePathname();
  const active = activeTabFor(pathname);
  const unread = unreadCount(state, now);
  const scene = state.sceneId ? getScene(state.sceneId) : null;
  const myInterests = state.interests.map(getInterest).filter((i) => !!i);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.sidebar, { borderRightColor: c.line, backgroundColor: c.bg }]}>
        <Pressable onPress={() => router.navigate('/')} style={styles.logo}>
          <View style={[styles.logoDot, { backgroundColor: c.accent }]} />
          <Text style={[onest('bold', 18), { color: c.text }]}>{t('common.appName')}</Text>
        </Pressable>

        {scene && (
          <Pressable onPress={() => router.push('/preferences')} style={[styles.scene, { backgroundColor: c.surface }]}>
            <Gradient id={scene.gradient} style={styles.sceneDot} />
            <View style={{ flex: 1 }}>
              <Text style={[type.caption, { color: c.muted }]}>{t('common.myScene')}</Text>
              <Text style={[type.subheadStrong, { color: c.text }]} numberOfLines={1}>
                {scene.name}
              </Text>
            </View>
            <ChevronDown size={18} color={c.muted} />
          </Pressable>
        )}

        <View style={{ gap: 4 }}>
          {tabs.map((tab) => {
            const on = tab.key === active;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.key}
                onPress={() => router.navigate(tab.href)}
                style={({ hovered }: { hovered?: boolean }) => [styles.nav, (on || hovered) && { backgroundColor: c.surface }]}
              >
                <Icon size={20} color={on ? c.accentInk : c.muted} strokeWidth={2} />
                <Text style={[onest(on ? 'semibold' : 'medium', 15), { color: on ? c.text : c.muted, flex: 1 }]}>{tabLabel(tab)}</Text>
                {tab.key === 'chats' && unread > 0 && (
                  <View style={[styles.badge, { backgroundColor: c.accent }]}>
                    <Text style={[onest('bold', 12), { color: c.onAccent }]}>{unread}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {myInterests.length > 0 && (
          <View style={[styles.prefs, { borderColor: c.line, backgroundColor: c.bg }]}>
            <Text style={[type.caption, { color: c.muted }]}>{t('common.yourPreferences')}</Text>
            <View style={styles.prefChips}>
              {myInterests.slice(0, 4).map((i) => (
                <View key={i.id} style={[styles.prefChip, { backgroundColor: c.surface2 }]}>
                  <Text style={[onest('medium', 12), { color: c.text }]}>
                    {i.emoji} {i.label}
                  </Text>
                </View>
              ))}
              {myInterests.length > 4 && (
                <View style={[styles.prefChip, { backgroundColor: c.surface2 }]}>
                  <Text style={[onest('medium', 12), { color: c.text }]}>+{myInterests.length - 4}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={() => router.push('/preferences')}>
              <Text style={[onest('semibold', 13), { color: c.accentInk }]}>{t('common.change')}</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={styles.main}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: { width: SIDEBAR_WIDTH, borderRightWidth: 1, paddingHorizontal: 20, paddingVertical: 28, gap: 20 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: { width: 8, height: 8, borderRadius: 4 },
  scene: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  sceneDot: { width: 28, height: 28, borderRadius: 14 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40, paddingHorizontal: 12, borderRadius: 12 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  prefs: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  prefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prefChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  main: { flex: 1 },
});
