import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Community } from '@/data/types';
import { onest, useTheme } from '@/theme';

import { CommunityAvatar } from './CommunityAvatar';
import { communityCounts, communityMeta } from './text';

// M18 row: gradient dot, name, access · members · events. The accent outline and check mark a membership
// confirmed by e-mail; open communities keep the plain ring even when joined.
// `compact` is for the list of communities the user is already in, where the name is all they are scanning for:
// one line of meta and a smaller dot, so a long membership list still fits on a phone.
export function CommunityCard({ community, member, compact }: { community: Community; member: boolean; compact?: boolean }) {
  const { c } = useTheme();
  const verified = member && !!community.emailDomain;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        { backgroundColor: c.surface, borderColor: verified ? c.accent : c.line },
        pressed && { opacity: 0.85 },
      ]}
    >
      <CommunityAvatar community={community} size={compact ? 34 : 44} />
      <View style={styles.body}>
        <Text style={[onest('bold', compact ? 15 : 16, compact ? 19 : 20), { color: c.text }]} numberOfLines={1}>
          {community.name}
        </Text>
        <Text
          style={[onest('regular', compact ? 12 : 13, compact ? 16 : 17.5), { color: verified ? c.accentInk : c.muted }]}
          numberOfLines={compact ? 1 : undefined}
        >
          {/* A member already knows how they got in; what they want from the row is how much is on this week. */}
          {compact ? communityCounts(community) : communityMeta(community, member)}
        </Text>
      </View>
      {verified ? (
        <View style={[styles.check, { backgroundColor: c.accent }]}>
          <Check size={14} color={c.onAccent} strokeWidth={3} />
        </View>
      ) : compact ? null : (
        <View style={[styles.check, { borderWidth: 1.5, borderColor: c.line }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 16, paddingVertical: 14, borderRadius: 18, borderWidth: 1 },
  compact: { gap: 12, paddingLeft: 12, paddingRight: 14, paddingVertical: 10, borderRadius: 16 },
  body: { flex: 1, gap: 3 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
