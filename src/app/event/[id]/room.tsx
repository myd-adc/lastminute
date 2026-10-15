import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeaveEventLink, LeaveEventSheet } from '@/components/feed/LeaveEvent';
import { useToast } from '@/components/feed/Toast';
import { CardDeck, type Choice, type DeckHandle } from '@/components/room/CardDeck';
import { RoomSkeleton } from '@/components/skeletons/ListSkeletons';
import { RoomMatchesPanel } from '@/components/room/RoomMatchesPanel';
import { KeyboardHints, RoomActions, RoomDone, RoomFootnote, RoomLocked, RoomTabs } from '@/components/room/RoomParts';
import { venueShort } from '@/components/room/text';
import { Button, Gradient, Header, IconButton, Pill, Screen, goBack } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { attendeesFor, isWaiting, matchesAt, roomQueue, type Attendee } from '@/lib/selectors';
import { whenLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = id ? getEvent(id) : undefined;
  const wide = useIsWide();
  const { loading } = useStore();
  if (!event) return loading ? <RoomSkeleton /> : <NotFound />;
  return wide ? <RoomWide event={event} /> : <RoomMobile event={event} />;
}

function NotFound() {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <Screen>
      <Header title={t('room.title')} />
      <Text style={[type.body, { color: c.muted }]}>{t('room.eventGone')}</Text>
      <Button label={t('room.toEvents')} variant="secondary" onPress={() => router.replace('/')} style={styles.notFoundCta} />
    </Screen>
  );
}

// Shared room logic for both layouts.
function useRoom(event: Event, toastBottom: number, onMatch?: (userId: string) => void) {
  const { state, dispatch, decide: decideOn } = useStore();
  const { t } = useT();
  const now = useNow();
  const toast = useToast(toastBottom);
  const queue = roomQueue(state, event.id);
  const going = !!state.going[event.id];

  const decide = useCallback(
    (a: Attendee, choice: Choice) => {
      decideOn(event.id, a.user.id, choice).then((matched) => {
        if (!matched) {
          // The other side learns nothing until they press too, so the reassurance goes to this user only.
          if (choice === 'go') toast.show(t('room.waved', { name: a.user.name }), 3600);
          return;
        }
        onMatch?.(a.user.id);
        router.push({ pathname: '/match/[eventId]/[userId]', params: { eventId: event.id, userId: a.user.id } });
      });
    },
    [decideOn, event.id, onMatch, t, toast],
  );

  const report = useCallback(
    (a: Attendee) => router.push({ pathname: '/report/[userId]', params: { userId: a.user.id, eventId: event.id } }),
    [event.id],
  );

  const matches = matchesAt(state, event.id).length;
  const waiting = attendeesFor(state, event.id).filter((a) => isWaiting(state, event.id, a.user.id)).length;
  const position = queue.pending.length > 0 ? Math.min(queue.decided + 1, event.goingCount) : queue.decided;

  return {
    state,
    now,
    toast,
    queue,
    going,
    decide,
    report,
    matches,
    waiting,
    counter: `${position} / ${Math.max(event.goingCount, queue.total)}`,
    goNow: () => dispatch({ type: 'go', eventId: event.id }),
  };
}

// ── M09 ────────────────────────────────────────────────────────────────
// Figma rhythm (390×844, 50 pt status bar): header 44 at +6 · segmented 44 at +12 · card 350×500 at +20 ·
// actions 60 at +22 · footnote at +18 · 51 pt to the screen bottom (34 home indicator + 17).

function RoomMobile({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const r = useRoom(event, footerBottom(insets.bottom) + 150);
  const deck = useRef<DeckHandle>(null);
  const top = r.queue.pending[0];
  const [leaving, setLeaving] = useState(false);

  return (
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top + 6, paddingBottom: footerBottom(insets.bottom) + 13 }]}>
      <View style={styles.mobileHead}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack()}>
            <ChevronLeft size={26} color={c.text} strokeWidth={2} />
          </Pressable>
          <View style={[styles.flex, { gap: 2 }]}>
            <Text style={[onest('bold', 15, 19), { color: c.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={1}>
              {whenLabel(event.startsAt, r.now, ' ')} · {event.venue}
            </Text>
          </View>
          {r.going && <Pill label={r.counter} />}
        </View>
        <RoomTabs event={event} now={r.now} />
      </View>

      {!r.going ? (
        <View style={styles.pad}>
          <RoomLocked onGo={r.goNow} />
        </View>
      ) : !top ? (
        <View style={styles.pad}>
          <RoomDone event={event} matches={r.matches} waiting={r.waiting} />
        </View>
      ) : (
        <>
          <View style={styles.mobileDeck}>
            <CardDeck
              ref={deck}
              people={r.queue.pending}
              onDecide={r.decide}
              onMore={r.report}
              showShared={r.state.settings.showSharedEvents}
              keyboard
            />
          </View>
          <View style={styles.mobileFoot}>
            <RoomActions onSkip={() => deck.current?.swipe('skip')} onGo={() => deck.current?.swipe('go')} />
            <RoomFootnote name={top.user.name} />
            <View style={styles.leaveRow}>
              <LeaveEventLink onPress={() => setLeaving(true)} />
            </View>
          </View>
        </>
      )}
      <LeaveEventSheet event={event} visible={leaving} onClose={() => setLeaving(false)} />
      {r.toast.node}
    </View>
  );
}

// ── W05 ────────────────────────────────────────────────────────────────
// Figma (1440×900): header 52 at y 30 · card 380×520 35 below · actions 60 49 below · footnote +20 · hints +53 · 44 bottom.

function RoomWide({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const r = useRoom(event, 150, setSelected);
  const deck = useRef<DeckHandle>(null);
  const top = r.queue.pending[0];

  return (
    <View style={[styles.flex, styles.row, { backgroundColor: c.bg }]}>
      <View style={[styles.flex, styles.wideMain]}>
        <View style={styles.wideHead}>
          <IconButton icon={ChevronLeft} size={40} onPress={() => goBack()} accessibilityLabel={t('common.back')} />
          <Gradient id={event.poster.gradient} style={styles.thumb} />
          <View style={[styles.flex, { gap: 2 }]}>
            <Text style={[onest('bold', 16, 20), { color: c.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={1}>
              {whenLabel(event.startsAt, r.now, ' ')} · {venueShort(event.venue)}
              {r.going ? ` · ${t('room.youreGoing')}` : ''}
            </Text>
          </View>
          <RoomTabs event={event} now={r.now} compact style={{ width: 270 }} />
        </View>

        {!r.going ? (
          <RoomLocked onGo={r.goNow} />
        ) : !top ? (
          <RoomDone event={event} matches={r.matches} waiting={r.waiting} />
        ) : (
          <>
            <View style={styles.wideDeck}>
              <CardDeck
                ref={deck}
                people={r.queue.pending}
                onDecide={r.decide}
                onMore={r.report}
                showShared={r.state.settings.showSharedEvents}
                maxWidth={380}
                maxHeight={520}
                wide
                keyboard
              />
            </View>
            <View style={styles.wideFoot}>
              <RoomActions goWidth={260} onSkip={() => deck.current?.swipe('skip')} onGo={() => deck.current?.swipe('go')} />
              <View style={{ marginTop: 20 }}>
                <RoomFootnote name={top.user.name} />
              </View>
              <View style={{ marginTop: 16 }}>
                <LeaveEventLink onPress={() => setLeaving(true)} />
              </View>
              <KeyboardHints style={{ marginTop: 53 }} />
            </View>
          </>
        )}
      </View>
      <RoomMatchesPanel event={event} now={r.now} selectedId={selected} onSelect={setSelected} />
      <LeaveEventSheet event={event} visible={leaving} onClose={() => setLeaving(false)} />
      {r.toast.node}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notFoundCta: { alignSelf: 'flex-start', paddingHorizontal: 32 },
  row: { flexDirection: 'row' },
  pad: { flex: 1, paddingHorizontal: 20 },
  mobileHead: { paddingHorizontal: 20, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
  mobileDeck: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  mobileFoot: { paddingHorizontal: 20, gap: 14 },
  leaveRow: { alignItems: 'center' },
  wideMain: { paddingHorizontal: 40, paddingTop: 30, paddingBottom: 44 },
  wideHead: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 52 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  wideDeck: { flex: 1, paddingTop: 35, paddingBottom: 49 },
  wideFoot: { alignItems: 'center' },
});
