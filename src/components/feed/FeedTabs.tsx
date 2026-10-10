import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/i18n';
import type { FeedTab } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

type Props = {
  value: FeedTab;
  onChange: (tab: FeedTab) => void;
  sceneLabel: string; // «My scene · UCU»
  onPoster?: boolean; // white text over the poster (M06) vs theme text (M10, web)
  showSaved?: boolean; // web always shows «Saved»; phones only while it is active
  onFilters?: () => void;
};

// M06/M10/W03 header tabs: «My scene · UCU» / «Whole city» (/ «Saved»), accent underline on the active one.
export function FeedTabs({ value, onChange, sceneLabel, onPoster, showSaved, onFilters }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const on = onPoster ? '#F6F5F2' : c.text;
  const off = onPoster ? 'rgba(246,245,242,0.6)' : c.muted;
  const items: { key: FeedTab; label: string }[] = [
    { key: 'scene', label: sceneLabel },
    { key: 'city', label: t('feed.tabs.city') },
    ...(showSaved || value === 'saved' ? [{ key: 'saved' as const, label: t('feed.tabs.saved') }] : []),
  ];
  return (
    <View style={styles.row}>
      <View style={styles.tabs}>
        {items.map((item) => {
          const active = item.key === value;
          return (
            <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(item.key)} hitSlop={8} style={styles.tab}>
              <Text style={[onest(active ? 'bold' : 'semibold', 16), { color: active ? on : off }]} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={[styles.underline, { backgroundColor: active ? c.accent : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>
      {onFilters && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('feed.tabs.filters')} onPress={onFilters} hitSlop={12}>
          <SlidersHorizontal size={24} color={on} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tabs: { flexDirection: 'row', alignItems: 'flex-start', gap: 20, flexShrink: 1 },
  tab: { alignItems: 'center', gap: 6, flexShrink: 1 },
  underline: { width: 28, height: 3, borderRadius: 2 },
});
