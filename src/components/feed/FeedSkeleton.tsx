import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bone, Skeleton } from '@/components/ui/Skeleton';
import { tabBarClearance } from '@/lib/layout';
import { useTheme } from '@/theme';

// M06s: the real tabs over a flat surface; bones where the poster words, pills, title, «хто йде» and actions go.
export function MobileFeedSkeleton({ header }: { header: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { backgroundColor: c.surface }]}>
      <Skeleton style={[styles.flex, styles.mobile, { paddingTop: insets.top + 100, paddingBottom: tabBarClearance(insets.bottom) }]}>
        <View style={{ gap: 10 }}>
          <Bone w={220} h={96} r={14} />
          <Bone w={150} h={96} r={14} />
        </View>
        <View style={styles.flex} />
        <View style={styles.bottom}>
          <View style={[styles.flex, { gap: 16 }]}>
            <View style={styles.row}>
              <Bone w={96} h={32} r={16} />
              <Bone w={120} h={32} r={16} />
            </View>
            <View style={{ gap: 8 }}>
              <Bone w="92%" h={30} r={8} />
              <Bone w="68%" h={30} r={8} />
            </View>
            <Bone h={56} r={18} />
          </View>
          <View style={styles.rail}>
            <Bone w={52} h={52} r={26} />
            <Bone w={52} h={52} r={26} />
            <Bone w={52} h={52} r={26} />
          </View>
        </View>
        <View style={[styles.row, { marginTop: 18 }]}>
          <Bone w={56} h={56} r={28} />
          <Bone h={56} r={28} style={styles.flex} />
        </View>
      </Skeleton>
      <View style={[styles.header, { top: insets.top + 8 }]}>{header}</View>
    </View>
  );
}

// W03s: the real tabs; a bone card where the poster goes and bones for «Хто йде» and «Далі для тебе» on the right.
export function WideFeedSkeleton({ tabs, cardW, cardH, panelW }: { tabs: ReactNode; cardW: number; cardH: number; panelW: number }) {
  const { c } = useTheme();
  const k = cardH / 720;
  return (
    <Skeleton style={styles.wideRoot}>
      <View style={[styles.flex, styles.centre]}>
        <View style={styles.tabs}>{tabs}</View>
        <View style={styles.stage}>
          <View style={[styles.card, { width: cardW, height: cardH, backgroundColor: c.surface, padding: 24 * k }]}>
            <View style={{ gap: 10, marginTop: 96 * k }}>
              <Bone w="60%" h={110 * k} r={14} />
              <Bone w="42%" h={110 * k} r={14} />
            </View>
            <View style={styles.flex} />
            <View style={{ gap: 12 }}>
              <View style={styles.row}>
                <Bone w={110} h={32} r={16} />
                <Bone w={130} h={32} r={16} />
              </View>
              <Bone w="82%" h={34} r={8} />
              <Bone w="60%" h={34} r={8} />
              <View style={[styles.row, { marginTop: 12 }]}>
                <Bone w={56} h={56} r={28} />
                <Bone h={56} r={28} style={styles.flex} />
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.panel, { width: panelW, borderLeftColor: c.line }]}>
        <Bone w={200} h={26} r={8} />
        <Bone h={62} r={16} />
        {[0, 1, 2].map((i) => (
          <Bone key={i} h={56} r={16} />
        ))}
        <Bone w={160} h={22} r={8} style={{ marginTop: 16 }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.row, { paddingVertical: 10 }]}>
            <Bone w={64} h={50} r={12} />
            <View style={[styles.flex, { gap: 8 }]}>
              <Bone w="80%" h={16} r={6} />
              <Bone w="35%" h={13} r={6} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mobile: { paddingHorizontal: 20 },
  header: { position: 'absolute', left: 20, right: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 26 },
  rail: { gap: 32, marginBottom: 76 },
  wideRoot: { flex: 1, flexDirection: 'row' },
  centre: { paddingTop: 32, paddingBottom: 24 },
  tabs: { alignSelf: 'flex-start', marginLeft: 42 },
  stage: { alignItems: 'center', marginTop: 29, paddingLeft: 12 },
  card: { borderRadius: 28 },
  panel: { borderLeftWidth: 1, paddingTop: 32, paddingHorizontal: 28, gap: 12 },
});
