import { Image, StyleSheet, Text, View } from 'react-native';

import { fonts, useTheme } from '@/theme';
import type { GradientId } from '@/theme/palette';

import { Gradient } from './Gradient';

type Props = {
  name: string;
  gradient: GradientId;
  size: number;
  photoUri?: string;
  ring?: boolean; // 2px ring in the screen background colour, used in stacks
};

// Initial on a gradient circle — the Figma default when there is no photo.
export function Avatar({ name, gradient, size, photoUri, ring }: Props) {
  const { c } = useTheme();
  const ringStyle = ring && { borderWidth: 2, borderColor: c.bg };
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (photoUri) return <Image source={{ uri: photoUri }} style={[shape, ringStyle]} />;
  return (
    <View style={[shape, styles.clip, ringStyle]}>
      <Gradient id={gradient} style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={{ fontFamily: fonts.display, fontSize: Math.round(size * 0.42), color: '#F6F5F2' }}>
          {name.trim().charAt(0).toUpperCase() || '?'}
        </Text>
      </Gradient>
    </View>
  );
}

// Overlapping avatars with an optional «+11» bubble, as on feed cards and «Хто йде».
export function AvatarStack({
  people,
  size = 32,
  extra = 0,
}: {
  people: { name: string; gradient: GradientId }[];
  size?: number;
  extra?: number;
}) {
  const { c } = useTheme();
  const overlap = -Math.round(size * 0.28);
  return (
    <View style={styles.row}>
      {people.map((p, i) => (
        <View key={i} style={i > 0 && { marginLeft: overlap }}>
          <Avatar name={p.name} gradient={p.gradient} size={size} ring />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.center,
            { marginLeft: overlap, width: size, height: size, borderRadius: size / 2, backgroundColor: c.text, borderWidth: 2, borderColor: c.bg },
          ]}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(size * 0.36), color: c.bg }}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
