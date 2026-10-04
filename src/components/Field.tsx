import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, type } from '@/theme';

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[type.caption, styles.label]}>{label.toUpperCase()}</Text>
      <TextInput placeholderTextColor={colors.label3} {...input} style={[type.body, styles.input, input.style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.label2, paddingHorizontal: 4 },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.label,
  },
});
