import { StyleSheet, Text, View } from 'react-native';

import { initial } from '@/lib/format';
import { avatarColors, colors, fonts } from '@/theme';

import { Icon } from './Icon';

type Props = {
  name: string;
  color: string;
  size: number;
  fontSize?: number;
  ring?: boolean; // white 2px border used in stacks
};

export function Avatar({ name, color, size, fontSize = 18, ring }: Props) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ring && styles.ring,
      ]}
    >
      <Text style={[styles.text, { fontSize, lineHeight: Math.max(fontSize + 4, 14) }]}>{initial(name)}</Text>
    </View>
  );
}

// The current user's avatar; a neutral person glyph until they have a profile.
export function MeAvatar({ name, size, fontSize }: { name?: string; size: number; fontSize?: number }) {
  if (name) return <Avatar name={name} color={avatarColors[4]} size={size} fontSize={fontSize} />;
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.fill }]}>
      <Icon name="person" size={size * 0.6} color={colors.label2} />
    </View>
  );
}

export function AvatarStack({ people, size }: { people: { name: string; color: string }[]; size: number }) {
  return (
    <View style={styles.stack}>
      {people.map((p, i) => (
        <View key={i} style={i > 0 && { marginLeft: -10 }}>
          <Avatar name={p.name} color={p.color} size={size} fontSize={11} ring />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { borderWidth: 2, borderColor: colors.elevated },
  text: { fontFamily: fonts.semibold, color: colors.elevated, letterSpacing: -0.43 },
  stack: { flexDirection: 'row' },
});
