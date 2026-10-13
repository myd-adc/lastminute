import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Gradient } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Community } from '@/data/types';
import { onest, useTheme } from '@/theme';

import { communityMeta } from './text';

// M18 row: gradient dot, name, access · members · events. The accent outline and check mark a membership
// confirmed by e-mail; open communities keep the plain ring even when joined.
export function CommunityCard({ community, member }: { community: Community; member: boolean }) {
  const { c } = useTheme();
  const verified = member && !!community.emailDomain;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}
      style={({ pressed }) => [styles.card, { backgroundColor: c.surface, borderColor: verified ? c.accent : c.line }, pressed && { opacity: 0.85 }]}
    >
      <Gradient id={community.gradient} style={styles.dot} />
      <View style={styles.body}>
        <Text style={[onest('bold', 16, 20), { color: c.text }]} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={[onest('regular', 13, 17.5), { color: verified ? c.accentInk : c.muted }]}>
          {communityMeta(community, member)}
        </Text>
      </View>
      {verified ? (
        <View style={[styles.check, { backgroundColor: c.accent }]}>
          <Check size={14} color={c.onAccent} strokeWidth={3} />
        </View>
      ) : (
        <View style={[styles.check, { borderWidth: 1.5, borderColor: c.line }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 16, paddingVertical: 14, borderRadius: 18, borderWidth: 1 },
  dot: { width: 44, height: 44, borderRadius: 22 },
  body: { flex: 1, gap: 3 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
