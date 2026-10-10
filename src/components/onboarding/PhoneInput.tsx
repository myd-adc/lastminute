import { ChevronDown } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/i18n';
import { onest, useTheme } from '@/theme';

import { TextField } from './kit';

export const PHONE_DIGITS = 9; // national part after +380

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

// «671234567» → «67 123 45 67»
export function formatNational(digits: string) {
  const d = digits.slice(0, PHONE_DIGITS);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}

// Stored as «+380671234567», shown as «+380 67 123 45 67».
export const toE164 = (digits: string) => `+380${digits}`;
export const formatE164 = (phone: string | null) => (phone ? `+380 ${formatNational(phone.replace(/^\+380/, ''))}` : '+380');

// «Номер телефону» input with the «+380 ▾» country pill (only Ukraine is supported, so the pill is a label).
export function PhoneInput({
  digits,
  onChange,
  onSubmit,
  autoFocus,
}: {
  digits: string;
  onChange: (digits: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <TextField
      value={formatNational(digits)}
      onChangeText={(text) => {
        let d = onlyDigits(text);
        // Pasted full numbers: «+380671234567», «0671234567».
        if (d.length > PHONE_DIGITS && d.startsWith('380')) d = d.slice(3);
        else if (d.length > PHONE_DIGITS && d.startsWith('0')) d = d.slice(1);
        onChange(d.slice(0, PHONE_DIGITS));
      }}
      placeholder="67 123 45 67"
      keyboardType="phone-pad"
      textContentType="telephoneNumber"
      autoComplete="tel-national"
      autoFocus={autoFocus}
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      accessibilityLabel={t('onboarding.login.phoneLabel')}
      boxStyle={styles.box}
      left={
        <View style={[styles.prefix, { backgroundColor: c.surface2 }]}>
          <Text style={[onest('semibold', 15), { color: c.text }]}>+380</Text>
          <ChevronDown size={12} color={c.muted} strokeWidth={2.5} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  box: { paddingLeft: 8, gap: 12 },
  prefix: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 10, borderRadius: 10 },
});
