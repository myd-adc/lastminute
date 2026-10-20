import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isLive } from '@/api/client';
import { Button, Gradient } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { isRemoteLoaded } from '@/data/mock';
import { useT } from '@/i18n';
import { goingCount, matchesAt, myCommunities, myUpcoming } from '@/lib/selectors';
import { genderForms } from '@/lib/genderForms';
import { going as goingLabel, whenLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { display, fonts, onest, type, useTheme } from '@/theme';

import { matchesLabel } from './format';

type Props = {
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

// M10 «End of feed»: the stack of the current tab is empty.
export function EndOfFeed({ header, contentStyle }: Props) {
  const { c, scheme } = useTheme();
  const { state, dispatch } = useStore();
  const { t } = useT();
  const now = useNow();
  const mine = myUpcoming(state, now);
  const notify = state.settings.notify.newCommunityEvents;
  const skipped = Object.keys(state.skipped).length;
  const inCommunities = myCommunities(state).length > 0;
  const light = scheme === 'light';
  const forms = genderForms(state.me?.gender);

  // Live backend before the first snapshot: the feed is loading, not finished.
  if (isLive && !isRemoteLoaded()) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={contentStyle}>{header}</View>
        <ActivityIndicator color={c.muted} style={styles.loading} />
      </View>
    );
  }

  const tab = state.feedTab;
  const copy =
    tab === 'saved'
      ? { title: t('feed.end.savedTitle'), sub: t('feed.end.savedSub') }
      : tab === 'communities'
        ? inCommunities
          ? { title: t('feed.end.communitiesTitle'), sub: t('feed.end.communitiesSub') }
          : { title: t('feed.end.communitiesEmptyTitle'), sub: t('feed.end.communitiesEmptySub') }
        : { title: t('feed.end.forYouTitle'), sub: t('feed.end.forYouSub', forms) };
  // "For you" and an empty "Communities" lead to communities; the other tabs lead back to "For you".
  const findCommunities = tab === 'forYou' || (tab === 'communities' && !inCommunities);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[styles.content, contentStyle]}>
      {header}
      {/* M10 illustration: 220×170 box 28 pt under the tabs; violet (35 %) and pink (60 %) cards tilted behind the orange one. */}
      <View style={styles.art}>
        <View style={[styles.card, styles.back, { backgroundColor: light ? '#6847FF' : '#7C5CFF' }]} />
        <View style={[styles.card, styles.middle, { backgroundColor: light ? '#E3246C' : '#FF3D8B' }]} />
        <View style={[styles.card, styles.front, { backgroundColor: light ? '#FF7426' : '#FF8A3D' }]}>
          <Text style={[styles.tick, { color: c.bg }]}>✓</Text>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={[display(22, 26), styles.center, { color: c.text }]}>{copy.title}</Text>
        <Text style={[type.body, styles.center, styles.sub, { color: c.muted }]}>{copy.sub}</Text>
      </View>

      <View style={styles.buttons}>
        {findCommunities ? (
          <Button label={t('feed.end.findCommunities')} onPress={() => router.navigate('/communities')} />
        ) : (
          <Button label={t('feed.end.backToForYou')} onPress={() => dispatch({ type: 'setFeedTab', tab: 'forYou' })} />
        )}
        <Button variant="secondary" label={t('feed.own.create')} onPress={() => router.push('/event/new')} />
        <Button
          variant="secondary"
          label={notify ? t('feed.end.notifyOn') : t('feed.end.notifyOff')}
          onPress={() => dispatch({ type: 'setNotify', key: 'newCommunityEvents', value: !notify })}
        />
        {notify && (
          <Text style={[type.footnote, styles.center, { color: c.muted }]}>
            {t('feed.end.notifyNote')}
          </Text>
        )}
        {skipped > 0 && state.feedTab !== 'saved' && (
          <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'resetSkipped' })} hitSlop={8} style={styles.link}>
            <Text style={[onest('semibold', 14), { color: c.muted }]}>{t('feed.end.reviewSkipped', { count: skipped })}</Text>
          </Pressable>
        )}
      </View>

      {mine.length > 0 && (
        <View style={styles.mine}>
          <View style={styles.mineHead}>
            <Text style={[onest('semibold', 15, 19), styles.flex, { color: c.text }]}>{t('feed.end.youreGoing')}</Text>
          </View>
          {mine.slice(0, 3).map((e) => {
            const matches = matchesAt(state, e.id).length;
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                style={({ pressed }) => [styles.row, { backgroundColor: c.surface }, pressed && { opacity: 0.85 }]}
              >
                <Gradient id={e.poster.gradient} style={styles.thumb} />
                <View style={styles.rowText}>
                  <Text style={[onest('semibold', 15, 19), { color: c.text }]} numberOfLines={2}>
                    {e.title}
                  </Text>
                  <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={2}>
                    {whenLabel(e.startsAt, now, ' ')} · {goingLabel(goingCount(state, e))}
                    {matches > 0 ? ` · ${matchesLabel(matches)}` : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('feed.chatWith', { title: e.title })}
                  onPress={() => router.push({ pathname: '/event/[id]/room', params: { id: e.id } })}
                  style={[styles.chat, { backgroundColor: c.accent }]}
                >
                  <Text style={[onest('bold', 13, 16), { color: c.onAccent }]}>{t('common.chat')}</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// Figma M10: content column (gap 10) starts 32 pt under the illustration; extra 4 pt before the buttons, 8 pt before «You’re going».
const styles = StyleSheet.create({
  loading: { marginTop: 120 },
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  art: { width: 220, height: 170, alignSelf: 'center', marginTop: 28 },
  card: { position: 'absolute', width: 110, height: 150, borderRadius: 18 },
  back: { left: 23.2, top: 29.8, opacity: 0.35, transform: [{ rotate: '12deg' }] },
  middle: { left: 69.9, top: 1.6, opacity: 0.6, transform: [{ rotate: '-8deg' }] },
  front: { left: 80, top: 4 },
  tick: { position: 'absolute', left: 32, top: 56, fontFamily: fonts.display, fontSize: 40, lineHeight: 50 },
  copy: { gap: 10, marginTop: 32 },
  sub: { lineHeight: 21 },
  buttons: { gap: 10, marginTop: 24 },
  link: { alignSelf: 'center', paddingVertical: 4 },
  mine: { gap: 10, marginTop: 28 },
  mineHead: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 10, paddingRight: 14, paddingVertical: 10, borderRadius: 18 },
  rowText: { flex: 1, gap: 2 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  chat: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
});
