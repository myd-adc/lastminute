import { router, useLocalSearchParams } from 'expo-router';
import { ExternalLink, MapPin, Send, Ticket, Users, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { InfoRow, PeopleStack } from '@/components/feed/DetailsParts';
import { categoryLabel, mapsUrl, priceLabel, sceneName, shortTitle } from '@/components/feed/format';
import { PosterArt } from '@/components/feed/PosterArt';
import { shareEvent } from '@/components/feed/share';
import { useToast } from '@/components/feed/Toast';
import { AvatarStack, Button, Checkbox, goBack, IconButton, Pill, Sheet, SIDEBAR_WIDTH } from '@/components/ui';
import { getEvent, soloGroups } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { t as translate } from '@/i18n/translate';
import { useIsWide } from '@/lib/layout';
import { attendeesFor, goingCount, soloCount, soloGroupMembers } from '@/lib/selectors';
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
      {standalone && <PosterArt event={event} width={width} height={height} />}
      <MobileDetails event={event} />
    </View>
  );
}

function useDetails(event: Event) {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const now = useNow();
  const toast = useToast(120);
  const going = state.going[event.id];
  const saved = !!state.saved[event.id];
  const attendees = attendeesFor(state, event.id);
  const preview = attendees.slice(0, 3).map((a) => ({ name: a.user.name, gradient: a.user.gradient }));
  const goingN = goingCount(state, event);
  const soloN = soloCount(state, event);
  const hasGroup = !!soloGroups[event.id];

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

  return { state, dispatch, now, toast, going, saved, preview, goingN, soloN, hasGroup, share, toggleSave, openRoom, go, openUrl };
}

function Body({ event, d, accent }: { event: Event; d: ReturnType<typeof useDetails>; accent: string }) {
  const { c } = useTheme();
  const { t } = useT();
  const extra = Math.max(0, d.goingN - d.preview.length);
  const soloSub = t(d.hasGroup ? 'feed.details.soloGroupOpen' : 'feed.details.solo', { count: d.soloN });
  return (
    <>
      <View style={styles.pills}>
        <Pill label={whenLabel(event.startsAt, d.now)} tone="accent" />
        <Pill label={categoryLabel(event)} />
        {event.ageLimit ? <Pill label={`${event.ageLimit}+`} /> : null}
      </View>
      <Text style={[display(26, 32), { color: c.text }]}>{event.title}</Text>
      <Text style={[type.body, { color: c.text, opacity: 0.86 }]}>{event.description}</Text>
      <InfoRow
        icon={MapPin}
        title={event.venue}
        sub={[event.address, event.walk].filter(Boolean).join(' · ')}
        onPress={() => d.openUrl(mapsUrl(event))}
        right={<Text style={[onest('semibold', 14), { color: accent }]}>{t('feed.details.map')}</Text>}
      />
      <InfoRow
        icon={Ticket}
        title={priceLabel(event)}
        sub={event.priceNote ?? (event.price == null ? t('feed.details.freeNote') : t('feed.details.payNote'))}
        onPress={() => d.openUrl(organiserUrl(event))}
        right={<ExternalLink size={20} color={c.muted} strokeWidth={2} />}
      />
      <InfoRow
        icon={Users}
        title={t('feed.details.goingFrom', { count: d.goingN, scene: sceneName(event) })}
        sub={d.going ? soloSub : t('feed.details.namesAfter', { text: soloSub })}
        onPress={d.going ? d.openRoom : undefined}
        right={<PeopleStack people={d.preview} extra={extra} revealed={!!d.going} />}
      />
      {event.partner && (
        <View style={[styles.partner, { backgroundColor: c.bg }]}>
          <Text style={[onest('bold', 16), { color: accent }]}>✦</Text>
          <Text style={[type.footnote, { color: c.muted, flex: 1 }]}>
            {t('feed.details.partnerNote')}
          </Text>
        </View>
      )}
    </>
  );
}

function MobileDetails({ event }: { event: Event }) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const d = useDetails(event);
  const accent = scheme === 'light' ? '#5A7A00' : c.accent;
  return (
    <>
      <Sheet
        onClose={() => goBack('/')}
        maxHeight="88%"
        footer={
          <View style={styles.footer}>
            <IconButton icon={Send} size={56} accessibilityLabel={t('feed.shareToFriend')} onPress={d.share} />
            <Button variant="secondary" label={d.saved ? t('common.saved') : t('common.save')} onPress={d.toggleSave} />
            {d.going ? (
              <Button label={t('common.youreGoing')} onPress={d.openRoom} style={styles.flex} />
            ) : (
              <Button label={t('common.imGoing')} onPress={() => d.go()} style={styles.flex} />
            )}
          </View>
        }
      >
        <Body event={event} d={d} accent={accent} />
      </Sheet>
      {d.toast.node}
    </>
  );
}

function WideDetails({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const d = useDetails(event);
  const { width, height } = useWindowDimensions();
  const [withChoice, setWithChoice] = useState<Going['with']>(d.state.goesWith === 'company' ? 'friends' : 'solo');
  const [joinChoice, setJoinChoice] = useState(true);
  const w = Math.min(960, width - SIDEBAR_WIDTH - 80);
  const h = Math.min(680, height - 80);
  const posterW = Math.round(w * 0.4);
  const mode = d.going?.with ?? withChoice;
  const join = d.going ? d.going.joinSoloGroup : joinChoice;
  const members = soloGroupMembers(d.state, event.id);
  const setWith = (v: Going['with']) => (d.going ? d.dispatch({ type: 'setGoing', eventId: event.id, patch: { with: v } }) : setWithChoice(v));
  const setJoin = (v: boolean) => (d.going ? d.dispatch({ type: 'setGoing', eventId: event.id, patch: { joinSoloGroup: v } }) : setJoinChoice(v));

  return (
    <View style={[StyleSheet.absoluteFill, styles.centre]}>
      <Pressable accessibilityLabel={t('common.close')} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={() => goBack('/')} />
      <View style={[styles.dialog, { width: w, height: h, backgroundColor: c.surface, borderColor: c.line }]}>
        <View style={{ width: posterW, height: h }}>
          <PosterArt event={event} width={posterW} height={h} scrimFrom={0.8} top={Math.round(h * 0.2)} />
          <View style={styles.posterPills}>
            <Pill label={`🔥 ${dayLabel(event.startsAt, d.now)}`} tone="bg" />
            {event.partner && <Pill label={t('feed.details.partnerPill')} tone="bg" style={{ backgroundColor: '#0B0B10' }} />}
          </View>
        </View>
        <View style={styles.flex}>
          <ScrollView contentContainerStyle={styles.wideContent}>
            <Body event={event} d={d} accent={c.accent} />
            <View style={[styles.choice, { backgroundColor: c.bg }]}>
              <View style={styles.choiceRow}>
                <Text style={[type.subhead, { color: c.muted }]}>{t('feed.details.youreGoingLabel')}</Text>
                <Toggle label={t('feed.details.solo2')} on={mode === 'solo'} onPress={() => setWith('solo')} />
                <Toggle label={t('feed.details.withSomeone')} on={mode === 'friends'} onPress={() => setWith('friends')} />
              </View>
              {mode === 'solo' && (
                <View style={styles.choiceRow}>
                  <View style={styles.flex}>
                    <Checkbox
                      checked={join}
                      onChange={setJoin}
                      label={t('feed.details.joinGroup', { title: shortTitle(event) })}
                      sub={members.length ? t('feed.details.inGroup', { count: members.length }) : t('feed.details.firstInGroup')}
                    />
                  </View>
                  {members.length > 0 && (
                    <AvatarStack people={members.slice(0, 4).map((u) => ({ name: u.name, gradient: u.gradient }))} size={24} />
                  )}
                </View>
              )}
            </View>
          </ScrollView>
          <View style={styles.wideFooter}>
            <Button variant="secondary" size="md" label={t('feed.shareArrow')} onPress={d.share} style={{ height: 56 }} />
            <Button variant="secondary" size="md" label={d.saved ? t('common.saved') : t('common.save')} onPress={d.toggleSave} style={{ height: 56 }} />
            {d.going ? (
              <Button label={t('feed.details.goingWho')} onPress={d.openRoom} style={styles.flex} />
            ) : (
              <Button label={t('common.imGoing')} onPress={() => d.go({ with: withChoice, joinSoloGroup: withChoice === 'solo' && joinChoice })} style={styles.flex} />
            )}
          </View>
        </View>
        <View style={styles.close}>
          <IconButton icon={X} size={40} accessibilityLabel={t('common.close')} onPress={() => goBack('/')} />
        </View>
      </View>
      {d.toast.node}
    </View>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.toggle, on ? { backgroundColor: c.accent } : { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }]}
    >
      <Text style={[onest('semibold', 15), { color: on ? c.onAccent : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  partner: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, alignItems: 'flex-start' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  dialog: { flexDirection: 'row', borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  posterPills: { position: 'absolute', left: 20, bottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wideContent: { paddingHorizontal: 40, paddingTop: 40, paddingBottom: 16, gap: 16 },
  choice: { borderRadius: 18, padding: 16, gap: 14, marginTop: 4 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: { height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  wideFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 40, paddingBottom: 32, paddingTop: 8 },
  close: { position: 'absolute', top: 20, right: 20 },
});
