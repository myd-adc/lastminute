import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Clock, Eye, Lock, Users } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumGrid } from '@/components/album/AlbumGrid';
import { pickPhoto } from '@/components/album/pickPhoto';
import { dayInline } from '@/components/chat/chatUtils';
import { AvatarStack, Button, Header, Segmented } from '@/components/ui';
import { getEvent, getUser } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { albumFor, albumOpen, expiresAt, goingCount, isLive } from '@/lib/selectors';
import { dayLabel, time, whenLabel } from '@/lib/time';
import { newId, useNow, useStore } from '@/store/AppStore';
import { display, gradientIds, onest, type Palette, useStyles, useTheme } from '@/theme';

// M14 album (phone) / W07 (wide web): photos only the attendees see, gone 24 h after the event.
export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const { state, dispatch } = useStore();
  const now = useNow();
  const event = getEvent(id);

  if (!event) {
    return (
      <View style={[s.root, s.centre, { padding: 24 }]}>
        <Text style={[onest('bold', 17), { color: c.text }]}>{t('chat.album.eventNotFound')}</Text>
        <Button label={t('chat.toEvents')} size="md" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const going = !!state.going[event.id];
  const open = albumOpen(event, now);
  const live = isLive(event, now);
  const photos = albumFor(state, event.id);
  const count = goingCount(state, event);
  const expiresIso = new Date(expiresAt(event)).toISOString();
  const unlocked = going && open;

  const add = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    dispatch({
      type: 'addPhoto',
      photo: {
        id: newId('p'),
        eventId: event.id,
        authorId: 'me',
        gradient: gradientIds[photos.length % gradientIds.length],
        emoji: '📸',
        uri,
        at: demoStamp(state.demoOffsetMs),
      },
    });
  };

  const header = (
    <Header
      title={event.title}
      subtitle={live ? t('chat.album.live', { venue: event.venue }) : `${whenLabel(event.startsAt, now)} · ${event.venue}`}
      right={live && <LivePill />}
    />
  );
  const segmented = (
    <Segmented
      value="album"
      onChange={(k) => k === 'room' && router.replace({ pathname: '/event/[id]/room', params: { id: event.id } })}
      options={[
        { key: 'room', label: t('chat.album.tabRoom', { count }) },
        { key: 'album', label: t('chat.album.tabAlbum', { count: photos.length }) },
      ]}
    />
  );
  const eyeRow = (
    <View style={s.eye}>
      <Eye size={16} color={c.muted} />
      <Text style={[onest('regular', 13, 18), { color: c.muted, flex: 1 }]} numberOfLines={2}>
        {t('chat.album.visibleTo', { count, day: dayInline(expiresIso, now), time: time(expiresIso) })}
      </Text>
    </View>
  );
  const locked = !unlocked && <Locked event={event} going={going} now={now} onGo={() => dispatch({ type: 'go', eventId: event.id })} />;

  if (wide) {
    return (
      <View style={[s.root, s.row]}>
        <View style={{ flex: 1 }}>
          <View style={s.wideTop}>
            {header}
            <View style={{ maxWidth: 520 }}>{segmented}</View>
            {eyeRow}
          </View>
          <ScrollView contentContainerStyle={s.wideScroll}>
            {locked || <AlbumGrid photos={photos} columns={photos.length > 14 ? 6 : 5} onAdd={add} />}
          </ScrollView>
        </View>
        <InfoPanel event={event} count={count} photos={photos.length} now={now} live={live} canAdd={unlocked} onAdd={add} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        {header}
        {segmented}
        {eyeRow}
      </View>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}>
        {locked || <AlbumGrid photos={photos} columns={3} onAdd={add} />}
      </ScrollView>
      {unlocked && (
        <Pressable
          accessibilityRole="button"
          onPress={add}
          style={({ pressed }) => [s.shoot, { bottom: footerBottom(insets.bottom) + 14 }, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <Camera size={22} color={c.onAccent} strokeWidth={2} />
          <Text style={[onest('bold', 17), { color: c.onAccent }]}>{t('chat.album.shoot')}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Demo-clock ISO timestamp for the moment the photo is added.
const demoStamp = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

function LivePill() {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={[pill.base, { backgroundColor: c.danger }]}>
      <View style={pill.dot} />
      <Text style={[onest('bold', 13), { color: '#FFFFFF' }]}>{t('chat.album.livePill')}</Text>
    </View>
  );
}

function Locked({ event, going, now, onGo }: { event: Event; going: boolean; now: number; onGo: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const before = now < Date.parse(event.startsAt);
  let title: string;
  let text: string;
  if (!going) {
    title = t('chat.album.lockedNotGoingTitle');
    text = t('chat.album.lockedNotGoingText');
  } else if (before) {
    title = t('chat.album.lockedBeforeTitle', { time: time(event.startsAt) });
    text = t('chat.album.lockedBeforeText', { day: dayLabel(event.startsAt, now) });
  } else {
    title = t('chat.album.goneTitle');
    text = t('chat.album.goneText');
  }
  return (
    <View style={s.locked}>
      <View style={s.lockIcon}>
        <Lock size={28} color={c.muted} />
      </View>
      <Text style={[onest('bold', 18, 24), { color: c.text, textAlign: 'center' }]}>{title}</Text>
      <Text style={[onest('regular', 15, 21), { color: c.muted, textAlign: 'center' }]}>{text}</Text>
      {!going && !(now >= expiresAt(event)) && <Button label={t('chat.album.imGoing')} onPress={onGo} style={{ alignSelf: 'stretch', marginTop: 8 }} />}
    </View>
  );
}

// W07 right column: event summary, privacy, authors and actions.
function InfoPanel({
  event,
  count,
  photos,
  now,
  live,
  canAdd,
  onAdd,
}: {
  event: Event;
  count: number;
  photos: number;
  now: number;
  live: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const { c } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const { state } = useStore();
  const expiresIso = new Date(expiresAt(event)).toISOString();
  const authorIds = [...new Set(albumFor(state, event.id).map((p) => p.authorId))];
  const authors = authorIds
    .map((a) => (a === 'me' ? (state.me ? { name: state.me.name, gradient: state.me.gradient } : null) : getUser(a)))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <View style={s.panel}>
      {live && <LivePill />}
      <Text style={[display(22, 28), { color: c.text }]}>{event.title}</Text>
      <Text style={[onest('regular', 14, 19), { color: c.muted }]}>
        {whenLabel(event.startsAt, now)} · {event.venue}
      </Text>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={[display(24, 30), { color: c.text }]}>{photos}</Text>
          <Text style={[onest('regular', 13), { color: c.muted }]}>{t('chat.album.statPhotos', { count: photos })}</Text>
        </View>
        <View style={s.stat}>
          <Text style={[display(24, 30), { color: c.text }]}>{count}</Text>
          <Text style={[onest('regular', 13), { color: c.muted }]}>{t('chat.album.statParticipants', { count })}</Text>
        </View>
      </View>

      {authors.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={[onest('semibold', 13), { color: c.muted }]}>{t('chat.album.shotBy')}</Text>
          <AvatarStack people={authors.slice(0, 6)} size={32} extra={Math.max(0, authors.length - 6)} />
        </View>
      )}

      <View style={s.panelNote}>
        <Eye size={18} color={c.muted} />
        <Text style={[onest('regular', 13, 18), { color: c.muted, flex: 1 }]}>
          {t('chat.album.privacyNote')}
        </Text>
      </View>
      <View style={s.panelNote}>
        <Clock size={18} color={c.muted} />
        <Text style={[onest('regular', 13, 18), { color: c.muted, flex: 1 }]}>
          {t('chat.album.expiryNote', { day: dayInline(expiresIso, now), time: time(expiresIso) })}
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      {canAdd && <Button label={t('chat.album.addPhoto')} icon={Camera} onPress={onAdd} />}
      <Button
        label={t('chat.album.whosHere')}
        icon={Users}
        variant="ghost"
        onPress={() => router.replace({ pathname: '/event/[id]/room', params: { id: event.id } })}
      />
    </View>
  );
}

const pill = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    row: { flexDirection: 'row' },
    centre: { alignItems: 'center', justifyContent: 'center', gap: 16 },
    top: { paddingHorizontal: 20, gap: 12, paddingBottom: 12 },
    scroll: { paddingHorizontal: 20 },
    eye: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    shoot: {
      position: 'absolute',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 60,
      paddingHorizontal: 30,
      borderRadius: 30,
      backgroundColor: c.accent,
      boxShadow: '0px 10px 30px rgba(215,255,59,0.35)',
    },
    locked: { alignItems: 'center', gap: 10, paddingTop: 48, paddingHorizontal: 12, maxWidth: 440, alignSelf: 'center', width: '100%' },
    lockIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    wideTop: { paddingHorizontal: 40, paddingTop: 32, gap: 14, paddingBottom: 16 },
    wideScroll: { paddingHorizontal: 40, paddingBottom: 40 },
    panel: { width: 360, borderLeftWidth: 1, borderLeftColor: c.line, padding: 28, gap: 16 },
    stats: { flexDirection: 'row', gap: 12 },
    stat: { flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 14, gap: 2 },
    panelNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  });
