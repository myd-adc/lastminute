import { MoreHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gradient, Pill } from '@/components/ui';
import { getInterest, getScene } from '@/data/mock';
import { useT } from '@/i18n';
import { t as translate } from '@/i18n/translate';
import type { Attendee } from '@/lib/selectors';
import { display, fonts, onest, useTheme } from '@/theme';

import { byGender, soloLabel } from './text';

type Props = {
  attendee: Attendee;
  width: number;
  height: number;
  showShared: boolean;
  expanded?: boolean; // «Space · профіль»: smaller photo, extra details
  onMore?: () => void;
  onPress?: () => void;
};

export const sharedLabel = (n: number) => translate('room.card.shared', { count: n });

// M09 person card: gradient photo with a huge initial, pills, name, scene · affiliation, tags, «Говори зі мною про».
export function PersonCard({ attendee, width, height, showShared, expanded, onMore, onPress }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const { user, attendance } = attendee;
  const photoH = Math.max(110, Math.min(expanded ? 130 : 240, height - 260));
  const initialSize = Math.min(150, Math.round(photoH * 0.66));
  const tags = user.tags.map(getInterest).filter((i) => !!i);
  const shared = showShared && user.sharedEvents > 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={`${user.name}, ${user.age}`}
      style={[styles.card, { width, height, backgroundColor: c.surface, borderColor: c.line }]}
    >
      <Gradient id={user.gradient} style={[styles.photo, { height: photoH }]}>
        <Text style={[styles.initial, { fontSize: initialSize, lineHeight: Math.round(initialSize * 1.1) }]}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
        {attendance.solo && <Pill label={soloLabel(user)} tone="bg" style={styles.solo} />}
        {shared && <Pill label={sharedLabel(user.sharedEvents)} tone="accent" style={styles.shared} />}
        {onMore && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('room.card.report')} hitSlop={8} onPress={onMore} style={styles.more}>
            <MoreHorizontal size={20} color="#F6F5F2" strokeWidth={2} />
          </Pressable>
        )}
      </Gradient>

      <View style={styles.body}>
        <View style={{ gap: 4 }}>
          <Text style={[display(22, 28), { letterSpacing: -0.44, color: c.text }]} numberOfLines={1}>
            {user.name}, {user.age}
          </Text>
          <Text style={[onest('regular', 14, 19), { color: c.muted }]} numberOfLines={1}>
            {getScene(user.sceneId).name} · {user.affiliation}
          </Text>
        </View>
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <Pill key={tag.id} label={`${tag.emoji} ${tag.label}`} weight="medium" />
            ))}
          </View>
        )}
        <View style={[styles.talk, { backgroundColor: c.bg }]}>
          <Text style={[onest('medium', 12, 16), { color: c.muted }]}>{t('room.card.talkAbout')}</Text>
          <Text style={[onest('semibold', 15, 20), { color: c.text }]} numberOfLines={expanded ? undefined : 3}>
            {user.talkAbout}
          </Text>
        </View>
        {expanded && (
          <View style={{ gap: 4 }}>
            <Text style={[onest('regular', 13, 18), { color: c.muted }]}>
              {attendance.solo ? t(byGender(user, 'room.card.soloDetailF', 'room.card.soloDetailM')) : t('room.card.withFriends')}
            </Text>
            {shared && (
              <Text style={[onest('regular', 13, 18), { color: c.muted }]}>
                {t('room.card.sharedLong', { count: user.sharedEvents })}
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// Plain sheet peeking out behind the top card (Figma: surface2, radius 28).
export function CardShadowSheet({ width, height }: { width: number; height: number }) {
  const { c } = useTheme();
  return <View style={{ width, height, borderRadius: 28, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line }} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  photo: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.display, color: '#F6F5F2', opacity: 0.92 },
  solo: { position: 'absolute', top: 14, left: 14 },
  shared: { position: 'absolute', bottom: 14, left: 14 },
  more: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,11,16,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  body: { padding: 16, gap: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  talk: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
});
