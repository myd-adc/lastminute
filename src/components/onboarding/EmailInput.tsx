import { StyleSheet } from 'react-native';

import { useT } from '@/i18n';

import { TextField } from './kit';

export const normalizeEmail = (s: string) => s.trim().toLowerCase();
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

// M01 / W01 "Email" input: the sign-in code goes to this address.
export function EmailInput({
  value,
  onChange,
  onSubmit,
  autoFocus,
  size = 'lg',
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  size?: 'md' | 'lg'; // lg = M01 (56 pt, 16 radius, 18 inset), md = W01 (52 pt, 14 radius, 16 inset)
}) {
  const { t } = useT();
  return (
    <TextField
      value={value}
      onChangeText={onChange}
      placeholder={t('onboarding.login.emailPlaceholder')}
      keyboardType="email-address"
      textContentType="emailAddress"
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus={autoFocus}
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      accessibilityLabel={t('onboarding.login.emailLabel')}
      boxStyle={size === 'lg' ? styles.lg : styles.md}
    />
  );
}

const styles = StyleSheet.create({
  lg: { height: 56, borderRadius: 16, paddingHorizontal: 18 },
  md: { height: 52, minHeight: 52, borderRadius: 14, paddingHorizontal: 16 },
});
