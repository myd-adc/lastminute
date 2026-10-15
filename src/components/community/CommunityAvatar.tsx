import { StyleSheet } from 'react-native';

import { Gradient, RemoteImage } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Community } from '@/data/types';
import { onest } from '@/theme';

type Props = { community: Pick<Community, 'name' | 'gradient' | 'photoUri'>; size: number; initial?: boolean };

// Round community cover: the photo, or the name's initial on the community gradient.
export function CommunityAvatar({ community, size, initial = size >= 56 }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (community.photoUri) return <RemoteImage uri={community.photoUri} style={shape} />;
  return (
    <Gradient id={community.gradient} style={[shape, styles.center]}>
      {initial && <Text style={[onest('bold', Math.round(size * 0.39)), styles.initial]}>{community.name.trim()[0]?.toUpperCase()}</Text>}
    </Gradient>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { color: '#fff' },
});

export const avatarBadge = StyleSheet.create({
  // 28 pt accent badge on the avatar's bottom-right edge (camera / palette in M20–M22).
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
