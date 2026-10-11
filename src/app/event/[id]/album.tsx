import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Check, ChevronLeft, Eye, Lock, Upload } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumGrid } from '@/components/album/AlbumGrid';
import { pickPhoto } from '@/components/album/pickPhoto';
import { dayInline } from '@/components/chat/chatUtils';
import { Avatar, Button, goBack, Segmented } from '@/components/ui';
import { getEvent, getUser } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { footerBottom, useIsWide } from '@/lib/layout';
import { albumFor, albumOpen, expiresAt, goingCount, isLive } from '@/lib/selectors';
import { dayLabel, time, whenLabel } from '@/lib/time';
import { newId, useNow, useStore } from '@/store/AppStore';
import { fonts, gradientIds, onest, type Palette, useStyles, useTheme } from '@/theme';

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

  const subtitle = live ? t('chat.album.live', { venue: event.venue }) : `${whenLabel(event.startsAt, now)} · ${event.venue}`;
  const visibleTo = t('chat.album.visibleTo', { count, day: dayInline(expiresIso, now), time: time(expiresIso) });
  const locked = !unlocked && <Locked event={event} going={going} now={now} onGo={() => dispatch({ type: 'go', eventId: event.id })} />;

  // W07: header, privacy strip and a 180 pt grid on the left; «Add photo» panel on the right.
  if (wide) {
    return (
      <View style={[s.root, s.row]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.wideMain}>
          <View style={s.wideHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={() => goBack()}
              style={({ pressed }) => [s.wideBack, pressed && { opacity: 0.8 }]}
            >
              <ChevronLeft size={20} color={c.text} strokeWidth={2} />
            </Pressable>
            <View style={s.headerText}>
              <Text style={[onest('bold', 18), { color: c.text }]} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={[onest('regular', 14), { color: c.muted }]} numberOfLines={1}>
                {`${subtitle} · ${t('chat.album.photosCount', { count: photos.length })}`}
              </Text>
            </View>
            {live && <LivePill wide />}
          </View>
          <View style={[s.eye, { marginTop: 18 }]}>
            <Eye size={16} color={c.muted} />
            <Text style={[onest('regular', 13, 16), { color: c.muted, flex: 1 }]} numberOfLines={1}>
              {`${visibleTo} · ${t('chat.album.ownOnly')}`}
            </Text>
          </View>
          <View style={{ marginTop: 20 }}>{locked || <AlbumGrid photos={photos} wide onAdd={add} />}</View>
        </ScrollView>
        <InfoPanel event={event} count={count} canAdd={unlocked} onAdd={add} />
      </View>
    );
  }

  // M14
  return (
    <View style={s.root}>
      <View style={[s.top, { paddingTop: insets.top + 6 }]}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack()}>
            <ChevronLeft size={26} color={c.text} strokeWidth={2} />
          </Pressable>
          <View style={s.headerText}>
            <Text style={[onest('bold', 15, 19), { color: c.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          {live && <LivePill />}
        </View>
        <Segmented
          value="album"
          onChange={(k) => k === 'room' && router.replace({ pathname: '/event/[id]/room', params: { id: event.id } })}
          options={[
            { key: 'room', label: t('chat.album.tabRoom', { count }) },
            { key: 'album', label: t('chat.album.tabAlbum', { count: photos.length }) },
          ]}
        />
        <View style={s.eye}>
          <Eye size={16} color={c.muted} />
          <Text style={[onest('regular', 13, 16), { color: c.muted, flex: 1 }]} numberOfLines={2}>
            {visibleTo}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: footerBottom(insets.bottom) + 96 }]}>
        {locked || <AlbumGrid photos={photos} onAdd={add} />}
      </ScrollView>
      {/* Figma «Fade»: 160 pt from transparent to the background (solid from 60 %), under the FAB. */}
      <LinearGradient
        colors={[`${c.bg}00`, c.bg]}
        locations={[0, 0.6]}
        style={[s.fade, { pointerEvents: 'none' }]}
      />
      {unlocked && (
        <Pressable
          accessibilityRole="button"
          onPress={add}
          style={({ pressed }) => [s.shoot, { bottom: footerBottom(insets.bottom) + 8 }, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <Camera size={22} color={c.onAccent} strokeWidth={2} />
          <Text style={[onest('bold', 16), { color: c.onAccent }]}>{t('chat.album.shoot')}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Demo-clock ISO timestamp for the moment the photo is added.
const demoStamp = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

// Pink LIVE pill: 10×6 pt on M14, 12×7 pt on W07; dot and label use the text colour (dark on light theme).
function LivePill({ wide }: { wide?: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={[pill.base, wide && pill.wide, { backgroundColor: c.danger }]}>
      <View style={[pill.dot, { backgroundColor: c.text }]} />
      <Text style={[onest('bold', 12), { color: c.text }]}>{t('chat.album.livePill')}</Text>
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

// W07 right column: «Add photo» drop zone, who shot photos, album rules.
function InfoPanel({ event, count, canAdd, onAdd }: { event: Event; count: number; canAdd: boolean; onAdd: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const { state } = useStore();
  const authorIds = [...new Set(albumFor(state, event.id).map((p) => p.authorId))];
  const authors = authorIds
    .map((a) => (a === 'me' ? (state.me ? { name: state.me.name, gradient: state.me.gradient } : null) : getUser(a)))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const rules = [t('chat.album.rule1'), t('chat.album.rule2'), t('chat.album.rule3')];

  return (
    <ScrollView style={s.panel} contentContainerStyle={s.panelContent}>
      {canAdd && (
        <>
          <Text style={[{ fontFamily: fonts.displaySemibold, fontSize: 17, lineHeight: 22 }, { color: c.text }]}>{t('chat.album.addPhoto')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onAdd}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              s.dropzone,
              (pressed || hovered) && { backgroundColor: c.accentSoft },
            ]}
          >
            <Upload size={28} color={c.accentInk} strokeWidth={2} />
            <Text style={[onest('semibold', 15), { color: c.text }]}>{t('chat.album.dropTitle')}</Text>
            <Text style={[onest('regular', 13), { color: c.muted }]}>{t('chat.album.dropText')}</Text>
          </Pressable>
        </>
      )}

      {authors.length > 0 && (
        <>
          <Text style={[onest('semibold', 14), { color: c.muted }]}>{t('chat.album.shotBy', { n: authors.length, count })}</Text>
          <View style={s.faces}>
            {authors.slice(0, 6).map((a, i) => (
              <View key={i} style={[s.face, i > 0 && { marginLeft: -8 }]}>
                <Avatar name={a.name} gradient={a.gradient} size={34} />
              </View>
            ))}
          </View>
        </>
      )}

      <View style={s.rules}>
        <Text style={[onest('semibold', 14), { color: c.text }]}>{t('chat.album.rulesTitle')}</Text>
        {rules.map((r) => (
          <View key={r} style={s.rule}>
            <Check size={16} color={c.accentInk} strokeWidth={2} />
            <Text style={[onest('regular', 13, 18), { color: c.muted, flex: 1 }]}>{r}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const pill = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, alignSelf: 'center' },
  wide: { paddingHorizontal: 12, paddingVertical: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    row: { flexDirection: 'row' },
    centre: { alignItems: 'center', justifyContent: 'center', gap: 16 },
    // M14: header (44) → 12 → segmented (44) → 12 → privacy strip → 16 → grid.
    top: { paddingHorizontal: 20, gap: 12, paddingBottom: 16 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
    headerText: { flex: 1, minWidth: 0, gap: 2 },
    scroll: { paddingHorizontal: 20 },
    eye: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 160 },
    shoot: {
      position: 'absolute',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 56,
      paddingLeft: 22,
      paddingRight: 24,
      borderRadius: 28,
      backgroundColor: c.accent,
      boxShadow: '0px 8px 24px rgba(214,255,59,0.35)',
    },
    locked: { alignItems: 'center', gap: 10, paddingTop: 48, paddingHorizontal: 12, maxWidth: 440, alignSelf: 'center', width: '100%' },
    lockIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    // W07 main column: 40 pt sides, header 30 pt from the top.
    wideMain: { paddingHorizontal: 40, paddingTop: 30, paddingBottom: 40 },
    wideHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 52 },
    wideBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    panel: { width: 360, flexGrow: 0, backgroundColor: c.surface },
    panelContent: { paddingTop: 32, paddingBottom: 28, paddingHorizontal: 28, gap: 16 },
    dropzone: {
      height: 180,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    faces: { flexDirection: 'row' },
    face: { borderWidth: 3, borderColor: c.surface, borderRadius: 20 },
    rules: { backgroundColor: c.bg, borderRadius: 16, padding: 16, gap: 10 },
    rule: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  });
