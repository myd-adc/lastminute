import { ChevronDown, Globe } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme, type Palette, type Scheme } from '@/theme';

// Accent-coloured text (links, «підтверджено») is unreadable on the light background, so light mode inks it in `text`.
export const accentInk = (c: Palette, scheme: Scheme) => (scheme === 'light' ? c.text : c.accent);

export function useAccentInk() {
  const { c, scheme } = useTheme();
  return accentInk(c, scheme);
}

// «• lastminute» wordmark.
export function Logo({ size = 18 }: { size?: number }) {
  const { c } = useTheme();
  return (
    <View style={styles.logo}>
      <View style={[styles.logoDot, { backgroundColor: c.accent }]} />
      <Text style={[onest('bold', size), { color: c.text }]}>lastminute</Text>
    </View>
  );
}

// «🌐 UA ▾» / «🌐 EN ▾» pill (M01 / W01, top right). Two languages, so a tap switches to the other one.
export function LanguagePill({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { dispatch } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('onboarding.language.a11y')}
      hitSlop={8}
      onPress={() => dispatch({ type: 'setLanguage', language: lang === 'uk' ? 'en' : 'uk' })}
      style={({ pressed }) => [styles.lang, { backgroundColor: c.surface, borderColor: c.line }, pressed && { opacity: 0.8 }, style]}
    >
      <Globe size={16} color={c.text} strokeWidth={2} />
      <Text style={[onest('bold', 13), { color: c.text }]}>{t('onboarding.language.short')}</Text>
      <ChevronDown size={14} color={c.muted} strokeWidth={2} />
    </Pressable>
  );
}

// Field label row: «Говори зі мною про» ……… «31 / 80».
export function FieldLabel({ label, right }: { label: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.labelRow}>
      <Text style={[type.footnote, { color: c.muted }]}>{label}</Text>
      {right}
    </View>
  );
}

// Surface box that turns its border accent while focused — the Figma input («Ім’я», phone, e-mail).
export function InputBox({ focused, children, style }: { focused: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: c.surface, borderColor: focused ? c.accent : c.line, borderWidth: focused ? 1.5 : 1 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type TextFieldProps = Omit<TextInputProps, 'style'> & { boxStyle?: StyleProp<ViewStyle>; left?: ReactNode; right?: ReactNode };

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ boxStyle, left, right, onFocus, onBlur, ...rest }, ref) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <InputBox focused={focused} style={boxStyle}>
      {left}
      <TextInput
        ref={ref}
        placeholderTextColor={c.muted}
        selectionColor={c.accent}
        cursorColor={c.text}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, { color: c.text }, webNoOutline]}
      />
      {right}
    </InputBox>
  );
});

// RN-web draws a browser focus ring on inputs; the accent border replaces it.
export const webNoOutline = { outlineStyle: 'none' } as object;

// 3-segment step indicator next to the back chevron (M03–M05).
export function StepBar({ step, total = 3 }: { step: number; total?: number }) {
  const { c } = useTheme();
  return (
    <View style={styles.steps} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: step }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.step, { backgroundColor: i < step ? c.accent : c.surface2 }]} />
      ))}
    </View>
  );
}

// Small outlined suggestion chip («найкращий концерт у Львові»).
export function IdeaChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.idea, { borderColor: c.line }, pressed && { backgroundColor: c.surface2 }]}
    >
      <Text style={[onest('regular', 12), { color: c.muted }]}>{label}</Text>
    </Pressable>
  );
}

// Text link (accent in dark, text colour in light).
export function TextLink({ label, onPress, size = 13 }: { label: string; onPress: () => void; size?: number }) {
  const ink = useAccentInk();
  return (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress}>
      {({ pressed }) => <Text style={[onest('semibold', size), { color: ink, opacity: pressed ? 0.7 : 1 }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: { width: 8, height: 8, borderRadius: 4 },
  lang: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -6 },
  box: { minHeight: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  input: { flex: 1, alignSelf: 'stretch', ...onest('medium', 16), paddingVertical: 0 },
  steps: { flex: 1, flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2 },
  idea: { height: 28, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
});
