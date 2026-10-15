import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Gradient, RemoteImage } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { fonts, useTheme } from '@/theme';
import type { GradientId } from '@/theme/palette';

export type FacePerson = { name: string; gradient: GradientId; photoUri?: string };

type Props = FacePerson & {
  size: number;
  fontSize: number;
  font?: 'onest' | 'display'; // Figma «Face»: Onest Bold initials in stacks/rows, Unbounded on big faces
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
};

// Figma «Face»: initial on a 135° gradient circle. The initial uses the text token (dark on light theme).
export function Face({ name, gradient, photoUri, size, fontSize, font = 'onest', borderColor, borderWidth = 0, style }: Props) {
  const { c } = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const border = borderWidth > 0 ? { borderWidth, borderColor: borderColor ?? c.bg } : null;
  return (
    <View style={[shape, styles.clip, border, style]}>
      {photoUri ? (
        <RemoteImage uri={photoUri} style={StyleSheet.absoluteFill} />
      ) : (
        <Gradient id={gradient} style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={{ fontFamily: font === 'display' ? fonts.display : fonts.bold, fontSize, color: c.text }}>
            {name.trim().charAt(0).toUpperCase() || '?'}
          </Text>
        </Gradient>
      )}
    </View>
  );
}

// Overlapping faces (-8 pt) with a 2 pt ring in the surface colour (M08b/W05b headers, meeting-point card).
export function Faces({ people, size, fontSize }: { people: FacePerson[]; size: number; fontSize: number }) {
  const { c } = useTheme();
  return (
    <View style={styles.row}>
      {people.map((p, i) => (
        <Face key={i} {...p} size={size} fontSize={fontSize} borderWidth={2} borderColor={c.surface} style={i > 0 && styles.overlap} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  overlap: { marginLeft: -8 },
});
