import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radio } from '@/components/ui';
import { useT } from '@/i18n';
import type { FeedTab } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  value: FeedTab;
  onChange: (tab: FeedTab) => void;
  sceneLabel: string;
  savedCount: number;
  skippedCount: number;
  onResetSkipped: () => void;
};

// Sliders icon on M06/M10: which stack to swipe (scene / city / saved) and bringing skipped events back.
export function FilterSheet({ visible, onClose, value, onChange, sceneLabel, savedCount, skippedCount, onResetSkipped }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const options: { key: FeedTab; label: string; sub: string }[] = [
    { key: 'scene', label: sceneLabel, sub: t('feed.filter.sceneSub') },
    { key: 'city', label: t('feed.tabs.city'), sub: t('feed.filter.citySub') },
    { key: 'saved', label: t('feed.tabs.saved'), sub: savedCount ? t('feed.filter.savedSub', { count: savedCount }) : t('feed.filter.savedEmpty') },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={t('common.close')} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.handle, { backgroundColor: c.line }]} />
          <Text style={[type.headline, { color: c.text }]}>{t('feed.filter.title')}</Text>
          <View style={{ gap: 4 }}>
            {options.map((o) => (
              <Pressable
                key={o.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: value === o.key }}
                onPress={() => {
                  onChange(o.key);
                  onClose();
                }}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surface2 }]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: c.text }]}>{o.label}</Text>
                  <Text style={[type.footnote, { color: c.muted }]}>{o.sub}</Text>
                </View>
                <Radio selected={value === o.key} />
              </Pressable>
            ))}
          </View>
          {skippedCount > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onResetSkipped();
                onClose();
              }}
              style={[styles.reset, { borderColor: c.line }]}
            >
              <Text style={[onest('semibold', 15), { color: c.text }]}>{t('feed.filter.restoreSkipped', { count: skippedCount })}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12 },
  reset: { height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
