import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/theme';

import { Icon, type IconName } from './Icon';

// iOS inset-grouped list: white rounded container with hairline separators.
export function Group({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

type RowProps = {
  label: string;
  value?: string;
  valueColor?: string;
  icon?: IconName;
  chevron?: boolean;
  last?: boolean;
  onPress?: () => void;
};

export function Row({ label, value, valueColor = colors.label2, icon, chevron, last, onPress }: RowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        icon ? { gap: 12, paddingVertical: 13 } : null,
        !last && styles.separator,
        pressed && { backgroundColor: colors.fill },
      ]}
    >
      {icon && <Icon name={icon} size={20} color={colors.tint} />}
      <Text style={[type.body, styles.label]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.spacer} />
      {value !== undefined && (
        <Text style={[type.body, { color: valueColor, flexShrink: 1 }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {chevron && <Icon name="chevron" size={16} color={colors.label3} />}
    </Pressable>
  );
}

export function GroupLabel({ children }: { children: string }) {
  return <Text style={[type.caption, styles.groupLabel]}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.elevated, borderRadius: 20, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: { borderBottomWidth: 1, borderBottomColor: colors.separator },
  label: { color: colors.label, flexShrink: 0 },
  spacer: { flex: 1, minWidth: 8 },
  groupLabel: { color: colors.label2, marginBottom: -4 },
});
