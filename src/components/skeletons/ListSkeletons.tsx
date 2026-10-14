import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goBack } from '@/components/ui';
import { Bone, Skeleton } from '@/components/ui/Skeleton';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';

// M12s: a section caption and five rows of avatar + two lines under the real "Chats" title.
export function ChatRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Skeleton style={{ gap: 24 }}>
      <Bone w={90} h={14} r={6} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <Bone w={52} h={52} r={26} />
          <View style={styles.lines}>
            <Bone w="62%" h={16} r={6} />
            <Bone w="85%" h={14} r={6} />
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

// M18s: community cards — dot, name, meta.
export function CommunityCardsSkeleton({ cards = 3 }: { cards?: number }) {
  const { c } = useTheme();
  return (
    <Skeleton style={{ gap: 12 }}>
      {Array.from({ length: cards }, (_, i) => (
        <View key={i} style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Bone w={44} h={44} r={22} />
          <View style={styles.lines}>
            <Bone w="45%" h={16} r={6} />
            <Bone w="75%" h={13} r={6} />
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

// M09s: an event room opened before the data is in (deep link, reload) — header, segmented, person card, actions.
export function RoomSkeleton() {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack('/')}>
          <ChevronLeft size={26} color={c.text} strokeWidth={2} />
        </Pressable>
        <View style={[styles.lines, { gap: 6 }]}>
          <Bone w="70%" h={18} r={6} />
          <Bone w="45%" h={13} r={6} />
        </View>
      </View>
      <Skeleton style={[styles.flex, { gap: 16, marginTop: 12 }]}>
        <Bone h={44} r={14} />
        <View style={[styles.person, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Bone h={240} r={0} />
          <View style={{ padding: 16, gap: 12 }}>
            <Bone w={170} h={28} r={8} />
            <Bone w={220} h={16} r={6} />
            <View style={styles.row}>
              <Bone w={90} h={30} r={15} />
              <Bone w={110} h={30} r={15} />
              <Bone w={80} h={30} r={15} />
            </View>
            <Bone h={70} r={14} />
          </View>
        </View>
        <View style={styles.flex} />
        <View style={styles.row}>
          <Bone w={60} h={60} r={30} />
          <Bone h={60} r={30} style={styles.flex} />
        </View>
      </Skeleton>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lines: { flex: 1, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 16, paddingVertical: 22, borderRadius: 18, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  person: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
});
