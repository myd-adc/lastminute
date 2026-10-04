import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChatPanel } from '@/components/ChatPanel';
import { Group, Row } from '@/components/Group';
import { Icon } from '@/components/Icon';
import { LockedPreview } from '@/components/LockedPreview';
import { PersonCard, type PersonStatus } from '@/components/PersonCard';
import { NavBack, Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { getEvent } from '@/data/mock';
import type { Event } from '@/data/types';
import { longDate, peopleGoingLabel, shortDayTime, time } from '@/lib/format';
import { useIsWide, useNow } from '@/lib/hooks';
import { attendeesFor, type Attendee } from '@/lib/selectors';
import { pairKey, useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

const LOCK_BODY = 'Познач «Я йду», щоб побачити, хто саме — і щоб вони побачили тебе. Хто не йде, того не видно нікому.';
const HIDDEN_BODY =
  'Ти вимкнув(-ла) «Показувати мене на подіях». Поки тебе не видно, ти теж не бачиш інших — так чесно для всіх.';
const PRIVACY = 'Писати можна лише після взаємної згоди. Профілі видно тільки учасникам події.';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(id);
  if (!event) {
    return (
      <Screen>
        <NavBack label="Події" />
        <Text style={type.title2}>Подію не знайдено</Text>
      </Screen>
    );
  }
  return <EventRoom event={event} />;
}

function useEventRoom(event: Event) {
  const store = useAppStore();
  const { state, dispatch, wantsMe, matchOf } = store;
  const now = useNow();
  const going = !!state.going[event.id];
  const attendees = attendeesFor(event.id, state);

  const statusOf = (userId: string): PersonStatus => {
    const match = matchOf(event.id, userId);
    if (match) return match.expiresAt > now ? 'matched' : 'expired';
    if (state.interestsSent[pairKey(event.id, userId)]) return 'requested';
    return wantsMe(event.id, userId) ? 'incoming' : 'none';
  };

  const onGo = () => {
    // First visit (e.g. straight from a QR code): ask only for a name, then mark attendance.
    if (!state.me) router.push({ pathname: '/join', params: { eventId: event.id } });
    else dispatch({ type: 'go', eventId: event.id });
  };

  // Verification is asked lazily, on the first "Познайомитись", to keep QR → "Я йду" under 15 seconds.
  const onMeet = (userId: string) => {
    if (!state.verifiedEmail) router.push({ pathname: '/verify', params: { eventId: event.id, userId } });
    else dispatch({ type: 'sendInterest', eventId: event.id, userId });
  };

  return { ...store, going, attendees, statusOf, onGo, onMeet };
}

function EventRoom({ event }: { event: Event }) {
  const wide = useIsWide();
  return wide ? <WideEvent event={event} /> : <PhoneEvent event={event} />;
}

function PhoneEvent({ event }: { event: Event }) {
  const { state, dispatch, going, attendees, statusOf, onGo, onMeet } = useEventRoom(event);
  const [tab, setTab] = useState<'people' | 'album'>('people');

  const people = (a: Attendee) => (
    <PersonCard
      key={a.user.id}
      user={a.user}
      note={a.attendance.note}
      status={statusOf(a.user.id)}
      onMeet={() => onMeet(a.user.id)}
      onChat={() =>
        router.push({ pathname: '/matches/chat/[eventId]/[userId]', params: { eventId: event.id, userId: a.user.id } })
      }
      onBlock={() => dispatch({ type: 'block', userId: a.user.id })}
    />
  );

  return (
    <Screen>
      <NavBack label="Події" />
      <Text style={type.title2}>{event.title}</Text>

      {!going ? (
        <>
          <Group>
            <Row icon="clock" label={longDate(event.startsAt)} value={time(event.startsAt)} />
            <Row icon="pin" label={event.venue} value={event.address} last />
          </Group>
          <Button title="Я йду" onPress={onGo} />
          <LockedPreview title={peopleGoingLabel(event.goingCount)} body={LOCK_BODY} />
        </>
      ) : (
        <>
          <View style={styles.goingPill}>
            <Icon name="dot" size={20} color={colors.green} />
            <Text style={type.subheadMedium}>Ти йдеш · {shortDayTime(event.startsAt)}</Text>
          </View>
          <SegmentedControl
            options={[
              { key: 'people', label: `Хто йде · ${state.visible ? attendees.length : '—'}` },
              { key: 'album', label: 'Альбом' },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === 'album' ? (
            <LockedPreview
              title="Альбом відкриється після події"
              body="Фото з події бачитимуть лише ті, хто на ній був."
            />
          ) : !state.visible ? (
            <LockedPreview title="Тебе зараз не видно" body={HIDDEN_BODY}>
              <Button title="Показувати мене" variant="tinted" onPress={() => dispatch({ type: 'setVisible', visible: true })} />
            </LockedPreview>
          ) : (
            <>
              <View style={styles.privacy}>
                <Icon name="lock" size={16} color={colors.label3} />
                <Text style={[type.footnote, { flex: 1, color: colors.label2 }]}>{PRIVACY}</Text>
              </View>
              {attendees.length ? (
                attendees.map(people)
              ) : (
                <Text style={[type.subhead, { color: colors.label2 }]}>Поки нікого з відкритим профілем.</Text>
              )}
            </>
          )}
          <Button title="Скасувати «Я йду»" variant="quiet" onPress={() => dispatch({ type: 'leave', eventId: event.id })} />
        </>
      )}
    </Screen>
  );
}

function WideEvent({ event }: { event: Event }) {
  const { state, dispatch, matches, going, attendees, statusOf, onGo, onMeet } = useEventRoom(event);
  const eventMatches = matches.filter((m) => m.eventId === event.id);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const activeChat = chatWith ?? eventMatches[0]?.userId ?? null;

  return (
    <View style={styles.wideRoot}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.wideMain}>
        <NavBack label="Усі події" />
        <Text style={type.webDisplay}>{event.title}</Text>
        <Text style={[type.webBody, { color: colors.label2 }]}>
          {longDate(event.startsAt)} · {time(event.startsAt)} · {event.venue}
          {event.address ? `, ${event.address}` : ''}
        </Text>

        {!going ? (
          <>
            <Button title="Я йду" onPress={onGo} style={{ alignSelf: 'flex-start', width: 240 }} />
            <View style={{ maxWidth: 720 }}>
              <LockedPreview title={peopleGoingLabel(event.goingCount)} body={LOCK_BODY} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.actions}>
              <View style={styles.goingWeb}>
                <Icon name="dot" size={18} color={colors.green} />
                <Text style={type.webBodyMedium}>Ти йдеш</Text>
              </View>
              <Pressable style={styles.secondary} onPress={() => dispatch({ type: 'leave', eventId: event.id })}>
                <Text style={[type.webBodyMedium, { color: colors.label2 }]}>Скасувати</Text>
              </Pressable>
            </View>

            {!state.visible ? (
              <View style={{ maxWidth: 720 }}>
                <LockedPreview title="Тебе зараз не видно" body={HIDDEN_BODY}>
                  <Button
                    title="Показувати мене"
                    variant="tinted"
                    size="web"
                    onPress={() => dispatch({ type: 'setVisible', visible: true })}
                  />
                </LockedPreview>
              </View>
            ) : (
              <>
                <View style={[styles.privacy, { paddingHorizontal: 0, gap: 8 }]}>
                  <Icon name="lock" size={15} color={colors.label3} />
                  <Text style={[type.webCaption, { color: colors.label2 }]}>{PRIVACY}</Text>
                </View>
                <View style={styles.sectionHead}>
                  <Text style={type.webH2}>Хто йде · {attendees.length}</Text>
                  <Text style={[type.webCaption, { color: colors.tint }]}>Спочатку з твоєї сцени</Text>
                </View>
                <View style={styles.people}>
                  {attendees.map((a) => (
                    <View key={a.user.id} style={{ width: 342 }}>
                      <PersonCard
                        wide
                        user={a.user}
                        note={a.attendance.note}
                        status={statusOf(a.user.id)}
                        onMeet={() => {
                          onMeet(a.user.id);
                          setChatWith(a.user.id);
                        }}
                        onChat={() => setChatWith(a.user.id)}
                        onBlock={() => dispatch({ type: 'block', userId: a.user.id })}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {going && activeChat && eventMatches.some((m) => m.userId === activeChat) && (
        <View style={styles.chatRail}>
          <ChatPanel eventId={event.id} userId={activeChat} variant="rail" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  goingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.elevated,
  },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },
  wideRoot: { flex: 1, flexDirection: 'row' },
  wideMain: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, gap: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  goingWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  secondary: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.fill },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 700 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, maxWidth: 700 },
  chatRail: { width: 380 },
});
