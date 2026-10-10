import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardDeck, type Choice, type DeckHandle } from '@/components/room/CardDeck';
import { RoomMatchesPanel } from '@/components/room/RoomMatchesPanel';
import { KeyboardHints, RoomActions, RoomDone, RoomFootnote, RoomLocked, RoomTabs } from '@/components/room/RoomParts';
import { venueShort } from '@/components/room/text';
import { Button, Gradient, Header, IconButton, Pill, goBack } from '@/components/ui';
import { getEvent } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { attendeesFor, isWaiting, matchesAt, roomQueue, type Attendee } from '@/lib/selectors';
import { whenLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = id ? getEvent(id) : undefined;
  const wide = useIsWide();
  if (!event) return <NotFound />;
  return wide ? <RoomWide event={event} /> : <RoomMobile event={event} />;
}

function NotFound() {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top + 8, paddingHorizontal: 20, gap: 16 }]}>
      <Header title={t('room.title')} />
      <Text style={[type.body, { color: c.muted }]}>{t('room.eventGone')}</Text>
      <Button label={t('room.toEvents')} variant="secondary" onPress={() => router.replace('/')} />
    </View>
  );
}

// Shared room logic for both layouts.
function useRoom(event: Event, onMatch?: (userId: string) => void) {
  const { state, dispatch } = useStore();
  const now = useNow();
  const queue = roomQueue(state, event.id);
  const going = !!state.going[event.id];

  const decide = useCallback(
    (a: Attendee, choice: Choice) => {
      dispatch({ type: 'decide', eventId: event.id, userId: a.user.id, choice });
      if (choice === 'go' && a.attendance.likesYou && !state.blocked[a.user.id]) {
        onMatch?.(a.user.id);
        router.push({ pathname: '/match/[eventId]/[userId]', params: { eventId: event.id, userId: a.user.id } });
      }
    },
    [dispatch, event.id, state.blocked, onMatch],
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

function RoomMobile({ event }: { event: Event }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const r = useRoom(event);
  const deck = useRef<DeckHandle>(null);
  const top = r.queue.pending[0];

  return (
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top + 8, paddingBottom: footerBottom(insets.bottom) - 14 }]}>
      <View style={styles.mobileHead}>
        <Header
          title={event.title}
          subtitle={`${whenLabel(event.startsAt, r.now, ' ')} · ${event.venue}`}
          right={r.going ? <Pill label={r.counter} /> : undefined}
        />
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
          <View style={[styles.flex, { paddingHorizontal: 20, paddingTop: 16 }]}>
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
          </View>
        </>
      )}
    </View>
  );
}

// ── W05 ────────────────────────────────────────────────────────────────

function RoomWide({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const r = useRoom(event, setSelected);
  const deck = useRef<DeckHandle>(null);
  const top = r.queue.pending[0];

  return (
    <View style={[styles.flex, styles.row, { backgroundColor: c.bg }]}>
      <View style={[styles.flex, styles.wideMain]}>
        <View style={styles.wideHead}>
          <IconButton icon={ChevronLeft} size={40} onPress={() => goBack()} accessibilityLabel={t('common.back')} />
          <Gradient id={event.poster.gradient} style={styles.thumb} />
          <View style={[styles.flex, { gap: 2 }]}>
            <Text style={[type.bodyStrong, { color: c.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={[type.footnote, { color: c.muted }]} numberOfLines={1}>
              {whenLabel(event.startsAt, r.now, ' ')} · {venueShort(event.venue)}
              {r.going ? ` · ${t('room.youreGoing')}` : ''}
            </Text>
          </View>
          {r.going && <Pill label={r.counter} />}
          <RoomTabs event={event} now={r.now} compact style={{ width: 280 }} />
        </View>

        {!r.going ? (
          <RoomLocked onGo={r.goNow} />
        ) : !top ? (
          <RoomDone event={event} matches={r.matches} waiting={r.waiting} />
        ) : (
          <>
            <View style={[styles.flex, { paddingTop: 24 }]}>
              <CardDeck
                ref={deck}
                people={r.queue.pending}
                onDecide={r.decide}
                onMore={r.report}
                showShared={r.state.settings.showSharedEvents}
                maxWidth={360}
                maxHeight={500}
                keyboard
              />
            </View>
            <View style={styles.wideFoot}>
              <RoomActions
                style={{ width: 340 }}
                onSkip={() => deck.current?.swipe('skip')}
                onGo={() => deck.current?.swipe('go')}
              />
              <RoomFootnote name={top.user.name} />
              <KeyboardHints />
            </View>
          </>
        )}
      </View>
      <RoomMatchesPanel event={event} now={r.now} selectedId={selected} onSelect={setSelected} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  pad: { flex: 1, paddingHorizontal: 20 },
  mobileHead: { paddingHorizontal: 20, gap: 12 },
  mobileFoot: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  wideMain: { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 28 },
  wideHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  wideFoot: { alignItems: 'center', gap: 16, paddingTop: 8 },
});
