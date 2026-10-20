import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shortTitle } from '@/components/feed/format';
import { Glows, type GlowSpec } from '@/components/feed/Glow';
import { addToCalendar } from '@/components/feed/share';
import { useToast } from '@/components/feed/Toast';
import { AvatarStack, Button, Chip, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent, soloGroups } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { acquaintances, goingCount, soloCount, soloGroupMembers } from '@/lib/selectors';
import { time } from '@/lib/time';
import { useStore, type Going } from '@/store/AppStore';
import { display, onest, type, useTheme, type Scheme } from '@/theme';

// M08 glows: lime Ø280 at (-60, 40) and violet Ø260 at (180, 120), layer blur 45 (violet is #6847FF in light).
const glows = (scheme: Scheme): GlowSpec[] => [
  { x: 80, y: 180, r: 140, color: '#D7FF3B', opacity: 0.25, blur: 45 },
  { x: 310, y: 250, r: 130, color: scheme === 'light' ? '#6847FF' : '#7C5CFF', opacity: 0.45, blur: 45 },
];

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
        <Button label={t('feed.backToFeed')} onPress={() => router.replace('/')} style={styles.cta} />
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
  const { width } = useWindowDimensions();
  const toast = useToast(140);
  const g = state.going[event.id];
  const title = shortTitle(event);
  const members = soloGroupMembers(state, event.id);
  const group = soloGroups[event.id];
  const opensAt = group?.opensAt ?? time(new Date(Date.parse(event.startsAt) - 3 * 3600000).toISOString());

  const setGoing = (patch: Partial<Going>) => dispatch({ type: 'setGoing', eventId: event.id, patch });
  const calendar = () =>
    addToCalendar(event).then((r) => {
      if (r === 'failed') toast.show(t('feed.toast.calendarFailed'));
      else if (r === 'shared' && Platform.OS === 'web') toast.show(t('feed.toast.icsDownloaded'));
    });
  if (!g) {
    return (
      <Screen contentStyle={styles.narrow}>
        <Text style={[type.title2, { color: c.text }]}>{t('feed.going.notGoing', { title })}</Text>
        <Button label={t('common.imGoing')} onPress={() => dispatch({ type: 'go', eventId: event.id })} style={styles.cta} />
        <Button variant="secondary" label={t('feed.backToFeed')} onPress={() => router.replace('/')} style={styles.cta} />
      </Screen>
    );
  }

  const goingN = goingCount(state, event);
  const knownN = acquaintances(state, event.id).length;
  const stats = [
    { n: goingN, label: t('feed.going.statGoing', { count: goingN }), accent: false },
    { n: soloCount(state, event), label: t('feed.going.statSolo'), accent: true },
    { n: knownN, label: t('feed.going.statKnown', { count: knownN }), accent: false },
  ];
  const top = wide ? 32 : insets.top;

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <Glows glows={glows(scheme)} left={Math.max(0, (width - 390) / 2)} top={top - 50} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: top + 10 }]}>
        <View style={[styles.narrow, styles.body]}>
          <View style={[styles.check, { backgroundColor: c.accent }]}>
            <Check size={32} color={c.onAccent} strokeWidth={2.5} />
          </View>
          <Text style={[display(24, 28), styles.center, { color: c.text }]}>{t('feed.going.title', { title })}</Text>
          <Text style={[onest('regular', 15, 21), styles.center, { color: c.muted }]}>{t('feed.going.sub')}</Text>

          <View style={[styles.stats, { backgroundColor: c.surface }]}>
            {stats.map((st) => (
              <View key={st.label} style={styles.stat}>
                <Text style={[display(24, 30), { letterSpacing: 0, color: st.accent ? c.accentInk : c.text }]}>{st.n}</Text>
                <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.choice}>
            <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{t('feed.going.question')}</Text>
            <View style={styles.toggles}>
              {(
                [
                  { key: 'solo', label: t('feed.details.solo2') },
                  { key: 'friends', label: t('feed.details.withSomeone') },
                ] as const
              ).map((o) => (
                <Chip key={o.key} label={o.label} selected={g.with === o.key} onPress={() => setGoing({ with: o.key })} style={styles.flex} />
              ))}
            </View>
          </View>

          {g.with === 'solo' && (
            <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.accent }]}>
              <View style={styles.groupHead}>
                {members.length > 0 && <AvatarStack people={members.slice(0, 4).map((u) => ({ name: u.name, gradient: u.gradient, photoUri: u.photoUri }))} size={30} />}
                <View style={styles.groupText}>
                  <Text style={[onest('bold', 15, 19), { color: c.text }]}>{t('feed.going.groupTitle', { title })}</Text>
                  <Text style={[onest('regular', 12, 15), { color: c.muted }]}>
                    {t('feed.going.opensAt', {
                      members: members.length ? t('feed.details.inGroup', { count: members.length }) : t('feed.details.firstInGroup'),
                      time: opensAt,
                    })}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                aria-checked={g.joinSoloGroup}
                onPress={() => setGoing({ joinSoloGroup: !g.joinSoloGroup })}
                hitSlop={8}
                style={styles.checkRow}
              >
                <View style={[styles.box, g.joinSoloGroup ? { backgroundColor: c.accent } : { borderWidth: 1.5, borderColor: c.line }]}>
                  {g.joinSoloGroup && <Check size={14} color={c.onAccent} strokeWidth={3} />}
                </View>
                <Text style={[onest('semibold', 13, 17), { color: c.text }]}>{t('feed.going.addMe')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Frame: CTA block ends 104 pt above the screen bottom (66 pt above the usual pinned-footer line). */}
      <View style={[styles.footer, { paddingBottom: wide ? 32 : footerBottom(insets.bottom) + 66 }]}>
        <View style={[styles.narrow, styles.footerInner]}>
          <Button label={t('feed.going.seeWho')} onPress={() => router.replace({ pathname: '/event/[id]/room', params: { id: event.id } })} />
          <View style={styles.links}>
            <Pressable accessibilityRole="button" onPress={calendar} hitSlop={8} style={styles.link}>
              <CalendarDays size={16} color={c.text} strokeWidth={2} />
              <Text style={[onest('semibold', 14, 18), { color: c.text }]}>{t('feed.going.calendar')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {toast.node}
    </View>
  );
}

// Figma M08: 64 pt check 10 pt under the status bar, content column (gap 10) 16 pt under it, +4 pt before the stats.
const styles = StyleSheet.create({
  flex: { flex: 1 },
  narrow: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  // A lone CTA on an error screen reads as a banner when it spans the whole column.
  cta: { alignSelf: 'flex-start', paddingHorizontal: 32 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  body: { gap: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  footerInner: { gap: 10 },
  check: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6 },
  center: { textAlign: 'center' },
  stats: { flexDirection: 'row', borderRadius: 18, paddingVertical: 14, marginTop: 4 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  choice: { gap: 10 },
  toggles: { flexDirection: 'row', gap: 8 },
  group: { borderWidth: 1.5, borderRadius: 18, padding: 14, gap: 10 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupText: { flex: 1, gap: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
