import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsWide } from '@/lib/hooks';
import { colors, TAB_BAR_CLEARANCE, type } from '@/theme';

import { Icon } from './Icon';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

// Phone: grouped background, safe-area top, room for the floating tab bar.
// Wide web: the shell already provides chrome, so only main-column padding applies.
export function Screen({ children, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const padding = wide
    ? styles.wide
    : { paddingTop: insets.top + 4, paddingBottom: TAB_BAR_CLEARANCE, paddingHorizontal: 16 };

  if (!scroll) return <View style={[styles.root, padding, styles.gap, contentStyle]}>{children}</View>;
  return (
    <ScrollView style={styles.root} contentContainerStyle={[padding, styles.gap, contentStyle]}>
      {children}
    </ScrollView>
  );
}

export function LargeTitle({ title, right, sub }: { title: string; right?: ReactNode; sub?: string }) {
  const wide = useIsWide();
  return (
    <View style={[styles.navLarge, wide && { paddingTop: 0, gap: 6 }]}>
      <View style={styles.titleRow}>
        <Text style={wide ? type.webDisplay : type.largeTitle}>{title}</Text>
        {right}
      </View>
      {sub && <Text style={[wide ? type.webBody : type.subhead, { color: colors.label2 }]}>{sub}</Text>}
    </View>
  );
}

export function NavBack({ label, fallback = '/' }: { label: string; fallback?: '/' | '/matches' | '/profile' }) {
  const wide = useIsWide();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(fallback));
  return (
    <Pressable onPress={goBack} hitSlop={10} style={[styles.back, wide && { gap: 4 }]}>
      <Icon name="back" size={wide ? 16 : 18} color={colors.tint} />
      <Text style={[wide ? type.webNav : type.body, { color: colors.tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.grouped },
  gap: { gap: 14 },
  wide: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 48, gap: 24 },
  navLarge: { paddingTop: 6, paddingBottom: 4, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
});
