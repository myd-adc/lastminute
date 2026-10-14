import { useState, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fullWindow, useIsWide } from '@/lib/layout';
import { pop, slideUp, useOverlayMotion } from '@/lib/motion';
import { t } from '@/i18n/translate';
import { useTheme } from '@/theme';

import { goBack } from './Screen';

type Props = {
  children: ReactNode;
  // A function footer gets the animated close for its own buttons («Готово»).
  footer?: ReactNode | ((close: () => void) => ReactNode);
  onClose?: () => void;
  maxHeight?: `${number}%`;
  // Set for in-screen sheets: the sheet lives in a Modal that stays mounted until the exit animation ends.
  visible?: boolean;
};

// Bottom sheet over the previous screen (M07 details, M17 report). Route it with presentation: 'transparentModal',
// or pass `visible` to open it from inside a screen. On wide web it renders as a centred dialog.
export function Sheet({ visible, onClose = () => goBack(), ...rest }: Props) {
  const [shown, setShown] = useState(!!visible);
  if (visible === undefined) return <Panel {...rest} onClose={onClose} />;
  if (visible && !shown) setShown(true);
  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Panel {...rest} open={visible} onClose={onClose} onHidden={() => setShown(false)} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Panel({ children, footer, onClose, maxHeight = '86%', open, onHidden }: Omit<Props, 'visible'> & {
  onClose: () => void;
  open?: boolean;
  onHidden?: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const { height } = useWindowDimensions();
  const [panelH, setPanelH] = useState(height);
  const { progress, exit } = useOverlayMotion(open ?? true, onHidden);
  // A Modal sheet closes by flipping `visible`; a route sheet plays its exit here before the route goes.
  const close = onHidden ? onClose : () => exit(onClose);
  return (
    <View style={[wide ? fullWindow : StyleSheet.absoluteFill, wide && styles.centre]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: progress }]}>
        <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}
        style={[
          wide ? styles.dialog : styles.sheet,
          { backgroundColor: c.surface, maxHeight: wide ? '90%' : maxHeight },
          wide ? pop(progress) : slideUp(progress, panelH),
        ]}
      >
        {!wide && <View style={[styles.handle, { backgroundColor: c.line }]} />}
        <ScrollView
          contentContainerStyle={[styles.content, !footer && !wide && { paddingBottom: insets.bottom + 20 }]}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer && (
          <View style={[styles.footer, { paddingBottom: wide ? 24 : insets.bottom + 12 }]}>{typeof footer === 'function' ? footer(close) : footer}</View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  dialog: { width: 560, borderRadius: 28, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 10 },
  content: { padding: 20, gap: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
});
