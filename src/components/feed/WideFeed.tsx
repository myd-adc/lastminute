import { router, useFocusEffect } from 'expo-router';
import { Bookmark, ChevronDown, ChevronUp, Lock, Send, Users, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Avatar, AvatarStack, Button, IconButton, Pill, prefetchImages, SIDEBAR_WIDTH } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Event } from '@/data/types';
import { genderForms } from '@/lib/genderForms';
import { useT } from '@/i18n';
import { acquaintances, attendeesFor, goingCount, nameAge, nextForYou, soloCount } from '@/lib/selectors';
import { going as goingLabel, whenLabel } from '@/lib/time';
import { easeOut, ms, useSlideIn } from '@/lib/motion';
import { display, fonts, onest, useTheme } from '@/theme';
import { useStore } from '@/store/AppStore';

import { DateTile } from './DateTile';
import { EndOfFeed } from './EndOfFeed';
import { EventQrSheet } from './EventQrSheet';
import { WideFeedSkeleton } from './FeedSkeleton';
import { FEED_TAB_ORDER, FeedTabs } from './FeedTabs';
import { priceLabel } from './format';
import { posterPillBg } from './FeedPage';
import { PosterArt } from './PosterArt';
import { RailButton } from './RailButton';
import { useFeed } from './useFeed';

// W03 numbers: a 440 pt panel beside a 440×720 card. Below ~1400 pt the window cannot hold both at full size,
// so the panel gives way first and the card follows — otherwise the action rail, which hangs off the card's right
// edge, slides out of the middle column and lands on top of the panel.
const PANEL_MAX = 440;
const PANEL_MIN = 320;
// Whether the "Who's going" panel is shown; remembered on this device, so switching tabs does not bring it back.
const PANEL_KEY = 'lastminute:whoPanel';
const readPanel = () => {
  try {
    return globalThis.localStorage?.getItem(PANEL_KEY) !== 'closed';
  } catch {
    return true;
  }
};

const RAIL = 78; // 22 pt gap + 56 pt buttons, mirrored on both sides so the card stays centred

// W03 wide-web feed: one centred poster card with arrows + keyboard, and «Who is going» on the right.
export function WideFeed() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { width: winW, height: winH } = useWindowDimensions();
  const { state, now, feed, previews, handlers, setTab, sharing, closeShare } = useFeed();
  const { loading } = useStore();
  const [index, setIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(readPanel);
  const togglePanel = (open: boolean) => {
    setPanelOpen(open);
    try {
      globalThis.localStorage?.setItem(PANEL_KEY, open ? 'open' : 'closed');
    } catch {}
  };
  const i = Math.min(index, Math.max(0, feed.length - 1));
  const event: Event | undefined = feed[i];
  // The next posters download while this one is on screen.
  useEffect(() => {
    prefetchImages(feed.slice(i, i + 3).map((e) => e.image));
  }, [feed, i]);

  // W03: 440×720 card 92 pt from the top of a 900 pt window, hints 24 pt under it.
  const fullPanelW = Math.round(Math.min(PANEL_MAX, Math.max(PANEL_MIN, (winW - SIDEBAR_WIDTH) * 0.38)));
  const panelW = panelOpen ? fullPanelW : 0;
  const column = winW - SIDEBAR_WIDTH - panelW;
  const byHeight = Math.round((Math.max(480, Math.min(720, winH - 180)) * 440) / 720);
  const cardW = Math.max(240, Math.min(byHeight, column - RAIL * 2 - 24));
  const cardH = Math.round((cardW * 720) / 440);
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

  const slide = useSlideIn(state.feedTab, FEED_TAB_ORDER);

  if (loading) return <WideFeedSkeleton tabs={tabs} cardW={cardW} cardH={cardH} panelW={panelW} />;

  if (!event) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        {/* Same tree as a feed with events (tabs, content, panel in the same places), so switching tabs animates instead of jumping. */}
        <View style={styles.centre}>
          <View style={styles.tabs}>{tabs}</View>
          <Animated.View style={[styles.flex, slide]}>
            <EndOfFeed contentStyle={styles.endContent} />
          </Animated.View>
        </View>
        {/* No event, nobody to show: the panel folds away instead of standing empty. */}
        <SlidePanel visible={false} width={fullPanelW} />
        <EventQrSheet event={sharing} onClose={closeShare} />
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
        <Animated.View style={[styles.stage, slide]}>
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
                  {event.authorId && <Pill label={t('feed.own.byPerson')} tone="surface2" weight="medium" style={glass} />}
                </View>
                <Text style={[display(30, 34), { color: c.text }]} numberOfLines={3}>
                  {event.title}
                </Text>
                <Text style={[onest('regular', 15, 21), { color: c.text }]} numberOfLines={2}>
                  {event.description}
                </Text>
              </Pressable>
              <View style={styles.actions}>
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
              {!panelOpen && (
                <RailButton tone="surface" icon={Users} label={goingN > 0 ? String(goingN) : t('feed.wide.who')} onPress={() => togglePanel(true)} />
              )}
            </View>
          </View>

          <View style={styles.hints}>
            <Hint keys={t('feed.wide.keyScroll')} label={t('feed.wide.hintScroll')} />
            <Hint keys={t('feed.wide.keyGo')} label={t('feed.wide.hintGo')} />
            <Hint keys={t('feed.wide.keySkip')} label={t('feed.wide.hintSkip')} />
          </View>
        </Animated.View>
      </View>

      <SlidePanel visible={panelOpen} width={fullPanelW}>
        {whoPanel(event, goingN, previews[event.id]?.people ?? [])}
      </SlidePanel>
      <EventQrSheet event={sharing} onClose={closeShare} />
    </View>
  );

  function whoPanel(e: Event, n: number, preview: { name: string; gradient: Event['poster']['gradient'] }[]) {
    const solo = soloCount(state, e);
    const known = acquaintances(state, e.id).length;
    const list = attendeesFor(state, e.id).slice(0, 3);
    const next = nextForYou(state, now, e.id).slice(0, 3);
    return (
      <ScrollView style={[styles.panel, { width: fullPanelW, borderLeftColor: c.line }]} contentContainerStyle={styles.panelContent}>
        <View style={styles.panelHead}>
          <Text style={[styles.panelTitle, { color: c.text }]}>{t('feed.wide.who')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('feed.wide.hidePanel')} hitSlop={10} onPress={() => togglePanel(false)}>
            <X size={20} color={c.muted} strokeWidth={2} />
          </Pressable>
        </View>
        {/* No zeros: an empty room reads as an invitation, and "0 going solo" says nothing when nobody is going. */}
        <View style={[styles.summary, { backgroundColor: c.surface }]}>
          {/* Faces only: a lone "+1" bubble just repeats the count written next to it. */}
          {preview.length > 0 && <AvatarStack people={preview} size={36} extra={Math.max(0, n - preview.length)} />}
          <View style={styles.textCol}>
            {n === 0 ? (
              <>
                <Text style={[onest('bold', 15, 19), { color: c.text }]}>{t('feed.card.firstTitle')}</Text>
                <Text style={[onest('medium', 13, 17), { color: c.accentInk }]}>{t('feed.card.firstSub')}</Text>
              </>
            ) : (
              <Text style={[onest('bold', 15, 19), { color: c.text }]}>
                {solo > 0 ? t('feed.wide.soloGoing', { count: solo }) : t('feed.card.going', { count: n })}
              </Text>
            )}
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
        {/* Nothing is hidden while nobody is going, so the "tap to see who" lock would promise an empty list. */}
        {n > 0 && (
          <Pressable onPress={() => handlers.onGo(e.id)} style={[styles.lock, { borderColor: c.accent }]}>
            <Lock size={22} color={c.accentInk} strokeWidth={2} />
            <Text style={[onest('semibold', 15, 19), styles.centerText, { color: c.text }]}>{t('feed.wide.lockTitle')}</Text>
            <Text style={[onest('regular', 13, 17), styles.centerText, { color: c.muted }]}>{t('feed.wide.symmetry')}</Text>
          </Pressable>
        )}

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
                  <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={1}>
                    {[ne.venue, goingCount(state, ne) > 0 ? goingLabel(goingCount(state, ne)) : null, state.going[ne.id] ? t('common.youreGoing') : null]
                      .filter(Boolean)
                      .join(' · ')}
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

// The right-hand panel, opening and folding by width so the feed column glides instead of jumping. While it folds
// it keeps showing what it last held; the content keeps its full width and is clipped, so it never reflows.
function SlidePanel({ visible, width, children }: { visible: boolean; width: number; children?: ReactNode }) {
  const [w] = useState(() => new Animated.Value(visible ? width : 0));
  const [shown, setShown] = useState(visible);
  const [last, setLast] = useState<ReactNode>(children);
  if (visible && children && children !== last) setLast(children);
  if (visible && !shown) setShown(true);
  useEffect(() => {
    Animated.timing(w, { toValue: visible ? width : 0, duration: ms(visible ? 300 : 240), easing: easeOut, useNativeDriver: false }).start(({ finished }) => {
      if (finished && !visible) setShown(false);
    });
  }, [visible, width, w]);
  if (!shown) return null;
  return (
    <Animated.View style={{ width: w, overflow: 'hidden' }}>
      <View style={{ width, flex: 1 }}>{visible ? children : last}</View>
    </Animated.View>
  );
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
  endContent: { paddingTop: 8, paddingBottom: 40, paddingHorizontal: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  centre: { flex: 1, paddingTop: 32, paddingBottom: 24 },
  // Same left padding as the stage, so the tabs sit centred over the card.
  tabs: { alignSelf: 'center', paddingLeft: 12 },
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
  // Fills the SlidePanel's height, so the dividing line runs to the bottom of the window.
  panel: { flex: 1, borderLeftWidth: 1 },
  panelContent: { paddingTop: 32, paddingHorizontal: 28, paddingBottom: 28, gap: 16 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: 18, lineHeight: 22 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  textCol: { flex: 1, gap: 2 },
  locked: { gap: 10 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, filter: 'blur(3.5px)' },
  lock: { alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  centerText: { textAlign: 'center' },
  nextTitle: { fontFamily: fonts.displaySemibold, fontSize: 16, lineHeight: 20, marginTop: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
});
