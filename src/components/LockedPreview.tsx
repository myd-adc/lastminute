import type { ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';

import { avatarColors, colors, type } from '@/theme';

import { Avatar } from './Avatar';
import { Icon } from './Icon';

// "Locked" card: blurred faces + lock, shown until the user marks "Я йду".
export function LockedPreview({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.stack}>
        {avatarColors.map((c, i) => (
          <View key={c} style={i > 0 && { marginLeft: -12 }}>
            <Avatar name="•" color={c} size={44} ring />
          </View>
        ))}
        <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />
      </View>
      <Icon name="lock" size={24} color={colors.label3} />
      <Text style={[type.headline, styles.center]}>{title}</Text>
      <Text style={[type.subhead, styles.center, { color: colors.label2 }]}>{body}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  stack: { flexDirection: 'row', borderRadius: 22, overflow: 'hidden' },
  center: { textAlign: 'center', alignSelf: 'stretch' },
});
