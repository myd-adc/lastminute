import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Compass, MessageSquare, User, Users, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t, useT, type TKey } from '@/i18n';
import { tabBarBottom } from '@/lib/layout';
import { ms, ND } from '@/lib/motion';
import { useTheme } from '@/theme';

export type TabKey = 'events' | 'communities' | 'chats' | 'me';

export const tabs: { key: TabKey; labelKey: TKey; icon: LucideIcon; href: '/' | '/communities' | '/chats' | '/me' }[] = [
  { key: 'events', labelKey: 'common.tabs.events', icon: Compass, href: '/' },
  { key: 'communities', labelKey: 'common.tabs.communities', icon: Users, href: '/communities' },
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
  const index = Math.max(0, tabs.findIndex((t) => t.key === active));
  const [x] = useState(() => new Animated.Value(index * STEP));
  const [stretch] = useState(() => new Animated.Value(1));
  const first = useRef(true);
  // The active blob flows to the new tab: a spring for the move, a brief horizontal stretch while it travels.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.parallel([
      Animated.spring(x, { toValue: index * STEP, useNativeDriver: ND, friction: 8, tension: 90, restSpeedThreshold: 0.5 }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1.18, duration: ms(110), useNativeDriver: ND }),
        Animated.spring(stretch, { toValue: 1, useNativeDriver: ND, friction: 5, tension: 120 }),
      ]),
    ]).start();
  }, [index, x, stretch]);
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
          <Animated.View
            style={[
              styles.tab,
              styles.blob,
              {
                backgroundColor: lightMode ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.16)',
                borderColor: lightMode ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                transform: [{ translateX: x }, { scaleX: stretch }],
              },
            ]}
          />
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
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <Icon size={24} color={iconColor} strokeWidth={2} />
                {t.key === 'chats' && unread && <View style={[styles.dot, { backgroundColor: c.accentInk }]} />}
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

// 296 pt bar, 1 pt border, 6 pt padding: four 68 pt tabs share the 282 pt inside.
const PAD = 6;
const TAB = 68;
const GAP = (296 - 2 - PAD * 2 - TAB * 4) / 3;
const STEP = TAB + GAP;

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
    gap: GAP,
    paddingHorizontal: PAD,
  },
  tab: { width: TAB, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', left: PAD, top: (64 - 2 - 52) / 2, borderWidth: 1 },
  pressed: { transform: [{ scale: 0.88 }] },
  dot: { position: 'absolute', top: 12, right: 18, width: 8, height: 8, borderRadius: 4 },
});
