import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Compass, MessageSquare, User, Users, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t, useT, type TKey } from '@/i18n';
import { tabBarBottom } from '@/lib/layout';
import { useTheme } from '@/theme';

export type TabKey = 'events' | 'scene' | 'chats' | 'me';

export const tabs: { key: TabKey; labelKey: TKey; icon: LucideIcon; href: '/' | '/scene' | '/chats' | '/me' }[] = [
  { key: 'events', labelKey: 'common.tabs.events', icon: Compass, href: '/' },
  { key: 'scene', labelKey: 'common.tabs.scene', icon: Users, href: '/scene' },
  { key: 'chats', labelKey: 'common.tabs.chats', icon: MessageSquare, href: '/chats' },
  { key: 'me', labelKey: 'common.tabs.profile', icon: User, href: '/me' },
];

export const tabLabel = (tab: (typeof tabs)[number]) => t(tab.labelKey);

// Figma «TabBar · Glass»: floating liquid-glass pill, icons only, centred 24 pt above the home indicator.
export function GlassTabBar({ active, unread }: { active: TabKey; unread?: boolean }) {
  const { c, scheme } = useTheme();
  useT(); // re-render on language change
  const insets = useSafeAreaInsets();
  const lightMode = scheme === 'light';
  return (
    <View style={[styles.wrap, { bottom: tabBarBottom(insets.bottom) }]}>
      <View style={[styles.shadow, { boxShadow: lightMode ? '0px 12px 16px rgba(10,10,15,0.16)' : '0px 12px 16px rgba(10,10,15,0.45)' }]}>
        <BlurView
          intensity={30}
          tint={lightMode ? 'light' : 'dark'}
          style={[
            styles.bar,
            {
              backgroundColor: lightMode ? 'rgba(255,255,255,0.5)' : 'rgba(36,36,46,0.42)',
              borderColor: lightMode ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.38)',
            },
          ]}
        >
          {tabs.map((t) => {
            const on = t.key === active;
            const Icon = t.icon;
            const iconColor = on ? (lightMode ? c.text : c.accent) : lightMode ? 'rgba(11,11,16,0.6)' : 'rgba(246,245,242,0.72)';
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityLabel={tabLabel(t)}
                accessibilityState={{ selected: on }}
                onPress={() => router.navigate(t.href)}
                style={[
                  styles.tab,
                  on && {
                    backgroundColor: lightMode ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.16)',
                    borderWidth: 1,
                    borderColor: lightMode ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  },
                ]}
              >
                <Icon size={24} color={iconColor} strokeWidth={2} />
                {t.key === 'chats' && unread && <View style={[styles.dot, { backgroundColor: lightMode ? '#5A7A00' : c.accent }]} />}
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
  shadow: { borderRadius: 32 },
  bar: {
    width: 296,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tab: { width: 68, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 12, right: 18, width: 8, height: 8, borderRadius: 4 },
});
