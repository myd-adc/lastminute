import { router, useLocalSearchParams } from 'expo-router';
import { Check, ExternalLink, MapPin, Send, Ticket, User, Users, X } from 'lucide-react-native';
import { useState } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfoRow, PeopleStack } from '@/components/feed/DetailsParts';
import { LeaveEventLink, LeaveEventSheet } from '@/components/feed/LeaveEvent';
import { categoryLabel, mapsUrl, priceLabel, shortTitle } from '@/components/feed/format';
import { PosterArt } from '@/components/feed/PosterArt';
import { shareEvent } from '@/components/feed/share';
import { useToast } from '@/components/feed/Toast';
import { Avatar, AvatarStack, Button, Chip, CloseButton, goBack, IconButton, Pill, Sheet } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent, soloGroups } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { t as translate } from '@/i18n/translate';
import { fullWindow, useIsWide } from '@/lib/layout';
import { pop, slideUp, useOverlayMotion, useSheetDrag } from '@/lib/motion';
import { acquaintances, attendeesFor, eventAuthor, goingCount, soloCount, soloGroupMembers } from '@/lib/selectors';
import { dayLabel, whenLabel } from '@/lib/time';
import { useNow, useStore, type Going } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

const organiserUrl = (e: Event) => `https://www.google.com/search?q=${encodeURIComponent(`${e.title} ${e.venue} ${translate('feed.city')}`)}`;

// M07 «Details» (bottom sheet over the feed) and W04 (wide dialog with the poster on the left).
export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(id ?? '');
  const wide = useIsWide();
  const { c } = useTheme();
  const { t } = useT();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [standalone] = useState(() => !router.canGoBack());

  if (!event) {
    return (
      <Sheet onClose={() => goBack('/')} footer={<Button label={t('feed.backToFeed')} onPress={() => router.replace('/')} />}>
        <Text style={[type.title2, { color: c.text }]}>{t('feed.details.notFound')}</Text>
        <Text style={[type.body, { color: c.muted }]}>{t('feed.details.notFoundSub')}</Text>
      </Sheet>
    );
  }

  if (wide) return <WideDetails event={event} />;
  return (
    <View style={StyleSheet.absoluteFill}>
      {standalone && <PosterArt event={event} width={width} height={height} variant="backdrop" shift={insets.top - 50} />}
      <MobileDetails event={event} />
    </View>
  );
}

function useDetails(event: Event) {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const now = useNow();
  const toast = useToast(120);
  const [leaving, setLeaving] = useState(false);
  const going = state.going[event.id];
  const saved = !!state.saved[event.id];
  const attendees = attendeesFor(state, event.id);
  const preview = attendees.slice(0, 3).map((a) => ({ name: a.user.name, gradient: a.user.gradient }));
  const goingN = goingCount(state, event);
  const soloN = soloCount(state, event);
  const hasGroup = !!soloGroups[event.id];
  const knownN = acquaintances(state, event.id).length;

  const share = () =>
    shareEvent(event, now).then((r) => {
      if (r === 'copied') toast.show(t('feed.toast.linkCopied'));
      else if (r === 'failed') toast.show(t('feed.toast.shareFailed'));
    });
  const toggleSave = () => dispatch({ type: 'toggleSaved', eventId: event.id });
  const openRoom = () => router.replace({ pathname: '/event/[id]/room', params: { id: event.id } });
  const go = (patch?: Partial<Going>) => {
    dispatch({ type: 'go', eventId: event.id });
    if (patch) dispatch({ type: 'setGoing', eventId: event.id, patch });
    router.replace({ pathname: '/event/[id]/going', params: { id: event.id } });
  };
  const openUrl = (url: string) => Linking.openURL(url).catch(() => toast.show(t('feed.toast.openFailed')));

  return { state, dispatch, now, toast, going, saved, preview, goingN, soloN, knownN, hasGroup, share, toggleSave, openRoom, go, openUrl, leaving, setLeaving };
}

// Figma dims: M07 rgba(bg, 0.55) behind the sheet, W04 rgba(bg, 0.73) behind the dialog (same in light).
const DIM_SHEET = 'rgba(11,11,16,0.55)';
const DIM_DIALOG = 'rgba(11,11,16,0.73)';

// Shared M07/W04 content: pills, title, description, venue/price/people rows, partner note (phone only).
function Body({ event, d, wide }: { event: Event; d: ReturnType<typeof useDetails>; wide?: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const extra = Math.max(0, d.goingN - d.preview.length);
  const author = eventAuthor(d.state, event);
  const solo = t(d.hasGroup && !wide ? 'feed.details.soloGroupOpen' : 'feed.details.solo', { count: d.soloN });
  const known = d.knownN > 0 ? ` · ${t('feed.details.known', { count: d.knownN })}` : '';
  const peopleSub = wide ? (d.going ? solo + known : t('feed.details.namesAfter', { text: solo + known })) : solo;
  const link = [onest('semibold', 13, 17), { color: c.accentInk }];
  return (
    <>
      <View style={styles.pills}>
        <Pill label={whenLabel(event.startsAt, d.now)} tone="accent" />
        <Pill label={categoryLabel(event)} weight="medium" />
        {event.ageLimit ? <Pill label={`${event.ageLimit}+`} weight="medium" /> : null}
      </View>
      {author && (
        <View style={styles.author}>
          <Avatar name={author.name} gradient={author.gradient} photoUri={author.photoUri} size={28} />
          <Text style={[onest('semibold', 13, 17), { color: c.muted }]}>{t('feed.own.byPerson')} · {author.name}</Text>
        </View>
      )}
      <Text style={[wide ? display(30, 34) : display(24, 28), { color: c.text }]}>{event.title}</Text>
      <Text style={[onest('regular', 15, wide ? 23 : 22), { color: c.text }]}>{event.description}</Text>
      <InfoRow
        icon={MapPin}
        title={event.venue}
        sub={[event.address, event.walk].filter(Boolean).join(' · ')}
        onPress={() => d.openUrl(mapsUrl(event))}
        right={<Text style={link}>{wide ? t('feed.details.mapLong') : t('feed.details.map')}</Text>}
      />
      <InfoRow
        icon={Ticket}
        title={priceLabel(event)}
        sub={event.priceNote ?? (event.price == null ? t('feed.details.freeNote') : t('feed.details.payNote'))}
        onPress={() => d.openUrl(organiserUrl(event))}
        right={wide ? <Text style={link}>{t('feed.details.site')}</Text> : <ExternalLink size={18} color={c.muted} strokeWidth={2} />}
      />
      <InfoRow
        icon={wide ? User : Users}
        iconColor={wide ? c.text : c.accentInk}
        title={t('feed.details.going', { count: d.goingN })}
        sub={peopleSub}
        onPress={d.going ? d.openRoom : undefined}
        right={<PeopleStack people={d.preview} extra={extra} revealed={!!d.going} />}
      />
      {event.partner && !wide && (
        <View style={[styles.partner, { backgroundColor: c.bg }]}>
          <Text style={[onest('bold', 14, 18), { color: c.accentInk }]}>✦</Text>
          <Text style={[onest('regular', 13, 18), styles.flex, { color: c.muted }]}>{t('feed.details.partnerNote')}</Text>
        </View>
      )}
      {d.going && <LeaveEventLink onPress={() => d.setLeaving(true)} />}
    </>
  );
}

// M07: a 28 pt-radius sheet from 94 pt under the status bar to the screen bottom; actions 44 pt above the bottom.
function MobileDetails({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const d = useDetails(event);
  const { height } = useWindowDimensions();
  const { progress, exit } = useOverlayMotion();
  const close = () => exit(() => goBack('/'));
  const drag = useSheetDrag(close);
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: DIM_SHEET, opacity: progress }]}>
        <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        {...drag.panHandlers}
        style={[styles.sheet, { top: insets.top + 94, backgroundColor: c.surface }, slideUp(progress, height - insets.top - 94, drag.drag)]}
      >
        <View style={[styles.handle, { backgroundColor: c.line }]} />
        <CloseButton onPress={close} />
        <ScrollView style={styles.flex} contentContainerStyle={styles.sheetContent} bounces={false} onScroll={drag.onScroll} scrollEventThrottle={16}>
          <Body event={event} d={d} />
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 34) + 10 }]}>
          <IconButton icon={Send} size={56} accessibilityLabel={t('feed.shareToFriend')} onPress={d.share} />
          <Button variant="secondary" label={d.saved ? t('common.saved') : t('common.save')} onPress={d.toggleSave} style={styles.save} />
          {d.going ? (
            <Button label={t('common.youreGoing')} onPress={d.openRoom} style={styles.flex} />
          ) : (
            <Button label={t('common.imGoing')} onPress={() => d.go()} style={styles.flex} />
          )}
        </View>
      </Animated.View>
      <LeaveEventSheet event={event} visible={d.leaving} onClose={() => d.setLeaving(false)} />
      {d.toast.node}
    </>
  );
}

// W04: 960×680 dialog centred in the window over a 73 % dim; 380 pt poster on the left, details 40 pt in.
function WideDetails({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const d = useDetails(event);
  const { width, height } = useWindowDimensions();
  const [withChoice, setWithChoice] = useState<Going['with']>(d.state.goesWith === 'company' ? 'friends' : 'solo');
  const [joinChoice, setJoinChoice] = useState(true);
  const w = Math.min(960, width - 80);
  const h = Math.min(680, height - 80);
  const posterW = Math.round((w * 380) / 960);
  const mode = d.going?.with ?? withChoice;
  const join = d.going ? d.going.joinSoloGroup : joinChoice;
  const members = soloGroupMembers(d.state, event.id);
  const setWith = (v: Going['with']) => (d.going ? d.dispatch({ type: 'setGoing', eventId: event.id, patch: { with: v } }) : setWithChoice(v));
  const setJoin = (v: boolean) => (d.going ? d.dispatch({ type: 'setGoing', eventId: event.id, patch: { joinSoloGroup: v } }) : setJoinChoice(v));
  const groupLabel = t('feed.details.joinGroup', { title: shortTitle(event) });
  const { progress, exit } = useOverlayMotion();
  const close = () => exit(() => goBack('/'));

  return (
    <View style={[fullWindow, styles.centre]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: DIM_DIALOG, opacity: progress }]}>
        <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[styles.dialog, { width: w, height: h, backgroundColor: c.surface, borderColor: c.line }, pop(progress)]}>
        <View style={{ width: posterW, height: h }}>
          <PosterArt event={event} width={posterW} height={h} variant="dialog" />
          <View style={styles.posterPills}>
            <Pill label={`🔥 ${dayLabel(event.startsAt, d.now)}`} tone="bg" />
            {event.partner && (
              <View style={[styles.partnerPill, { backgroundColor: c.bg }]}>
                <Text style={[onest('semibold', 13), { color: c.accentInk }]}>{t('feed.details.partnerPill')}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.wideSide}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.wideContent}>
            <Body event={event} d={d} wide />
          </ScrollView>
          <View style={styles.wideFooter}>
            <View style={[styles.choice, { backgroundColor: c.bg }]}>
              <View style={styles.choiceRow}>
                <Text style={[onest('semibold', 14, 18), { color: c.muted }]}>{t('feed.details.youreGoingLabel')}</Text>
                <Chip label={t('feed.details.solo2')} selected={mode === 'solo'} onPress={() => setWith('solo')} />
                <Chip label={t('feed.details.withSomeone')} selected={mode === 'friends'} onPress={() => setWith('friends')} />
              </View>
              {mode === 'solo' && (
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: join }} onPress={() => setJoin(!join)} style={styles.joinRow}>
                  <View style={[styles.box, join ? { backgroundColor: c.accent } : { borderWidth: 1.5, borderColor: c.line }]}>
                    {join && <Check size={14} color={c.onAccent} strokeWidth={3} />}
                  </View>
                  <Text style={[onest('medium', 14, 18), styles.flex, { color: c.text }]}>
                    {members.length ? `${groupLabel} · ${t('feed.details.alreadyThere', { count: members.length })}` : `${groupLabel} · ${t('feed.details.firstInGroup')}`}
                  </Text>
                  {members.length > 0 && <AvatarStack people={members.slice(0, 4).map((u) => ({ name: u.name, gradient: u.gradient, photoUri: u.photoUri }))} size={24} />}
                </Pressable>
              )}
            </View>
            <View style={styles.actions}>
              <Button variant="secondary" label={t('feed.shareArrow')} onPress={d.share} style={styles.shareBtn} />
              <Button variant="secondary" label={d.saved ? t('common.saved') : t('common.save')} onPress={d.toggleSave} style={styles.saveBtn} />
              {d.going ? (
                <Button label={t('feed.details.goingWho')} onPress={d.openRoom} style={styles.flex} />
              ) : (
                <Button label={t('common.imGoing')} onPress={() => d.go({ with: withChoice, joinSoloGroup: withChoice === 'solo' && joinChoice })} style={styles.flex} />
              )}
            </View>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={close} style={[styles.close, { backgroundColor: c.surface2 }]}>
          <X size={18} color={c.text} strokeWidth={2} />
        </Pressable>
      </Animated.View>
      <LeaveEventSheet event={event} visible={d.leaving} onClose={() => d.setLeaving(false)} />
      {d.toast.node}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  partner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 10 },
  // paddingTop clears the close button in the top-right corner.
  sheetContent: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 16, gap: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  save: { width: 110, paddingHorizontal: 12 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  dialog: { flexDirection: 'row', borderRadius: 28, borderWidth: 1, overflow: 'hidden', boxShadow: '0px 30px 80px rgba(0,0,0,0.5)' },
  posterPills: { position: 'absolute', left: 20, bottom: 30, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  partnerPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  wideSide: { flex: 1 },
  wideContent: { paddingLeft: 39, paddingRight: 80, paddingTop: 39, paddingBottom: 16, gap: 14 },
  wideFooter: { paddingLeft: 39, paddingRight: 40, paddingBottom: 32, gap: 6 },
  choice: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  shareBtn: { width: 120, paddingHorizontal: 12 },
  saveBtn: { width: 130, paddingHorizontal: 12 },
  close: { position: 'absolute', top: 19, right: 21, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
