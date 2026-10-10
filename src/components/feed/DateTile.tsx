import { StyleSheet, Text, View } from 'react-native';

import { time, weekdayShort } from '@/lib/time';
import { onest, useTheme } from '@/theme';

// «FRI / 21:00» tile from W03 «Next in your scene» and the Scene tab lists.
export function DateTile({ iso }: { iso: string }) {
  const { c, scheme } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: c.surface2 }]}>
      <Text style={[onest('bold', 12), { color: scheme === 'light' ? '#5A7A00' : c.accent }]}>{weekdayShort(iso)}</Text>
      <Text style={[onest('medium', 12), { color: c.muted }]}>{time(iso)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 56, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
