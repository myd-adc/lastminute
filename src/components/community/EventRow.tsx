import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DateTile } from '@/components/feed/DateTile';
import { Text } from '@/components/ui/Text';
import type { Event } from '@/data/types';
import { going } from '@/lib/time';
import { onest, useTheme } from '@/theme';

// «MON 20:00 · Open mic… · 14 going» row (W03 «Next for you», M19 «Upcoming»).
export function EventRow({ event, count }: { event: Event; count: number }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: c.line }, pressed && { opacity: 0.8 }]}
    >
      <DateTile iso={event.startsAt} />
      <View style={styles.body}>
        <Text style={[onest('semibold', 15, 19), { color: c.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{going(count)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { flex: 1, gap: 2 },
});
