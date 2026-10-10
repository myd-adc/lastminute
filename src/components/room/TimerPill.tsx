import { Clock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { countdown } from '@/lib/time';
import { onest, useTheme } from '@/theme';

// «⏱ 27 год» — accent-outlined countdown pill (M08b header, W05 match rows).
export function TimerPill({ ms }: { ms: number }) {
  const { c, scheme } = useTheme();
  const fg = scheme === 'light' ? c.text : c.accent;
  return (
    <View style={[styles.pill, { borderColor: c.accent, backgroundColor: scheme === 'light' ? c.accentSoft : 'transparent' }]}>
      <Clock size={14} color={fg} strokeWidth={2.2} />
      <Text style={[onest('semibold', 13), { color: fg }]}>{countdown(ms)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1.5 },
});
