import { Pressable, StyleSheet, View } from 'react-native';

import { Radio, Sheet } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import type { FeedTab } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  value: FeedTab;
  onChange: (tab: FeedTab) => void;
  savedCount: number;
  skippedCount: number;
  onResetSkipped: () => void;
};

// Sliders icon on M06/M10: which stack to swipe (for you / communities / met / saved) and bringing skipped events back.
export function FilterSheet({ visible, onClose, value, onChange, savedCount, skippedCount, onResetSkipped }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const options: { key: FeedTab; label: string; sub: string }[] = [
    { key: 'forYou', label: t('feed.tabs.forYou'), sub: t('feed.filter.forYouSub') },
    { key: 'communities', label: t('feed.tabs.communities'), sub: t('feed.filter.communitiesSub') },
    { key: 'met', label: t('feed.tabs.met'), sub: t('feed.filter.metSub') },
    { key: 'saved', label: t('feed.tabs.saved'), sub: savedCount ? t('feed.filter.savedSub', { count: savedCount }) : t('feed.filter.savedEmpty') },
  ];
  return (
    <Sheet visible={visible} onClose={onClose}>
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12 },
  reset: { height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
