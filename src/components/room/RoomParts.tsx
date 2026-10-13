import { router } from 'expo-router';
import { Lock, X } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button, IconButton, Segmented } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { soloGroups } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { albumOpen } from '@/lib/selectors';
import { time } from '@/lib/time';
import { onest, type, useTheme } from '@/theme';

// «👋 Хто йде» / «🔒 Альбом · з 20:00». The album tab navigates to the album screen.
export function RoomTabs({ event, now, compact, style }: { event: Event; now: number; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const { t } = useT();
  const open = albumOpen(event, now);
  return (
    <Segmented
      style={style}
      value="who"
      onChange={(k) => {
        if (k === 'album') router.push({ pathname: '/event/[id]/album', params: { id: event.id } });
      }}
      options={[
        { key: 'who', label: t('room.tabs.who') },
        open
          ? { key: 'album', label: t('room.tabs.album') }
          : {
              key: 'album',
              label: t(compact ? 'room.tabs.albumAt' : 'room.tabs.albumFrom', { time: time(event.startsAt) }),
              icon: <Lock size={14} color={c.muted} strokeWidth={2} />,
            },
      ]}
    />
  );
}

// ✕ and «👋 Піти разом» (60 pt action row, 14 pt gap). `goWidth` fixes the CTA width (W05: 260).
export function RoomActions({ onSkip, onGo, goWidth, style }: { onSkip: () => void; onGo: () => void; goWidth?: number; style?: StyleProp<ViewStyle> }) {
  const { t } = useT();
  return (
    <View style={[styles.actions, style]}>
      <IconButton icon={X} size={60} onPress={onSkip} accessibilityLabel={t('common.skip')} />
      <Button label={t('common.goTogether')} onPress={onGo} style={[styles.go, goWidth ? { width: goWidth } : styles.goFlex]} />
    </View>
  );
}

export function RoomFootnote({ name }: { name: string }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <Text style={[onest('regular', 13, 17), { color: c.muted, textAlign: 'center' }]} numberOfLines={2}>
      {t('room.footnote', { name })}
    </Text>
  );
}

// Symmetry guard: only people who go can see who else goes.
export function RoomLocked({ onGo }: { onGo: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={[type.title2, { color: c.text, textAlign: 'center' }]}>{t('room.locked.title')}</Text>
      <Text style={[type.body, { color: c.muted, textAlign: 'center' }]}>
        {t('room.locked.body')}
      </Text>
      <Button label={t('common.imGoing')} onPress={onGo} style={styles.cta} />
    </View>
  );
}

// Queue finished: summary + where to go next.
export function RoomDone({ event, matches, waiting }: { event: Event; matches: number; waiting: number }) {
  const { c } = useTheme();
  const { t } = useT();
  const hasGroup = !!soloGroups[event.id];
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={[type.title2, { color: c.text, textAlign: 'center' }]}>{t('room.done.title')}</Text>
      <View style={styles.summary}>
        <View style={[styles.stat, { backgroundColor: c.surface }]}>
          <Text style={[type.title2, { color: c.text }]}>{matches}</Text>
          <Text style={[type.footnote, { color: c.muted }]}>{t('room.done.matches', { count: matches })}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: c.surface }]}>
          <Text style={[type.title2, { color: c.text }]}>{waiting}</Text>
          <Text style={[type.footnote, { color: c.muted }]}>{t('room.done.waiting', { count: waiting })}</Text>
        </View>
      </View>
      <Text style={[type.subhead, { color: c.muted, textAlign: 'center' }]}>
        {t('room.done.body')}
      </Text>
      <View style={styles.buttons}>
        <Button label={t('room.done.toChats')} onPress={() => router.navigate('/chats')} />
        {hasGroup && (
          <Button
            label={t('room.done.soloGroup')}
            variant="secondary"
            onPress={() => router.push({ pathname: '/event/[id]/group', params: { id: event.id } })}
          />
        )}
      </View>
    </View>
  );
}

// W05 keyboard hints under the deck: outlined key caps (12 semibold) + 13 pt muted labels.
export function KeyboardHints({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const { t } = useT();
  const hint = (key: string, text: string) => (
    <View style={styles.hint}>
      <View style={[styles.key, { borderColor: c.line }]}>
        <Text style={[onest('semibold', 12, 15), { color: c.text }]}>{key}</Text>
      </View>
      <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{text}</Text>
    </View>
  );
  return (
    <View style={[styles.hints, style]}>
      {hint(t('room.keys.right'), t('room.keys.go'))}
      {hint(t('room.keys.left'), t('room.keys.skip'))}
      {hint(t('room.keys.space'), t('room.keys.profile'))}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  go: { height: 60, borderRadius: 28 },
  goFlex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12, maxWidth: 420, alignSelf: 'center', width: '100%' },
  emoji: { fontSize: 56 },
  cta: { alignSelf: 'stretch', marginTop: 8 },
  summary: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  stat: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', gap: 2 },
  buttons: { alignSelf: 'stretch', gap: 12, marginTop: 8 },
  hints: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  key: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
});
