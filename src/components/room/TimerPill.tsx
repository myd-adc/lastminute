import { Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { countdown } from '@/lib/time';
import { onest, useTheme } from '@/theme';

// «⏱ 27 год» — accent-outlined countdown pill. `sm` = M08b/W05b group headers, `md` = W05 match rows.
export function TimerPill({ ms, size = 'md' }: { ms: number; size?: 'sm' | 'md' }) {
  const { c, scheme } = useTheme();
  const fg = c.accentInk;
  const sm = size === 'sm';
  return (
    <View style={[styles.pill, sm ? styles.sm : styles.md, { borderColor: c.accent, backgroundColor: scheme === 'light' ? c.accentSoft : 'transparent' }]}>
      <Clock size={sm ? 13 : 14} color={fg} strokeWidth={2.2} />
      <Text style={[onest('semibold', sm ? 12 : 13), { color: fg }]}>{countdown(ms)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  sm: { gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  md: { gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
});
