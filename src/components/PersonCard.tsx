import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { User } from '@/data/types';
import { colors, type } from '@/theme';

import { Avatar } from './Avatar';
import { Button, type ButtonVariant } from './Button';

export type PersonStatus = 'none' | 'incoming' | 'requested' | 'matched' | 'expired';

type Props = {
  user: User;
  note?: string;
  status: PersonStatus;
  onMeet: () => void;
  onChat: () => void;
  onBlock: () => void;
  wide?: boolean;
};

const actions: Record<PersonStatus, { label: string; variant: ButtonVariant; hint: string }> = {
  none: { label: 'Познайомитись', variant: 'tinted', hint: 'без точної локації' },
  incoming: { label: 'Познайомитись', variant: 'tinted', hint: 'хоче познайомитись' },
  requested: { label: 'Запит надіслано', variant: 'quiet', hint: 'чекаємо на згоду' },
  matched: { label: 'Написати', variant: 'filled', hint: 'збіг · чат відкрито' },
  expired: { label: 'Чат закрито', variant: 'quiet', hint: 'збіг · минуло 24 год' },
};

export function PersonCard({ user, note, status, onMeet, onChat, onBlock, wide }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const action = actions[status];
  const onPress = status === 'matched' ? onChat : status === 'none' || status === 'incoming' ? onMeet : undefined;

  return (
    <View style={wide ? styles.cardWide : styles.card}>
      <View style={[styles.who, wide && { gap: 14 }]}>
        <Avatar name={user.name} color={user.color} size={48} />
        <View style={styles.name}>
          <Text style={wide ? type.webH3 : type.headline}>{user.name}</Text>
          <Text style={[wide ? type.webCaption : type.subhead, styles.muted]}>{user.affiliation}</Text>
        </View>
        <Pressable
          accessibilityLabel="Більше дій"
          hitSlop={10}
          onPress={() => setMenuOpen((v) => !v)}
          style={styles.more}
        >
          <Text style={[type.headline, { color: colors.label3 }]}>•••</Text>
        </Pressable>
      </View>

      {menuOpen && (
        <View style={styles.menu}>
          <Pressable onPress={onBlock} hitSlop={6}>
            <Text style={[type.subheadMedium, { color: colors.tint }]}>Заблокувати</Text>
          </Pressable>
          <Text style={[type.footnote, styles.muted, { flex: 1 }]}>Ви більше не побачите одне одного.</Text>
        </View>
      )}

      <View style={[styles.quote, wide && { borderRadius: 12 }]}>
        <Text style={wide ? type.webBody : type.callout}>{note ?? user.bio}</Text>
      </View>
      <Text style={[wide ? type.webCaption : type.footnote, styles.tags]}>{user.tags.join(' · ')}</Text>

      {wide ? (
        <Button title={action.label} variant={action.variant} size="web" onPress={onPress} />
      ) : (
        <View style={styles.action}>
          <Button title={action.label} variant={action.variant} size="md" onPress={onPress} style={{ width: 190 }} />
          <Text style={[type.caption, styles.tags]}>{action.hint}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWide: {
    backgroundColor: colors.elevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 20,
    gap: 14,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1, gap: 2 },
  more: { alignSelf: 'flex-start', paddingHorizontal: 2 },
  menu: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muted: { color: colors.label2 },
  quote: { backgroundColor: colors.fill, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  tags: { color: colors.label3 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
