import { router } from 'expo-router';
import { CalendarPlus, UsersRound, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { t, useT } from '@/i18n';
import { onest, useTheme } from '@/theme';

import { Sheet } from './Sheet';
import { Text } from './Text';

// What the «+» offers: an event of your own, or a whole community. Shared by the phone's tab bar and the
// wide-web sidebar, so both ways in lead to exactly the same two choices.
export function CreateSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  useT(); // re-render on language change
  const go = (href: '/event/new' | '/community/new') => {
    onClose();
    router.push(href);
  };
  const row = (icon: LucideIcon, label: string, sub: string, onPress: () => void, last?: boolean) => {
    const Icon = icon;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.line }, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: c.accentSoft }]}>
          <Icon size={20} color={c.accentInk} strokeWidth={2} />
        </View>
        <View style={styles.rowText}>
          <Text style={[onest('semibold', 16, 20), { color: c.text }]}>{label}</Text>
          <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{sub}</Text>
        </View>
      </Pressable>
    );
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={[onest('bold', 20, 25), { color: c.text }]}>{t('common.add.title')}</Text>
      <View style={[styles.rows, { backgroundColor: c.bg }]}>
        {row(CalendarPlus, t('common.add.event'), t('common.add.eventSub'), () => go('/event/new'))}
        {row(UsersRound, t('common.add.community'), t('common.add.communitySub'), () => go('/community/new'), true)}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  rows: { borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
});
