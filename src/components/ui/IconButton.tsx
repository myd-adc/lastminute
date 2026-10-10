import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { type, useTheme } from '@/theme';

type Props = {
  icon: LucideIcon;
  onPress?: () => void;
  size?: number; // 56/60 for action rows, 44 on rails, 36 in headers
  variant?: 'surface' | 'glass' | 'accent' | 'plain';
  label?: string; // caption under the button (feed right rail: «Зберегти», «Другу»)
  active?: boolean; // filled state, e.g. saved bookmark
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon: Icon, onPress, size = 56, variant = 'surface', label, active, accessibilityLabel, style }: Props) {
  const { c } = useTheme();
  const bg =
    variant === 'accent' || active
      ? c.accent
      : variant === 'glass'
        ? 'rgba(11,11,16,0.45)'
        : variant === 'plain'
          ? 'transparent'
          : c.surface2;
  const fg = variant === 'accent' || active ? c.onAccent : variant === 'glass' ? '#F6F5F2' : c.text;
  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [
          styles.center,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
          variant === 'glass' && styles.glassBorder,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Icon size={Math.round(size * 0.42)} color={fg} strokeWidth={2} />
      </Pressable>
      {label && <Text style={[type.caption, { color: variant === 'glass' ? '#F6F5F2' : c.text }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  center: { alignItems: 'center', justifyContent: 'center' },
  glassBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
});
