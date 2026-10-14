import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { onest, useTheme } from '@/theme';

// Feed rail button (M06 right rail: 44 pt circle, W03 save/share: 48 pt), 12 pt semibold caption 4 pt below.
// `tone`: «poster» = translucent over the poster art (M06), «surface» = surface2 on the page (W03).
export function RailButton({
  icon: Icon,
  label,
  onPress,
  active,
  tone,
  size = 48,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  label?: string;
  onPress: () => void;
  active?: boolean;
  tone: 'poster' | 'surface';
  size?: number;
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
        style={({ pressed }) => [styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, pressed && { opacity: 0.8 }]}
      >
        <Icon size={size < 48 ? 18 : 20} color={active ? c.onAccent : c.text} strokeWidth={2} />
      </Pressable>
      {label ? <Text style={[onest('semibold', 12, 15), { color: poster ? c.text : c.muted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  circle: { alignItems: 'center', justifyContent: 'center' },
});
