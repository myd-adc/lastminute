import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { footerBottom, tabBarClearance, useIsWide } from '@/lib/layout';
import { t } from '@/i18n/translate';
import { type, useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  withTabBar?: boolean; // reserve space under content for the floating glass tab bar (phone only)
  keyboard?: boolean; // wrap in KeyboardAvoidingView (forms, chat composers)
  footer?: ReactNode; // pinned bottom area (CTA buttons), stays above the home indicator
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
};

// Base screen: theme background, safe-area top, 20 pt side padding (Figma frames use x=20).
export function Screen({ children, scroll = true, withTabBar, keyboard, footer, contentStyle, padded = true }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const top = wide ? 32 : insets.top + 8;
  const bottom = withTabBar && !wide ? tabBarClearance(insets.bottom) : footer ? 16 : footerBottom(insets.bottom);
  const pad = padded ? { paddingHorizontal: wide ? 40 : 20 } : null;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[{ paddingTop: top, paddingBottom: bottom }, pad, styles.gap, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingTop: top, paddingBottom: footer ? 0 : bottom }, pad, styles.gap, contentStyle]}>{children}</View>
  );

  const content = (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      {body}
      {footer && <View style={[pad, { paddingTop: 12, paddingBottom: wide ? 32 : footerBottom(insets.bottom), gap: 12 }]}>{footer}</View>}
    </View>
  );

  if (!keyboard) return content;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  );
}

export function goBack(fallback: '/' | '/chats' | '/me' | '/scene' = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

// Back chevron + optional title/subtitle + right slot (M09/M13/M14 headers).
export function Header({
  title,
  subtitle,
  right,
  onBack = () => goBack(),
  large,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: (() => void) | null;
  large?: boolean; // «Налаштування»-style big Unbounded title next to the chevron
}) {
  const { c } = useTheme();
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={onBack}>
          <ChevronLeft size={26} color={c.text} strokeWidth={2} />
        </Pressable>
      )}
      {(title || subtitle) && (
        <View style={styles.flex}>
          {title && (
            <Text style={[large ? type.title : type.bodyStrong, { color: c.text }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[type.footnote, { color: c.muted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {!title && !subtitle && <View style={styles.flex} />}
      {right}
    </View>
  );
}

// Big Unbounded screen title with an optional right action (M12 «Чати», M16 «Профіль»).
export function ScreenTitle({ title, right }: { title: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.titleRow}>
      <Text style={[type.title, { color: c.text }]}>{title}</Text>
      {right}
    </View>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.titleRow}>
      <Text style={[type.footnoteStrong, { color: c.muted }]}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
