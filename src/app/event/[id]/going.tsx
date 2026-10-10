import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { shortTitle } from '@/components/feed/format';
import { addToCalendar } from '@/components/feed/share';
import { useToast } from '@/components/feed/Toast';
import { AvatarStack, Button, Checkbox, Screen } from '@/components/ui';
import { getEvent, soloGroups } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { acquaintances, goingCount, soloCount, soloGroupMembers } from '@/lib/selectors';
import { time } from '@/lib/time';
import { useStore, type Going } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

// Soft lime (top-left) and violet (right) glows behind M08.
function Glow() {
  const { scheme } = useTheme();
  const lime = scheme === 'light' ? 0.85 : 0.28;
  const violet = scheme === 'light' ? 0.9 : 0.45;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="lime" cx="10%" cy="12%" r="55%">
          <Stop offset="0" stopColor="#D7FF3B" stopOpacity={lime} />
          <Stop offset="1" stopColor="#D7FF3B" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="violet" cx="95%" cy="32%" r="55%">
          <Stop offset="0" stopColor="#7C5CFF" stopOpacity={violet} />
          <Stop offset="1" stopColor="#7C5CFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#lime)" />
      <Rect width="100%" height="100%" fill="url(#violet)" />
    </Svg>
  );
}

// M08 «You’re going»: confirmation, how the user goes (solo / with someone) and the «Solo at …» group.
export default function GoingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(id ?? '');
  const { c } = useTheme();
  const { t } = useT();
  if (!event) {
    return (
      <Screen>
        <Text style={[type.title2, { color: c.text }]}>{t('feed.details.notFound')}</Text>
        <Button label={t('feed.backToFeed')} onPress={() => router.replace('/')} />
      </Screen>
    );
  }
  return <GoingView event={event} />;
}

function GoingView({ event }: { event: Event }) {
  const { c, scheme } = useTheme();
  const { state, dispatch } = useStore();
  const { t } = useT();
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const toast = useToast(140);
  const g = state.going[event.id];
  const title = shortTitle(event);
  const members = soloGroupMembers(state, event.id);
  const group = soloGroups[event.id];
  const opensAt = group?.opensAt ?? time(new Date(Date.parse(event.startsAt) - 3 * 3600000).toISOString());
  const accentText = scheme === 'light' ? '#5A7A00' : c.accent;

  const setGoing = (patch: Partial<Going>) => dispatch({ type: 'setGoing', eventId: event.id, patch });
  const calendar = () =>
    addToCalendar(event).then((r) => {
      if (r === 'failed') toast.show(t('feed.toast.calendarFailed'));
      else if (r === 'shared' && Platform.OS === 'web') toast.show(t('feed.toast.icsDownloaded'));
    });
  const leave = () => {
    dispatch({ type: 'leave', eventId: event.id });
    router.replace('/');
  };

  if (!g) {
    return (
      <Screen contentStyle={styles.narrow}>
        <Text style={[type.title2, { color: c.text }]}>{t('feed.going.notGoing', { title })}</Text>
        <Button label={t('common.imGoing')} onPress={() => dispatch({ type: 'go', eventId: event.id })} />
        <Button variant="secondary" label={t('feed.backToFeed')} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const stats = [
    { n: goingCount(state, event), label: t('feed.going.statGoing'), accent: false },
    { n: soloCount(state, event), label: t('feed.going.statSolo'), accent: true },
    { n: acquaintances(state, event.id).length, label: t('feed.going.statKnown'), accent: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Glow />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: wide ? 32 : insets.top + 8 }]}>
        <View style={[styles.narrow, styles.body]}>
        <View style={[styles.hero, wide && { marginTop: 24 }]}>
          <View style={[styles.check, { backgroundColor: c.accent }]}>
            <Check size={36} color={c.onAccent} strokeWidth={2.5} />
          </View>
          <Text style={[display(26, 31), styles.center, { color: c.text }]}>
            {t('feed.going.title', { title })}
          </Text>
          <Text style={[type.body, styles.center, { color: c.muted }]}>{t('feed.going.sub')}</Text>
        </View>

        <View style={[styles.stats, { backgroundColor: c.surface, borderColor: scheme === 'light' ? c.surface : c.line }]}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[display(26, 32), { color: s.accent ? accentText : c.text }]}>{s.n}</Text>
              <Text style={[type.footnote, { color: c.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[type.bodyStrong, { color: c.text }]}>{t('feed.going.question')}</Text>
        <View style={styles.toggles}>
          {(
            [
              { key: 'solo', label: t('feed.details.solo2') },
              { key: 'friends', label: t('feed.details.withSomeone') },
            ] as const
          ).map((o) => {
            const on = g.with === o.key;
            return (
              <Pressable
                key={o.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setGoing({ with: o.key })}
                style={[styles.toggle, on ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }]}
              >
                <Text style={[onest('semibold', 16), { color: on ? c.onAccent : c.text }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {g.with === 'solo' && (
          <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.accent }]}>
            <View style={styles.groupHead}>
              {members.length > 0 && <AvatarStack people={members.slice(0, 4).map((u) => ({ name: u.name, gradient: u.gradient }))} size={30} />}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.bodyStrong, { color: c.text }]}>{t('feed.going.groupTitle', { title })}</Text>
                <Text style={[type.footnote, { color: c.muted }]}>
                  {t('feed.going.opensAt', {
                    members: members.length ? t('feed.details.inGroup', { count: members.length }) : t('feed.details.firstInGroup'),
                    time: opensAt,
                  })}
                </Text>
              </View>
            </View>
            <Checkbox checked={g.joinSoloGroup} onChange={(v) => setGoing({ joinSoloGroup: v })} label={t('feed.going.addMe')} />
          </View>
        )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: wide ? 32 : footerBottom(insets.bottom) }]}>
          <View style={[styles.narrow, { gap: 14 }]}>
            <Button
              label={t('feed.going.seeWho')}
              style={{ height: 60, borderRadius: 30 }}
              onPress={() => router.replace({ pathname: '/event/[id]/room', params: { id: event.id } })}
            />
            <View style={styles.links}>
              <Pressable accessibilityRole="button" onPress={calendar} hitSlop={8} style={styles.link}>
                <CalendarDays size={18} color={c.text} strokeWidth={2} />
                <Text style={[onest('semibold', 14), { color: c.text }]}>{t('feed.going.calendar')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={leave} hitSlop={8}>
                <Text style={[onest('semibold', 14), { color: c.muted }]}>{t('feed.going.cancel')}</Text>
              </Pressable>
            </View>
          </View>
      </View>
      {toast.node}
    </View>
  );
}

const styles = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  body: { gap: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  hero: { alignItems: 'center', gap: 12, marginTop: 12 },
  check: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { textAlign: 'center' },
  stats: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  toggles: { flexDirection: 'row', gap: 10, marginTop: -6 },
  toggle: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  group: { borderWidth: 1.5, borderRadius: 20, padding: 16, gap: 14 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
