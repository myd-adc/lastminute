import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/theme';

type Props<K extends string> = {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
};

export function SegmentedControl<K extends string>({ options, value, onChange }: Props<K>) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            style={[styles.segment, active && styles.active]}
          >
            <Text numberOfLines={1} style={[type.subhead, styles.label, active && styles.activeLabel]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 2, padding: 2, borderRadius: 9, backgroundColor: colors.fill },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  active: {
    backgroundColor: colors.elevated,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.12)',
  },
  label: { color: colors.label },
  activeLabel: { fontFamily: type.headline.fontFamily },
});
