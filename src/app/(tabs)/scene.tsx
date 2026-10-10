import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTile } from '@/components/feed/DateTile';
import { Gradient, Pill, Screen, ScreenTitle, SectionLabel } from '@/components/ui';
import { getScene, users } from '@/data/mock';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { goingCount, sceneEvents } from '@/lib/selectors';
import { dayLabel, going as goingLabel, people } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

// «Scene» tab (not in Figma): the user's scene, this week's events on it and the people (faces hidden until «I’m going»).
export default function SceneScreen() {
  const { c, scheme } = useTheme();
  const { state } = useStore();
  const { t } = useT();
  const now = useNow();
  const wide = useIsWide();
  const scene = state.sceneId ? getScene(state.sceneId) : null;
  const list = sceneEvents(state, now);
  const mine = list.filter((e) => state.going[e.id]).length;
  const faces = users.filter((u) => u.sceneId === state.sceneId && !state.blocked[u.id]).slice(0, 6);
  const accentText = scheme === 'light' ? '#5A7A00' : c.accent;

  return (
    <Screen withTabBar contentStyle={wide && styles.wide}>
      <ScreenTitle title={t('common.tabs.scene')} />

      {scene ? (
        <Gradient id={scene.gradient} style={styles.hero}>
          <View style={styles.heroScrim} />
          <Text style={[onest('semibold', 13), styles.white, { opacity: 0.85 }]}>{t('common.myScene')}</Text>
          <Text style={[display(32, 38), styles.white]}>
            {scene.emoji ? `${scene.emoji} ` : ''}
            {scene.name}
          </Text>
          <Text style={[type.subhead, styles.white, { opacity: 0.9 }]}>{scene.description}</Text>
          <View style={styles.heroPills}>
            <Pill label={people(scene.people)} tone="glass" />
            <Pill label={t('feed.scene.eventsThisWeek', { count: list.length })} tone="glass" />
            {mine > 0 && <Pill label={t('feed.scene.goingTo', { count: mine })} tone="accent" />}
          </View>
        </Gradient>
      ) : (
        <Pressable onPress={() => router.push('/preferences')} style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[type.bodyStrong, { color: c.text }]}>{t('feed.scene.noScene')}</Text>
          <Text style={[type.footnote, { color: accentText }]}>{t('feed.scene.chooseScene')}</Text>
        </Pressable>
      )}

      <SectionLabel>{t('feed.scene.thisWeek')}</SectionLabel>
      {list.length === 0 ? (
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[type.body, { color: c.muted }]}>{t('feed.scene.empty')}</Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: c.surface }]}>
          {list.map((e, i) => {
            const isGoing = !!state.going[e.id];
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, pressed && { backgroundColor: c.surface2 }]}
              >
                <DateTile iso={e.startsAt} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: c.text }]} numberOfLines={2}>
                    {e.title}
                  </Text>
                  <Text style={[type.footnote, { color: c.muted }]} numberOfLines={1}>
                    {dayLabel(e.startsAt, now)} · {e.venue} · {goingLabel(goingCount(state, e))}
                  </Text>
                </View>
                {isGoing && <Pill label={t('common.youreGoing')} tone="accent" />}
              </Pressable>
            );
          })}
        </View>
      )}

      <SectionLabel>{t('feed.scene.people')}</SectionLabel>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <View style={styles.peopleHead}>
          <View style={styles.faces}>
            {faces.map((u, i) => (
              <View key={u.id} style={[styles.face, { borderColor: c.surface }, i > 0 && { marginLeft: -10 }]}>
                <Gradient id={u.gradient} style={StyleSheet.absoluteFill} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodyStrong, { color: c.text }]}>{scene ? people(scene.people) : t('feed.scene.nobody')}</Text>
            <Text style={[type.footnote, { color: c.muted }]}>{scene ? t('feed.scene.onScene', { scene: scene.name }) : ''}</Text>
          </View>
        </View>
        <View style={[styles.note, { backgroundColor: c.bg }]}>
          <Lock size={16} color={c.muted} strokeWidth={2} />
          <Text style={[type.footnote, { color: c.muted, flex: 1 }]}>
            {t('feed.scene.note')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { maxWidth: 760, width: '100%', alignSelf: 'center' },
  white: { color: '#F6F5F2' },
  hero: { borderRadius: 24, padding: 20, gap: 6, overflow: 'hidden' },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,11,16,0.25)' },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  card: { borderRadius: 20, padding: 16, gap: 14 },
  list: { borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  peopleHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faces: { flexDirection: 'row' },
  face: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, overflow: 'hidden' },
  note: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, alignItems: 'flex-start' },
});
