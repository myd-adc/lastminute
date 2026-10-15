import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { CalendarPlus, Compass, MessageSquare, Plus, User, Users, UsersRound, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t, useT, type TKey } from '@/i18n';
import { tabBarBottom } from '@/lib/layout';
import { ms, ND } from '@/lib/motion';
import { onest, useTheme } from '@/theme';

import { Sheet } from './Sheet';
import { Text } from './Text';

export type TabKey = 'events' | 'communities' | 'chats' | 'me';

export const tabs: { key: TabKey; labelKey: TKey; icon: LucideIcon; href: '/' | '/communities' | '/chats' | '/me' }[] = [
  { key: 'events', labelKey: 'common.tabs.events', icon: Compass, href: '/' },
  { key: 'communities', labelKey: 'common.tabs.communities', icon: Users, href: '/communities' },
  { key: 'chats', labelKey: 'common.tabs.chats', icon: MessageSquare, href: '/chats' },
  { key: 'me', labelKey: 'common.tabs.profile', icon: User, href: '/me' },
];

export const tabLabel = (tab: (typeof tabs)[number]) => t(tab.labelKey);

// The «+» sits in the middle of the bar, between the two pairs of tabs. It is a slot, not a destination:
// the sliding blob skips it and it opens a sheet instead of navigating.
const SLOTS: (TabKey | 'add')[] = ['events', 'communities', 'add', 'chats', 'me'];

// Figma «TabBar · Glass»: floating liquid-glass pill, icons only, centred 24 pt above the home indicator.
export function GlassTabBar({ active, unread }: { active: TabKey; unread?: boolean }) {
  const { c, scheme } = useTheme();
  useT(); // re-render on language change
  const insets = useSafeAreaInsets();
  const lightMode = scheme === 'light';
  const [adding, setAdding] = useState(false);
  const index = Math.max(0, SLOTS.indexOf(active));
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
          {/* A tablist may only hold tabs, so the «+» is placed over the middle slot from outside the list. */}
          <View style={styles.tabs} accessibilityRole="tablist">
          {SLOTS.map((slot) => {
            if (slot === 'add') return <View key="add" style={styles.tab} aria-hidden />;
            const tab = tabs.find((x) => x.key === slot)!;
            const on = tab.key === active;
            const Icon = tab.icon;
            const iconColor = on ? (lightMode ? c.text : c.accent) : lightMode ? 'rgba(11,11,16,0.6)' : 'rgba(246,245,242,0.72)';
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={tabLabel(tab)}
                aria-selected={on}
                onPress={() => router.navigate(tab.href)}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <Icon size={24} color={iconColor} strokeWidth={2} />
                {tab.key === 'chats' && unread && <View style={[styles.dot, { backgroundColor: c.accentInk }]} />}
              </Pressable>
            );
          })}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.add.label')}
            aria-expanded={adding}
            onPress={() => setAdding(true)}
            style={({ pressed }) => [styles.tab, styles.addSlot, pressed && styles.pressed]}
          >
            <View style={[styles.add, { backgroundColor: c.accent }]}>
              <Plus size={22} color={c.onAccent} strokeWidth={2.5} />
            </View>
          </Pressable>
        </BlurView>
      </View>
      <CreateSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

// What the «+» offers: an event of your own, or a whole community.
function CreateSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  useT();
  const go = (href: '/event/new' | '/community/new') => {
    onClose();
    router.push(href);
  };
  const row = (icon: LucideIcon, label: string, sub: string, onPress: () => void, last?: boolean) => {
    const Icon = icon;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.line }, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: c.accentSoft }]}>
          <Icon size={20} color={c.accentInk} strokeWidth={2} />
        </View>
        <View style={styles.rowText}>
          <Text style={[onest('semibold', 16, 20), { color: c.text }]}>{label}</Text>
          <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{sub}</Text>
        </View>
      </Pressable>
    );
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={[onest('bold', 20, 25), { color: c.text }]}>{t('common.add.title')}</Text>
      <View style={[styles.rows, { backgroundColor: c.bg }]}>
        {row(CalendarPlus, t('common.add.event'), t('common.add.eventSub'), () => go('/event/new'))}
        {row(UsersRound, t('common.add.community'), t('common.add.communitySub'), () => go('/community/new'), true)}
      </View>
    </Sheet>
  );
}

// 318 pt bar, 1 pt border, 6 pt padding: five 58 pt slots share the 304 pt inside.
const PAD = 6;
const TAB = 58;
const BAR = 318;
const GAP = (BAR - 2 - PAD * 2 - TAB * 5) / 4;
const STEP = TAB + GAP;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'box-none' },
  shadow: { borderRadius: 32 },
  bar: {
    width: BAR,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    paddingHorizontal: PAD,
  },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  tab: { width: TAB, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  addSlot: { position: 'absolute', left: PAD + 2 * (TAB + GAP), top: (64 - 2 - 52) / 2 },
  add: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rows: { borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  blob: { position: 'absolute', left: PAD, top: (64 - 2 - 52) / 2, borderWidth: 1 },
  pressed: { transform: [{ scale: 0.88 }] },
  dot: { position: 'absolute', top: 12, right: 13, width: 8, height: 8, borderRadius: 4 },
});
