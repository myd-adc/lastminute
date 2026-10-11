import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { onest, useTheme } from '@/theme';

// Feed rail button (M06 right rail, W03 save/share): 48 pt circle, 12 pt semibold caption 4 pt below.
// `tone`: «poster» = translucent over the poster art (M06), «surface» = surface2 on the page (W03).
export function RailButton({
  icon: Icon,
  label,
  onPress,
  active,
  tone,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  label?: string;
  onPress: () => void;
  active?: boolean;
  tone: 'poster' | 'surface';
  accessibilityLabel?: string;
}) {
  const { c, scheme } = useTheme();
  const poster = tone === 'poster';
  const bg = active ? c.accent : poster ? (scheme === 'light' ? 'rgba(246,245,241,0.45)' : 'rgba(11,11,16,0.45)') : c.surface2;
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [styles.circle, { backgroundColor: bg }, pressed && { opacity: 0.8 }]}
      >
        <Icon size={20} color={active ? c.onAccent : c.text} strokeWidth={2} />
      </Pressable>
      {label ? <Text style={[onest('semibold', 12, 15), { color: poster ? c.text : c.muted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  circle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
