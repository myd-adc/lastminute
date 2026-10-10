import { Check, ChevronRight } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { onest, type, useTheme } from '@/theme';

// Figma «Segmented» (44 pt, surface track, surface2 active segment).
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: K; label: string; icon?: ReactNode; disabled?: boolean }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: c.surface }, style]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: !!o.disabled }}
            disabled={o.disabled}
            onPress={() => onChange(o.key)}
            style={[styles.segment, on && { backgroundColor: c.surface2 }]}
          >
            {o.icon}
            <Text style={[onest('semibold', 14), { color: on ? c.text : c.muted }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Figma switch (52×32): accent track with a dark knob on the right when on; surface2 track, muted knob when off.
export function Toggle({ value, onChange, accessibilityLabel }: { value: boolean; onChange: (v: boolean) => void; accessibilityLabel?: string }) {
  const { c } = useTheme();
  const [x] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    Animated.timing(x, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [value, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.switchTrack, { backgroundColor: value ? c.accent : c.surface2 }]}
    >
      <Animated.View
        style={[
          styles.switchKnob,
          { backgroundColor: value ? c.onAccent : c.muted },
          { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] },
        ]}
      />
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={styles.checkRow}>
      <View style={[styles.box, checked ? { backgroundColor: c.accent } : { borderWidth: 1.5, borderColor: c.line }]}>
        {checked && <Check size={16} color={c.onAccent} strokeWidth={3} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: c.text }]}>{label}</Text>
        {sub && <Text style={[type.footnote, { color: c.muted }]}>{sub}</Text>}
      </View>
    </Pressable>
  );
}

export function Radio({ selected }: { selected: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.radio, { borderColor: selected ? c.accent : c.line }]}>
      {selected && <View style={[styles.radioDot, { backgroundColor: c.accent }]} />}
    </View>
  );
}

// Grouped list (settings, profile): surface card with line separators.
export function List({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[styles.list, { backgroundColor: c.surface }, style]}>{children}</View>;
}

export function ListRow({
  label,
  sub,
  value,
  valueTone = 'muted',
  right,
  chevron,
  onPress,
  destructive,
  last,
}: {
  label: string;
  sub?: string;
  value?: string;
  valueTone?: 'muted' | 'accent';
  right?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.line }, pressed && { backgroundColor: c.surface2 }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[onest('medium', 16), { color: destructive ? c.danger : c.text }]}>{label}</Text>
        {sub && <Text style={[type.footnote, { color: c.muted }]}>{sub}</Text>}
      </View>
      {value !== undefined && (
        <Text style={[type.subhead, { color: valueTone === 'accent' ? c.accent : c.muted }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {right}
      {chevron && <ChevronRight size={18} color={c.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 44, padding: 4, gap: 4, borderRadius: 14 },
  segment: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  switchTrack: { width: 52, height: 32, borderRadius: 16, padding: 4, justifyContent: 'center' },
  switchKnob: { width: 24, height: 24, borderRadius: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  list: { borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, paddingHorizontal: 16, paddingVertical: 11 },
});
