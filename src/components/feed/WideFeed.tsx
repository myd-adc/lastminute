import { router, useFocusEffect } from 'expo-router';
import { Bookmark, ChevronDown, ChevronUp, Lock, Send, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Avatar, AvatarStack, Button, IconButton, Pill } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Event } from '@/data/types';
import { genderForms } from '@/lib/genderForms';
import { useT } from '@/i18n';
import { acquaintances, attendeesFor, goingCount, nameAge, nextForYou, soloCount } from '@/lib/selectors';
import { going as goingLabel, whenLabel } from '@/lib/time';
import { display, fonts, onest, useTheme } from '@/theme';
import { useStore } from '@/store/AppStore';

import { DateTile } from './DateTile';
import { EndOfFeed } from './EndOfFeed';
import { WideFeedSkeleton } from './FeedSkeleton';
import { FeedTabs } from './FeedTabs';
import { priceLabel } from './format';
import { posterPillBg } from './FeedPage';
import { PosterArt } from './PosterArt';
import { RailButton } from './RailButton';
import { useToast } from './Toast';
import { useFeed } from './useFeed';

const PANEL = 440;

// W03 wide-web feed: one centred poster card with arrows + keyboard, and «Who is going» on the right.
export function WideFeed() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { height: winH } = useWindowDimensions();
  const toast = useToast(40);
  const { state, now, feed, previews, handlers, setTab } = useFeed(toast.show);
  const { loading } = useStore();
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, feed.length - 1));
  const event: Event | undefined = feed[i];

  // W03: 440×720 card 92 pt from the top of a 900 pt window, hints 24 pt under it.
  const cardH = Math.max(480, Math.min(720, winH - 180));
  const cardW = Math.round((cardH * 440) / 720);
  const k = cardH / 720;

  const state$ = useRef({ i, feed });
  useEffect(() => {
    state$.current = { i, feed };
  }, [i, feed]);

  const step = useCallback((d: number) => {
    const { i: cur, feed: list } = state$.current;
    setIndex(Math.max(0, Math.min(list.length - 1, cur + d)));
  }, []);

  const centre = useRef<View>(null);
  useFocusEffect(
    useCallback(() => {
      if (typeof window === 'undefined') return;
      const current = () => state$.current.feed[state$.current.i];
      const onKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        const ev = current();
        if (e.key === 'ArrowDown') step(1);
        else if (e.key === 'ArrowUp') step(-1);
        else if (e.key === 'ArrowRight' && ev) handlers.onGo(ev.id);
        else if (e.key === 'ArrowLeft' && ev) handlers.onSkip(ev.id);
        else return;
        e.preventDefault();
      };
      let lockedUntil = 0;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const ts = Date.now();
        if (ts < lockedUntil || Math.abs(e.deltaY) < 12) return;
        step(e.deltaY > 0 ? 1 : -1);
        lockedUntil = ts + 600;
      };
      const node = centre.current as unknown as HTMLElement | null;
      window.addEventListener('keydown', onKey);
      node?.addEventListener?.('wheel', onWheel, { passive: false });
      return () => {
        window.removeEventListener('keydown', onKey);
        node?.removeEventListener?.('wheel', onWheel);
      };
    }, [handlers, step]),
  );

  const tabs = (
    <FeedTabs
      value={state.feedTab}
      onChange={(tab) => {
        setIndex(0);
        setTab(tab);
      }}
      wide
      savedCount={Object.keys(state.saved).length}
    />
  );

  if (loading) return <WideFeedSkeleton tabs={tabs} cardW={cardW} cardH={cardH} panelW={PANEL} />;

  if (!event) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <EndOfFeed header={tabs} contentStyle={styles.endContent} />
        {toast.node}
      </View>
    );
  }

  const goingN = goingCount(state, event);
  const saved = !!state.saved[event.id];
  const glass = { backgroundColor: posterPillBg(scheme) };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View ref={centre} style={styles.centre}>
        <View style={styles.tabs}>{tabs}</View>
        <View style={styles.stage}>
          <View style={{ width: cardW, height: cardH }}>
            <Pressable onPress={() => handlers.onOpen(event.id)} style={[styles.card, { width: cardW, height: cardH }]}>
              <PosterArt event={event} width={cardW} height={cardH} variant="card" />
            </Pressable>
            <View style={styles.cardBody}>
              <Pressable onPress={() => handlers.onOpen(event.id)} style={styles.info}>
                <View style={styles.pills}>
                  <Pill label={whenLabel(event.startsAt, now)} tone="accent" />
                  <Pill label={event.venue} tone="surface2" weight="medium" style={glass} />
                  <Pill label={priceLabel(event)} tone="surface2" weight="medium" style={glass} />
                </View>
                <Text style={[display(30, 34), { color: c.text }]} numberOfLines={3}>
                  {event.title}
                </Text>
                <Text style={[onest('regular', 15, 21), { color: c.text }]} numberOfLines={2}>
                  {event.description}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <IconButton icon={X} size={56} accessibilityLabel={t('feed.wide.skip')} onPress={() => handlers.onSkip(event.id)} />
                <Button label={t('common.imGoing')} onPress={() => handlers.onGo(event.id)} style={styles.flex} />
              </View>
            </View>

            <View style={[styles.nav, { left: cardW + 22, top: Math.round(88 * k) }]}>
              <IconButton icon={ChevronUp} size={48} accessibilityLabel={t('feed.wide.prev')} onPress={() => step(-1)} />
              <Text style={[onest('semibold', 12, 15), { color: c.muted }]}>
                {i + 1} / {feed.length}
              </Text>
              <IconButton icon={ChevronDown} size={48} accessibilityLabel={t('feed.wide.next')} onPress={() => step(1)} />
            </View>
            <View style={[styles.rail, { left: cardW + 22, bottom: Math.round(144 * k) }]}>
              <RailButton tone="surface" icon={Bookmark} active={saved} label={saved ? t('common.saved') : t('common.save')} onPress={() => handlers.onSave(event.id)} />
              <RailButton tone="surface" icon={Send} label={t('feed.share')} onPress={() => handlers.onShare(event)} />
            </View>
          </View>

          <View style={styles.hints}>
            <Hint keys={t('feed.wide.keyScroll')} label={t('feed.wide.hintScroll')} />
            <Hint keys={t('feed.wide.keyGo')} label={t('feed.wide.hintGo')} />
            <Hint keys={t('feed.wide.keySkip')} label={t('feed.wide.hintSkip')} />
          </View>
        </View>
      </View>

      {whoPanel(event, goingN, previews[event.id]?.people ?? [])}
      {toast.node}
    </View>
  );

  function whoPanel(e: Event, n: number, preview: { name: string; gradient: Event['poster']['gradient'] }[]) {
    const solo = soloCount(state, e);
    const known = acquaintances(state, e.id).length;
    const list = attendeesFor(state, e.id).slice(0, 3);
    const next = nextForYou(state, now, e.id).slice(0, 3);
    return (
      <ScrollView style={[styles.panel, { borderLeftColor: c.line }]} contentContainerStyle={styles.panelContent}>
        <View style={styles.panelHead}>
          <Text style={[styles.panelTitle, { color: c.text }]}>{t('feed.wide.who')}</Text>
          <View style={[styles.count, { backgroundColor: c.surface2 }]}>
            <Text style={[onest('bold', 13, 16), { color: c.text }]}>{n}</Text>
          </View>
        </View>
        <View style={[styles.summary, { backgroundColor: c.surface }]}>
          <AvatarStack people={preview} size={36} extra={Math.max(0, n - preview.length)} />
          <View style={styles.textCol}>
            <Text style={[onest('bold', 15, 19), { color: c.text }]}>{t('feed.wide.soloGoing', { count: solo })}</Text>
            {known > 0 && <Text style={[onest('medium', 13, 17), { color: c.accentInk }]}>{t('feed.wide.known', { count: known })}</Text>}
          </View>
        </View>
        <View style={styles.locked}>
          {list.map((a) => (
            <View
              key={a.user.id}
              style={[styles.person, { backgroundColor: c.surface }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Avatar name={a.user.name} gradient={a.user.gradient} size={36} ring />
              <View style={styles.textCol}>
                <Text style={[onest('semibold', 15, 19), { color: c.text }]}>
                  {nameAge(a.user)}
                </Text>
                <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{a.user.affiliation}</Text>
              </View>
              <Pill label={a.attendance.solo ? t('feed.wide.tagSolo', genderForms(a.user.gender)) : t('feed.wide.tagFriends')} weight="medium" />
            </View>
          ))}
        </View>
        <Pressable onPress={() => handlers.onGo(e.id)} style={[styles.lock, { borderColor: c.accent }]}>
          <Lock size={22} color={c.accentInk} strokeWidth={2} />
          <Text style={[onest('semibold', 15, 19), styles.centerText, { color: c.text }]}>{t('feed.wide.lockTitle')}</Text>
          <Text style={[onest('regular', 13, 17), styles.centerText, { color: c.muted }]}>{t('feed.wide.symmetry')}</Text>
        </Pressable>

        {next.length > 0 && (
          <>
            <Text style={[styles.nextTitle, { color: c.text }]}>{t('feed.wide.nextForYou')}</Text>
            {next.map((ne) => (
              <Pressable
                key={ne.id}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: ne.id } })}
                style={({ hovered }: { hovered?: boolean }) => [styles.nextRow, { borderBottomColor: c.line }, hovered && { opacity: 0.8 }]}
              >
                <DateTile iso={ne.startsAt} />
                <View style={styles.textCol}>
                  <Text style={[onest('semibold', 15, 19), { color: c.text }]} numberOfLines={1}>
                    {ne.title}
                  </Text>
                  <Text style={[onest('regular', 13, 17), { color: c.muted }]}>
                    {goingLabel(goingCount(state, ne))}
                    {state.going[ne.id] ? ` · ${t('common.youreGoing')}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    );
  }
}

function Hint({ keys, label }: { keys: string; label: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.hint}>
      <View style={[styles.key, { borderColor: c.line }]}>
        <Text style={[onest('semibold', 12, 15), { color: c.text }]}>{keys}</Text>
      </View>
      <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  flex: { flex: 1 },
  endContent: { paddingTop: 32, paddingBottom: 40, paddingHorizontal: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  centre: { flex: 1, paddingTop: 32, paddingBottom: 24 },
  tabs: { alignSelf: 'flex-start', marginLeft: 42 },
  // Card is centred in the column (6 pt right of centre in the frame); 29 pt under the tabs.
  stage: { alignItems: 'center', marginTop: 29, paddingLeft: 12 },
  card: { position: 'absolute', borderRadius: 28, overflow: 'hidden' },
  cardBody: { position: 'absolute', left: 24, right: 24, bottom: 26, gap: 12 },
  info: { gap: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nav: { position: 'absolute', width: 56, alignItems: 'center', gap: 10 },
  rail: { position: 'absolute', width: 56, alignItems: 'center', gap: 14 },
  hints: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  key: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  panel: { width: PANEL, flexGrow: 0, borderLeftWidth: 1 },
  panelContent: { paddingTop: 32, paddingHorizontal: 28, paddingBottom: 28, gap: 16 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: 18, lineHeight: 22 },
  count: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  textCol: { flex: 1, gap: 2 },
  locked: { gap: 10 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, filter: 'blur(3.5px)' },
  lock: { alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  centerText: { textAlign: 'center' },
  nextTitle: { fontFamily: fonts.displaySemibold, fontSize: 16, lineHeight: 20, marginTop: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
});
