import { router } from 'expo-router';
import { Check, Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Community } from '@/data/types';
import { useT } from '@/i18n';
import { onest, useTheme } from '@/theme';

import { CommunityAvatar } from './CommunityAvatar';
import { communityCounts, communityMeta } from './text';

// M18 row: gradient dot, name, access · members · events, and on the right what tapping leads to: "Join",
// "With email" for a domain-only one, or "You're in". A bare ring there read as a radio button nobody understood.
// `compact` is for the list of communities the user is already in, where the name is all they are scanning for:
// one line of meta and a smaller dot, so a long membership list still fits on a phone.
export function CommunityCard({ community, member, compact }: { community: Community; member: boolean; compact?: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
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
      {member ? (
        compact ? (
          verified && (
            <View style={[styles.check, { backgroundColor: c.accent }]}>
              <Check size={14} color={c.onAccent} strokeWidth={3} />
            </View>
          )
        ) : (
          <View style={[styles.pill, { backgroundColor: c.surface2 }]}>
            <Check size={14} color={c.accentInk} strokeWidth={3} />
            <Text style={[onest('semibold', 13), { color: c.text }]}>{t('community.list.joined')}</Text>
          </View>
        )
      ) : community.emailDomain ? (
        <View style={[styles.pill, { borderWidth: 1, borderColor: c.line }]}>
          <Lock size={13} color={c.muted} strokeWidth={2} />
          <Text style={[onest('semibold', 13), { color: c.muted }]}>{t('community.list.joinWithEmail')}</Text>
        </View>
      ) : (
        <View style={[styles.pill, { backgroundColor: c.accent }]}>
          <Text style={[onest('semibold', 13), { color: c.onAccent }]}>{t('community.list.join')}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 16, paddingVertical: 14, borderRadius: 18, borderWidth: 1 },
  compact: { gap: 12, paddingLeft: 12, paddingRight: 14, paddingVertical: 10, borderRadius: 16 },
  body: { flex: 1, gap: 3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 12, borderRadius: 15 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
