import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type } from '@/theme';

import { Icon, type IconName } from './Icon';

export type TabKey = 'events' | 'matches' | 'profile';

export const tabs: { key: TabKey; label: string; webLabel: string; icon: IconName; href: '/' | '/matches' | '/profile' }[] = [
  { key: 'events', label: 'Події', webLabel: 'Події', icon: 'calendar', href: '/' },
  { key: 'matches', label: 'Збіги', webLabel: 'Збіги', icon: 'sparkles', href: '/matches' },
  { key: 'profile', label: 'Я', webLabel: 'Профіль', icon: 'person', href: '/profile' },
];

// Floating "TabBarGlass" from the v3 iOS frames.
export function GlassTabBar({ active }: { active: TabKey }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom - 4, 16) }]}>
      <View style={styles.shadow}>
        <BlurView intensity={40} tint="light" style={styles.bar}>
          {tabs.map((t) => {
            const on = t.key === active;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => router.navigate(t.href)}
                style={[styles.tab, on && styles.tabOn]}
              >
                <Icon name={t.icon} size={22} color={on ? colors.tint : colors.label2} />
                <Text style={[type.caption, { color: on ? colors.tint : colors.label2 }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'box-none' },
  shadow: { borderRadius: 31, boxShadow: '0px 10px 14px rgba(0,0,0,0.14)' },
  bar: {
    width: 260,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 22,
  },
  tabOn: { backgroundColor: colors.tintSoft },
});
