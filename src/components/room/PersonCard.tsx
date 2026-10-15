import { MoreHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Gradient, Pill, RemoteImage } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getInterest } from '@/data/mock';
import { useT } from '@/i18n';
import { withHandle } from '@/lib/username';
import { t as translate } from '@/i18n/translate';
import { nameAge, type Attendee } from '@/lib/selectors';
import { display, fonts, onest, useTheme } from '@/theme';

import { byGender, soloLabel } from './text';

type Props = {
  attendee: Attendee;
  width: number;
  height: number;
  showShared: boolean;
  expanded?: boolean; // "Space · profile": smaller photo, extra details
  onMore?: () => void;
  onPress?: () => void;
  wide?: boolean; // W05 card (380×520): taller photo, bigger initial and name
};

export const sharedLabel = (n: number) => translate('room.card.shared', { count: n });

// M09 person card: the photo (or a gradient with a huge initial), pills, name, @username · affiliation, tags, "Talk to me about".
// Figma M09: photo 240 / initial 150 / pills inset 14 / body 16·19; W05: 250 / 160 / 16 / 18·20.
export function PersonCard({ attendee, width, height, showShared, expanded, onMore, onPress, wide }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const { user, attendance } = attendee;
  const m = wide ? WIDE : MOBILE;
  const photoH = Math.max(110, Math.min(expanded ? 130 : m.photo, height - 260));
  const initialSize = Math.round((photoH * m.initial) / m.photo);
  const tags = user.tags.map(getInterest).filter((i) => !!i);
  const shared = showShared && user.sharedEvents > 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={nameAge(user)}
      style={[styles.card, { width, height, backgroundColor: c.surface, borderColor: c.line }]}
    >
      <Gradient id={user.gradient} style={[styles.photo, { height: photoH }]}>
        {user.photoUri ? (
          <RemoteImage uri={user.photoUri} style={StyleSheet.absoluteFill} />
        ) : (
          <Text
            style={[
              styles.initial,
              {
                color: c.text,
                fontSize: initialSize,
                lineHeight: Math.round(initialSize * 1.24),
                transform: [{ translateY: -Math.round((photoH * m.lift) / m.photo) }],
              },
            ]}
          >
            {user.name.charAt(0).toUpperCase()}
          </Text>
        )}
        {attendance.solo && <Pill label={soloLabel(user)} tone="bg" style={[styles.abs, { top: m.inset, left: m.inset }]} />}
        {shared && <Pill label={sharedLabel(user.sharedEvents)} tone="accent" style={[styles.abs, { bottom: m.inset, left: m.inset }]} />}
        {onMore && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('room.card.report')} hitSlop={8} onPress={onMore} style={styles.more}>
            <MoreHorizontal size={20} color="#F6F5F2" strokeWidth={2} />
          </Pressable>
        )}
      </Gradient>

      <View style={[styles.body, { paddingTop: m.bodyTop, paddingHorizontal: m.bodyX }]}>
        <Text style={[display(m.name, Math.round(m.name * 1.24)), { color: c.text }]} numberOfLines={1}>
          {nameAge(user)}
        </Text>
        <Text style={[onest('regular', 14, 18), { color: c.muted }]} numberOfLines={1}>
          {withHandle(user.username, user.affiliation)}
        </Text>
        {!!user.languages?.length && (
          <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={1}>
            {t('room.card.speaks', { langs: user.languages.map((id) => t(`common.languages.${id}`)).join(' · ') })}
          </Text>
        )}
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <Pill key={tag.id} label={`${tag.emoji} ${tag.label}`} weight="medium" />
            ))}
          </View>
        )}
        {!!user.talkAbout.trim() && (
          <View style={[styles.talk, { backgroundColor: c.bg }]}>
            <Text style={[onest('medium', 12, 15), { color: c.muted }]}>{t('room.card.talkAbout')}</Text>
            <Text style={[onest('semibold', 15, 20), { color: c.text }]} numberOfLines={expanded ? undefined : 3}>
              {user.talkAbout}
            </Text>
          </View>
        )}
        {expanded && (
          <View style={{ gap: 4 }}>
            <Text style={[onest('regular', 13, 18), { color: c.muted }]}>
              {attendance.solo ? t(byGender(user, 'room.card.soloDetailF', 'room.card.soloDetailM')) : t('room.card.withFriends')}
            </Text>
            {shared && <Text style={[onest('regular', 13, 18), { color: c.muted }]}>{t('room.card.sharedLong', { count: user.sharedEvents })}</Text>}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// Plain sheet peeking out behind the top card (Figma «Card behind»: surface2, radius 28, no border).
export function CardShadowSheet({ width, height }: { width: number; height: number }) {
  const { c } = useTheme();
  return <View style={{ width, height, borderRadius: 28, backgroundColor: c.surface2 }} />;
}

// `lift` = how far the Figma initial sits above the vertical centre of the photo.
const MOBILE = { photo: 240, initial: 150, lift: 7, inset: 14, bodyTop: 16, bodyX: 19, name: 22 };
const WIDE = { photo: 250, initial: 160, lift: 10, inset: 16, bodyTop: 18, bodyX: 20, name: 24 };

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  photo: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.display },
  abs: { position: 'absolute' },
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
  body: { paddingBottom: 16, gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  talk: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
});
