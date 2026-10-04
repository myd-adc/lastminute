import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, type } from '@/theme';

export type ButtonVariant = 'filled' | 'tinted' | 'quiet';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  // "lg" — full iOS button (50pt), "md" — card action (44pt), "web" — web card action.
  size?: 'lg' | 'md' | 'web';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'filled', size = 'lg', disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[size === 'web' ? type.webBodyMedium : type.headline, textColor[variant]]}>{title}</Text>
    </Pressable>
  );
}

const textColor = StyleSheet.create({
  filled: { color: colors.elevated },
  tinted: { color: colors.tint },
  quiet: { color: colors.label2 },
});

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  lg: { paddingVertical: 14, borderRadius: 25 },
  md: { height: 44, borderRadius: 25 },
  web: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 22 },
  filled: { backgroundColor: colors.tint },
  tinted: { backgroundColor: colors.tintSoft },
  quiet: { backgroundColor: colors.fill },
});
