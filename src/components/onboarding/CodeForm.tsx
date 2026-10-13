import { Clock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { fonts, onest, useTheme } from '@/theme';

import { TextLink, webNoOutline } from './kit';

export const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// M02 body: six code boxes driven by one hidden number-pad input, resend countdown, «Змінити номер», call-me hint.
export function CodeForm({
  code,
  onChange,
  onSubmit,
  onChangeNumber,
}: {
  code: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  onChangeNumber: () => void;
}) {
  const { c } = useTheme();
  const { t } = useT();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(true);
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const resend = () => {
    onChange('');
    setLeft(RESEND_SECONDS);
    input.current?.focus();
  };

  const active = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <View style={{ gap: 10 }}>
      <View>
        <View style={styles.boxes}>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const isActive = focused && i === active && code.length < CODE_LENGTH;
            // Figma: filled boxes have a surface2 hairline, the active one a 2 pt accent border with an accent caret.
            const border = isActive ? c.accent : code[i] ? c.surface2 : c.line;
            return (
              <View key={i} style={[styles.box, { backgroundColor: c.surface, borderColor: border, borderWidth: isActive ? 2 : 1 }]}>
                {code[i] ? (
                  <Text style={[styles.digit, { color: c.text }]}>{code[i]}</Text>
                ) : (
                  isActive && <View style={[styles.caret, { backgroundColor: c.accent }]} />
                )}
              </View>
            );
          })}
        </View>
        {/* Transparent input over the boxes: taps focus it, the system keyboard (or SMS autofill) types into it. */}
        <TextInput
          ref={input}
          value={code}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          maxLength={CODE_LENGTH}
          autoFocus
          caretHidden
          accessibilityLabel={t('onboarding.code.inputA11y')}
          style={[StyleSheet.absoluteFill, styles.hidden, webNoOutline]}
        />
      </View>

      <View style={styles.row}>
        {left > 0 ? (
          <View style={styles.timer}>
            <Clock size={14} color={c.muted} />
            <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{t('onboarding.code.resendIn', { time: mmss(left) })}</Text>
          </View>
        ) : (
          <TextLink label={t('onboarding.code.resend')} onPress={resend} />
        )}
        <TextLink label={t('onboarding.code.changeNumber')} onPress={onChangeNumber} />
      </View>

      <View style={[styles.info, { backgroundColor: c.surface }]}>
        <Text style={styles.emoji}>📮</Text>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[onest('regular', 13, 18), { color: c.muted }]}>
            {calling ? t('onboarding.code.calling') : t('onboarding.code.callHint')}
          </Text>
          {left <= 0 && !calling && <TextLink label={t('onboarding.code.callMe')} onPress={() => setCalling(true)} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, maxWidth: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  caret: { width: 2, height: 26, borderRadius: 1 },
  hidden: { opacity: 0, color: 'transparent', fontSize: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  digit: { fontFamily: fonts.displaySemibold, fontSize: 24 },
  emoji: { fontSize: 18 },
});
