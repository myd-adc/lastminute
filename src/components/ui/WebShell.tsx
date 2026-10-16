import { router, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getInterest } from '@/data/mock';
import { unreadCount } from '@/lib/selectors';
import { useT } from '@/i18n';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, useTheme } from '@/theme';

import { CreateSheet } from './CreateSheet';
import { tabLabel, tabs, type TabKey } from './GlassTabBar';
import { Text } from './Text';

export const SIDEBAR_WIDTH = 248;

export function activeTabFor(pathname: string): TabKey {
  if (pathname.startsWith('/communit')) return 'communities';
  if (pathname.startsWith('/chats') || pathname.startsWith('/chat') || pathname.startsWith('/match')) return 'chats';
  if (pathname.startsWith('/me') || pathname.startsWith('/settings') || pathname.startsWith('/language') || pathname.startsWith('/blocked') || pathname.startsWith('/edit-profile') || pathname.startsWith('/preferences')) return 'me';
  return 'events';
}

// Figma web frames (W03): 248 pt sidebar — logo, 42 pt nav rows, the interests card at the bottom — around the routed page.
export function WebShell({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const { state } = useStore();
  const { t } = useT();
  const now = useNow();
  const pathname = usePathname();
  const active = activeTabFor(pathname);
  const unread = unreadCount(state, now);
  const myInterests = state.interests.map(getInterest).filter((i) => !!i);
  const [adding, setAdding] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.sidebar, { borderRightColor: c.line, backgroundColor: c.bg }]}>
        <Pressable onPress={() => router.navigate('/')} style={styles.logo}>
          <View style={[styles.logoDot, { backgroundColor: c.accent }]} />
          <Text style={[display(18, 22), { color: c.text }]}>{t('common.appName')}</Text>
        </Pressable>

        {/* Wide web has no glass tab bar, so the «+» from the phone lives at the top of the nav instead. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.add.label')}
          aria-expanded={adding}
          onPress={() => setAdding(true)}
          style={({ hovered }: { hovered?: boolean }) => [styles.create, { backgroundColor: c.accent }, hovered && styles.createHover]}
        >
          <Plus size={18} color={c.onAccent} strokeWidth={2.5} />
          <Text style={[onest('bold', 15), { color: c.onAccent }]}>{t('common.add.label')}</Text>
        </Pressable>

        <View style={styles.navList}>
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
                <Text style={[onest('semibold', 15), { color: on ? c.text : c.muted, flex: 1 }]}>{tabLabel(tab)}</Text>
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
            <Text style={[onest('semibold', 13, 17), { color: c.muted }]}>{t('common.yourPreferences')}</Text>
            <View style={styles.prefChips}>
              {myInterests.slice(0, 4).map((i) => (
                <View key={i.id} style={[styles.prefChip, { backgroundColor: c.surface2 }]}>
                  <Text style={[onest('medium', 13, 17), { color: c.text }]}>
                    {i.emoji} {i.label}
                  </Text>
                </View>
              ))}
              {myInterests.length > 4 && (
                <View style={[styles.prefChip, { backgroundColor: c.surface2 }]}>
                  <Text style={[onest('medium', 13, 17), { color: c.text }]}>+{myInterests.length - 4}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={() => router.push('/preferences')}>
              <Text style={[onest('semibold', 13, 17), { color: c.accentInk }]}>{t('common.change')}</Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={styles.main}>{children}</View>
      <CreateSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: { width: SIDEBAR_WIDTH, borderRightWidth: 1, paddingHorizontal: 20, paddingVertical: 28, gap: 20 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 22, marginLeft: 6, marginBottom: 22 },
  logoDot: { width: 10, height: 10, borderRadius: 5 },
  create: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 22 },
  createHover: { opacity: 0.9 },
  navList: { gap: 6 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 42, paddingHorizontal: 12, borderRadius: 12 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  prefs: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 10 },
  prefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prefChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  main: { flex: 1 },
});
