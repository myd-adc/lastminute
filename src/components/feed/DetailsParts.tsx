import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarStack, Gradient } from '@/components/ui';
import { useT } from '@/i18n';
import { type GradientId, type, useTheme } from '@/theme';

// Divider row with an icon tile (M07/W04: venue, price, who is going).
export function InfoRow({ icon: Icon, title, sub, right, onPress }: { icon: LucideIcon; title: string; sub?: string; right?: ReactNode; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.row, { borderTopColor: c.line }]}>
      <View style={[styles.tile, { backgroundColor: c.surface2 }]}>
        <Icon size={20} color={c.text} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: c.text }]}>{title}</Text>
        {sub ? <Text style={[type.footnote, { color: c.muted }]}>{sub}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

// Faces of other attendees. Until the user presses «I’m going» they are blurred circles without initials (symmetry).
export function PeopleStack({ people, extra, revealed, size = 36 }: { people: { name: string; gradient: GradientId }[]; extra: number; revealed: boolean; size?: number }) {
  const { c } = useTheme();
  const { t } = useT();
  if (revealed) return <AvatarStack people={people} size={size} extra={extra} />;
  const overlap = -Math.round(size * 0.28);
  return (
    <View style={styles.stack} accessibilityLabel={t('feed.details.facesHidden')}>
      {people.map((p, i) => (
        <View key={i} style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: c.surface, overflow: 'hidden' }, i > 0 && { marginLeft: overlap }]}>
          <Gradient id={p.gradient} style={[StyleSheet.absoluteFill, Platform.OS === 'web' && styles.blur]} />
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.extra, { marginLeft: overlap, width: size, height: size, borderRadius: size / 2, backgroundColor: c.text, borderColor: c.surface }]}>
          <Text style={[type.caption, { color: c.bg, fontSize: Math.round(size * 0.34) }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16, borderTopWidth: 1 },
  tile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  blur: { filter: 'blur(3px)' },
  extra: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
