import { router, useFocusEffect } from 'expo-router';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bookmark, ChevronDown, ChevronUp, Lock, Send, X, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Avatar, AvatarStack, Button, IconButton, Pill } from '@/components/ui';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { acquaintances, attendeesFor, goingCount, nextOnScene, soloCount } from '@/lib/selectors';
import { going as goingLabel, whenLabel } from '@/lib/time';
import { display, onest, type, useTheme } from '@/theme';

import { DateTile } from './DateTile';
import { EndOfFeed } from './EndOfFeed';
import { FeedTabs } from './FeedTabs';
import { priceLabel, sceneName } from './format';
import { PosterArt } from './PosterArt';
import { useToast } from './Toast';
import { useFeed } from './useFeed';

const PANEL = 440;
const WHITE = '#F6F5F2';

// W03 wide-web feed: one centred poster card with arrows + keyboard, and «Who is going» on the right.
export function WideFeed() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const light = scheme === 'light';
  const accentText = light ? '#5A7A00' : c.accent;
  const { height: winH } = useWindowDimensions();
  const toast = useToast(40);
  const { state, now, feed, scene, previews, handlers, setTab } = useFeed(toast.show);
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, feed.length - 1));
  const event: Event | undefined = feed[i];
  const sceneLabel = scene ? t('feed.tabs.myScene', { scene: scene.name }) : t('common.myScene');

  const cardH = Math.max(480, Math.min(700, winH - 190));
  const cardW = Math.round(cardH * 0.63);

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

  const tabs = <FeedTabs
      value={state.feedTab}
      onChange={(tab) => {
        setIndex(0);
        setTab(tab);
      }}
      sceneLabel={sceneLabel}
      showSaved
    />;

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

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View ref={centre} style={styles.centre}>
        <View style={styles.tabs}>{tabs}</View>
        <View style={styles.stage}>
          <View style={{ width: cardW, height: cardH }}>
            <Pressable onPress={() => handlers.onOpen(event.id)} style={[styles.card, { width: cardW, height: cardH }]}>
              <PosterArt event={event} width={cardW} height={cardH} scrimFrom={0.4} />
            </Pressable>
            <View style={styles.cardBody}>
              <Pressable onPress={() => handlers.onOpen(event.id)} style={{ gap: 12 }}>
                <View style={styles.pills}>
                  <Pill label={whenLabel(event.startsAt, now)} tone="accent" />
                  <Pill label={event.venue} tone="glass" />
                  <Pill label={priceLabel(event)} tone="glass" />
                </View>
                <Text style={[display(28, 32), { color: light ? c.text : WHITE }]} numberOfLines={3}>
                  {event.title}
                </Text>
                <Text style={[type.subhead, { color: light ? c.text : 'rgba(246,245,242,0.72)' }]} numberOfLines={2}>
                  {event.description}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <IconButton icon={X} size={52} variant={light ? 'surface' : 'glass'} accessibilityLabel={t('feed.wide.skip')} onPress={() => handlers.onSkip(event.id)} />
                <Button label={t('common.imGoing')} onPress={() => handlers.onGo(event.id)} style={styles.go} />
              </View>
            </View>
          </View>

          <View style={[styles.rail, { height: cardH }]}>
            <View style={styles.railGroup}>
              <IconButton icon={ChevronUp} size={44} accessibilityLabel={t('feed.wide.prev')} onPress={() => step(-1)} />
              <Text style={[onest('medium', 12), { color: c.muted }]}>
                {i + 1} / {feed.length}
              </Text>
              <IconButton icon={ChevronDown} size={44} accessibilityLabel={t('feed.wide.next')} onPress={() => step(1)} />
            </View>
            <View style={styles.railGroup}>
              <IconButton icon={Bookmark} size={44} active={saved} label={saved ? t('common.saved') : t('common.save')} onPress={() => handlers.onSave(event.id)} />
              <IconButton icon={Send} size={44} label={t('feed.share')} onPress={() => handlers.onShare(event)} />
            </View>
          </View>
        </View>

        <View style={styles.hints}>
          <Hint icons={[ArrowUp, ArrowDown]} label={t('feed.wide.hintScroll')} />
          <Hint icons={[ArrowRight]} label={t('feed.wide.hintGo')} />
          <Hint icons={[ArrowLeft]} label={t('feed.wide.hintSkip')} />
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
    const next = nextOnScene(state, now, e.id).slice(0, 3);
    return (
      <ScrollView style={[styles.panel, { borderLeftColor: c.line }]} contentContainerStyle={styles.panelContent}>
        <View style={styles.panelHead}>
          <Text style={[onest('bold', 20), { color: c.text }]}>{t('feed.wide.whoFrom', { scene: sceneName(e) })}</Text>
          <Pill label={String(n)} />
        </View>
        <View style={[styles.summary, { backgroundColor: c.surface }]}>
          <AvatarStack people={preview} size={32} extra={Math.max(0, n - preview.length)} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.bodyStrong, { color: c.text }]}>
              {t('feed.wide.soloGoing', { count: solo })}
            </Text>
            {known > 0 && (
              <Text style={[type.footnote, { color: accentText }]}>
                {t('feed.wide.known', { count: known })}
              </Text>
            )}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          {list.map((a) => (
            <View key={a.user.id} style={[styles.person, { backgroundColor: c.surface }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.blur}>
                <Avatar name={a.user.name} gradient={a.user.gradient} size={36} />
              </View>
              <View style={[styles.blur, { flex: 1, gap: 2 }]}>
                <Text style={[type.subheadStrong, { color: c.text }]}>
                  {a.user.name}, {a.user.age}
                </Text>
                <Text style={[type.footnote, { color: c.muted }]}>{a.user.affiliation}</Text>
              </View>
              <View style={[styles.blur, styles.tag, { backgroundColor: c.surface2 }]}>
                <Text style={[onest('medium', 12), { color: c.text }]}>{a.attendance.solo ? t('feed.wide.tagSolo') : t('feed.wide.tagFriends')}</Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable onPress={() => handlers.onGo(e.id)} style={[styles.lock, { borderColor: light ? '#C5E03A' : c.accent }]}>
          <Lock size={20} color={accentText} strokeWidth={2} />
          <Text style={[type.bodyStrong, styles.centerText, { color: c.text }]}>{t('feed.wide.lockTitle')}</Text>
          <Text style={[type.footnote, styles.centerText, { color: c.muted }]}>{t('feed.wide.symmetry')}</Text>
        </Pressable>

        {next.length > 0 && (
          <View style={{ gap: 4, marginTop: 12 }}>
            <Text style={[onest('bold', 18), { color: c.text, marginBottom: 8 }]}>{t('feed.wide.nextOnScene')}</Text>
            {next.map((ne) => (
              <Pressable
                key={ne.id}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: ne.id } })}
                style={({ hovered }: { hovered?: boolean }) => [styles.nextRow, { borderBottomColor: c.line }, hovered && { opacity: 0.8 }]}
              >
                <DateTile iso={ne.startsAt} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: c.text }]} numberOfLines={1}>
                    {ne.title}
                  </Text>
                  <Text style={[type.footnote, { color: c.muted }]}>
                    {goingLabel(goingCount(state, ne))}
                    {state.going[ne.id] ? ` · ${t('common.youreGoing')}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }
}

function Hint({ icons, label }: { icons: LucideIcon[]; label: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.hint}>
      <View style={[styles.key, { borderColor: c.line }]}>
        {icons.map((I, k) => (
          <I key={k} size={12} color={c.text} strokeWidth={2.5} />
        ))}
      </View>
      <Text style={[type.footnote, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  endContent: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  centre: { flex: 1, paddingTop: 40, paddingBottom: 24, paddingHorizontal: 40, gap: 24 },
  tabs: { alignSelf: 'flex-start' },
  stage: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 20, paddingLeft: 64 },
  card: { position: 'absolute', borderRadius: 28, overflow: 'hidden' },
  cardBody: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22, gap: 16 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  go: { flex: 1, height: 52, borderRadius: 26 },
  rail: { width: 64, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  railGroup: { alignItems: 'center', gap: 12 },
  hints: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  key: { flexDirection: 'row', gap: 2, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 },
  panel: { width: PANEL, flexGrow: 0, borderLeftWidth: 1 },
  panelContent: { padding: 28, gap: 14 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 },
  blur: { filter: 'blur(6px)', opacity: 0.8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  lock: { alignItems: 'center', gap: 8, padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed' },
  centerText: { textAlign: 'center' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1 },
});
