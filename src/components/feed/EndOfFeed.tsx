import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button, Gradient, SectionLabel } from '@/components/ui';
import { getScene } from '@/data/mock';
import { useT } from '@/i18n';
import { goingCount, matchesAt, myUpcoming, sceneEvents } from '@/lib/selectors';
import { going as goingLabel, whenLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

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
  const sceneName = state.sceneId ? getScene(state.sceneId).name : null;
  const mine = myUpcoming(state, now);
  const notify = state.settings.notify.newSceneEvents;
  const skipped = Object.keys(state.skipped).length;
  const seen = sceneEvents(state, now).length;
  const accentText = scheme === 'light' ? '#5A7A00' : c.accent;

  const copy =
    state.feedTab === 'saved'
      ? { title: t('feed.end.savedTitle'), sub: t('feed.end.savedSub') }
      : state.feedTab === 'city'
        ? { title: t('feed.end.cityTitle'), sub: t('feed.end.citySub') }
        : {
            title: sceneName ? t('feed.end.sceneTitle', { scene: sceneName }) : t('feed.end.sceneTitleNoScene'),
            sub: t('feed.end.sceneSub', { count: seen }),
          };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[styles.content, contentStyle]}>
      {header}
      <View style={styles.art}>
        <View style={[styles.card, styles.back, { backgroundColor: scheme === 'light' ? '#7C5CFF' : '#4B36B8' }]} />
        <View style={[styles.card, styles.middle, { backgroundColor: scheme === 'light' ? '#E5306F' : '#B8306E' }]} />
        <Gradient colors={['#FF9A3D', '#FF7A3D']} style={[styles.card, styles.front]}>
          <Text style={[display(48, 56), { color: scheme === 'light' ? '#FFFFFF' : '#0B0B10' }]}>✓</Text>
        </Gradient>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[display(24, 30), styles.center, { color: c.text }]}>{copy.title}</Text>
        <Text style={[type.subhead, styles.center, { color: c.muted }]}>{copy.sub}</Text>
      </View>

      <View style={{ gap: 12 }}>
        {state.feedTab === 'city' ? (
          <Button label={t('feed.end.backToScene')} onPress={() => dispatch({ type: 'setFeedTab', tab: 'scene' })} />
        ) : (
          <Button label={t('feed.end.browseCity')} onPress={() => dispatch({ type: 'setFeedTab', tab: 'city' })} />
        )}
        <Button
          variant="secondary"
          label={notify ? t('feed.end.notifyOn') : t('feed.end.notifyOff')}
          onPress={() => dispatch({ type: 'setNotify', key: 'newSceneEvents', value: !notify })}
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
        <View style={{ gap: 12 }}>
          <SectionLabel
            right={
              <Pressable accessibilityRole="link" onPress={() => router.navigate('/scene')} hitSlop={8}>
                <Text style={[onest('semibold', 13), { color: accentText }]}>{t('common.all')}</Text>
              </Pressable>
            }
          >
            {t('feed.end.youreGoing')}
          </SectionLabel>
          {mine.slice(0, 3).map((e) => {
            const matches = matchesAt(state, e.id).length;
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                style={({ pressed }) => [styles.row, { backgroundColor: c.surface }, pressed && { opacity: 0.85 }]}
              >
                <Gradient id={e.poster.gradient} style={styles.thumb} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: c.text }]} numberOfLines={2}>
                    {e.title}
                  </Text>
                  <Text style={[type.footnote, { color: c.muted }]} numberOfLines={2}>
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
                  <Text style={[onest('bold', 13), { color: c.onAccent }]}>{t('common.chat')}</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 24 },
  center: { textAlign: 'center' },
  art: { height: 190, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: 110, height: 146, borderRadius: 18 },
  back: { transform: [{ translateX: -44 }, { translateY: 12 }, { rotate: '-14deg' }] },
  middle: { transform: [{ translateX: -12 }, { translateY: -6 }, { rotate: '-6deg' }] },
  front: { transform: [{ translateX: 22 }, { translateY: 8 }], alignItems: 'center', justifyContent: 'center' },
  link: { alignSelf: 'center', paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  chat: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
});
