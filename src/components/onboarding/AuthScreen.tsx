import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { footerBottom } from '@/lib/layout';
import { useTheme } from '@/theme';

import { HeroBlobs, type GlowVariant } from './HeroBlobs';

export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(show, () => setVisible(true));
    const b = Keyboard.addListener(hide, () => setVisible(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  return visible;
}

// Phone shell for M01–M05: the safe area replaces the 50 pt Figma status bar, content starts `top` pt below it
// (12 in M02–M05), 20 pt side margins, per-frame glow behind the content. The pinned CTA sits 38 pt above the
// screen bottom, and 12 pt above the keyboard while it is open (M02).
export function AuthScreen({
  children,
  footer,
  glow,
  top = 12,
  contentStyle,
}: {
  children: ReactNode;
  footer?: ReactNode;
  glow?: GlowVariant;
  top?: number;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  const bottom = keyboard ? 12 : footerBottom(insets.bottom);
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {glow && <HeroBlobs variant={glow} />}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + top, paddingBottom: footer ? 16 : bottom }, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer && <View style={[styles.footer, { paddingBottom: bottom }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
