import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { time, weekdayShort } from '@/lib/time';
import { onest, useTheme } from '@/theme';

// «FRI / 21:00» tile from W03 «Next in your scene» (64×48, 12 radius) and the Scene tab lists.
export function DateTile({ iso }: { iso: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: c.surface2 }]}>
      <Text style={[onest('bold', 13, 16), { color: c.accentInk }]}>{weekdayShort(iso)}</Text>
      <Text style={[onest('regular', 12, 15), { color: c.muted }]}>{time(iso)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 64, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
