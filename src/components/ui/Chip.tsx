import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { onest, useTheme } from '@/theme';

// Figma «Chip» (40 pt): Default = surface + line border, Selected = accent. Used for interests, vibe, quick replies.
export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={[onest('medium', 15), { color: selected ? c.onAccent : c.text }]}>{label}</Text>
    </Pressable>
  );
}

// Small rounded label (13 pt semibold, 14 radius): date pills, «Йде сама», «3 / 14», tags on cards.
export function Pill({
  label,
  tone = 'surface2',
  style,
  weight = 'semibold',
}: {
  label: string;
  tone?: 'surface2' | 'accent' | 'bg' | 'glass' | 'outline' | 'accentOutline';
  style?: StyleProp<ViewStyle>;
  weight?: 'medium' | 'semibold';
}) {
  const { c } = useTheme();
  const look: Record<string, { bg: string; fg: string; border?: string }> = {
    surface2: { bg: c.surface2, fg: c.text },
    accent: { bg: c.accent, fg: c.onAccent },
    bg: { bg: c.bg, fg: c.text },
    glass: { bg: 'rgba(11,11,16,0.45)', fg: '#F6F5F2', border: 'rgba(255,255,255,0.18)' },
    outline: { bg: 'transparent', fg: c.text, border: c.line },
    accentOutline: { bg: c.accentSoft, fg: c.accent, border: c.accent },
  };
  const l = look[tone];
  return (
    <View style={[styles.pill, { backgroundColor: l.bg }, l.border ? { borderWidth: 1, borderColor: l.border } : null, style]}>
      <Text style={[onest(weight, 13), { color: l.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
});
