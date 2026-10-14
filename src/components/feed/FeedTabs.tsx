import { Bookmark } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import type { FeedTab } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

type Props = {
  value: FeedTab;
  onChange: (tab: FeedTab) => void;
  onPoster?: boolean; // M06: inactive tab = text colour at 60 % over the poster; M10/W03: muted
  wide?: boolean; // W03: 17 pt, 24 pt gaps, 32 pt underline
  savedCount: number;
};

// M06/M10/W03 header tabs, TikTok order: «Спільноти» · «Знайомі» · «Для тебе» (+ «Збережені» while it is picked
// is open), accent underline under the active one. The bookmark on the right opens and closes the saved stack.
// Phone row is 32 pt high (Figma y = 58…90, i.e. 8 pt under the status bar).
export function FeedTabs({ value, onChange, onPoster, wide, savedCount }: Props) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const size = wide ? 17 : 16;
  const savedOpen = value === 'saved';
  // Lime reads on posters and dark pages; the light page needs the deep-olive ink.
  const on = scheme === 'light' && !onPoster ? c.accentInk : c.accent;
  const items: { key: FeedTab; label: string }[] = [
    { key: 'communities', label: t('feed.tabs.communities') },
    { key: 'met', label: t('feed.tabs.met') },
    { key: 'forYou', label: t('feed.tabs.forYou') },
    ...(value === 'saved' ? [{ key: 'saved' as const, label: t('feed.tabs.saved') }] : []),
  ];
  return (
    <View style={[styles.row, !wide && styles.phoneRow]}>
      <View style={[styles.tabs, { gap: wide ? 24 : 18 }]}>
        {items.map((item) => {
          const active = item.key === value;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item.key)}
              hitSlop={8}
              style={[styles.tab, { gap: wide ? 6 : 4 }]}
            >
              <Text
                style={[
                  onest(active ? 'bold' : 'semibold', size, Math.round(size * 1.27)),
                  { color: active || onPoster ? c.text : c.muted },
                  !active && onPoster && styles.dim,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {active && <View style={[styles.underline, { width: wide ? 32 : 28, backgroundColor: c.accent }]} />}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(savedOpen ? 'feed.tabs.hideSaved' : 'feed.tabs.showSaved')}
        accessibilityState={{ selected: savedOpen }}
        onPress={() => onChange(savedOpen ? 'forYou' : 'saved')}
        hitSlop={12}
        style={({ pressed }) => [styles.saved, pressed && { opacity: 0.7 }]}
      >
        <Bookmark size={22} color={savedOpen ? on : c.text} fill={savedOpen ? on : 'transparent'} strokeWidth={2} />
        {savedCount > 0 && !savedOpen && (
          <View style={[styles.badge, { backgroundColor: c.accent }]}>
            <Text style={[onest('bold', 10, 12), { color: c.onAccent }]}>{savedCount > 9 ? '9+' : savedCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  phoneRow: { height: 32 },
  tabs: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  tab: { alignItems: 'center', flexShrink: 1 },
  dim: { opacity: 0.6 },
  underline: { height: 3, borderRadius: 2 },
  saved: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
});
