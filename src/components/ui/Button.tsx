import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { type, useTheme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg'; // md = 48 (web/inline), lg = 56 (Figma «Button»); pass style={{height: 60}} for the 60 pt CTAs
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Figma «Button»: Primary (accent), Secondary (surface2), Ghost (1.5 px line border). Pill-shaped.
export function Button({ label, onPress, variant = 'primary', size = 'lg', icon: Icon, disabled, loading, style }: Props) {
  const { c } = useTheme();
  const bg = variant === 'primary' ? c.accent : variant === 'secondary' ? c.surface2 : 'transparent';
  const fg = variant === 'primary' ? c.onAccent : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled || loading || !onPress}
      style={({ pressed }) => [
        styles.base,
        { height: size === 'lg' ? 56 : 48, borderRadius: 28, backgroundColor: bg },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: c.line },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon && <Icon size={20} color={fg} strokeWidth={2} />}
          <Text style={[type.button, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
});
