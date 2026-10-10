import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsWide } from '@/lib/layout';
import { t } from '@/i18n/translate';
import { useTheme } from '@/theme';

import { goBack } from './Screen';

// Bottom sheet over the previous screen (M07 details, M17 report). Route it with presentation: 'transparentModal'.
// On wide web it renders as a centred dialog.
export function Sheet({ children, footer, onClose = () => goBack(), maxHeight = '86%' }: {
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  maxHeight?: `${number}%`;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  return (
    <View style={[StyleSheet.absoluteFill, wide && styles.centre]}>
      <Pressable accessibilityLabel={t('common.close')} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} />
      <View
        style={[
          wide ? styles.dialog : styles.sheet,
          { backgroundColor: c.surface, maxHeight: wide ? '90%' : maxHeight },
        ]}
      >
        {!wide && <View style={[styles.handle, { backgroundColor: c.line }]} />}
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          {children}
        </ScrollView>
        {footer && <View style={[styles.footer, { paddingBottom: wide ? 24 : insets.bottom + 12 }]}>{footer}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  dialog: { width: 560, borderRadius: 28, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 10 },
  content: { padding: 20, gap: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
});
