import { ChevronRight } from 'lucide-react-native';
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useIsWide } from '@/lib/layout';
import { onest, useTheme } from '@/theme';

// Grouped rows of the profile / settings frames, sized per frame:
// M16 rows pl16 pr14 py12; M16b (`dense`) py10; W09 (wide web) pl18 pr16 py14 with 13 pt subtitles.
// Labels Onest Medium 15, subtitles Regular 12 (13 wide), values Medium 13, chevron 16, group radius 18.
type Density = 'regular' | 'dense' | 'wide';
const DensityContext = createContext<Density>('regular');

function useDensity(): Density {
  const wide = useIsWide();
  const d = useContext(DensityContext);
  return wide ? 'wide' : d;
}

export function Group({ children, dense, style }: { children: ReactNode; dense?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <DensityContext.Provider value={dense ? 'dense' : 'regular'}>
      <View style={[styles.group, { backgroundColor: c.surface }, style]}>{children}</View>
    </DensityContext.Provider>
  );
}

// Section caption: Onest SemiBold 13 muted (14 on wide web). Spacing comes from the parent column's gap.
export function GroupLabel({ children }: { children: string }) {
  const { c } = useTheme();
  const wide = useIsWide();
  return <Text style={[onest('semibold', wide ? 14 : 13), { color: c.muted }]}>{children}</Text>;
}

export function Row({
  label,
  sub,
  value,
  valueColor,
  right,
  chevron,
  onPress,
  destructive,
  last,
}: {
  label: string;
  sub?: string;
  value?: string;
  valueColor?: string;
  right?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();
  const density = useDensity();
  const wide = density === 'wide';
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        wide ? styles.rowWide : density === 'dense' ? styles.rowDense : styles.rowRegular,
        !last && { borderBottomWidth: 1, borderBottomColor: c.line },
        pressed && { backgroundColor: c.surface2 },
      ]}
    >
      <View style={[styles.text, { gap: wide ? 3 : 2 }]}>
        <Text style={[onest('medium', 15, 19), { color: destructive ? c.danger : c.text }]}>{label}</Text>
        {sub && <Text style={[onest('regular', wide ? 13 : 12, wide ? 18 : 16), { color: c.muted }]}>{sub}</Text>}
      </View>
      {value !== undefined && (
        <Text style={[onest('medium', 13), { color: valueColor ?? c.muted }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {right}
      {chevron && <ChevronRight size={16} color={c.muted} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 46 },
  rowRegular: { gap: 10, paddingLeft: 16, paddingRight: 14, paddingVertical: 12 },
  rowDense: { gap: 10, paddingLeft: 16, paddingRight: 14, paddingVertical: 10 },
  rowWide: { gap: 12, paddingLeft: 18, paddingRight: 16, paddingVertical: 14 },
  text: { flex: 1 },
});
