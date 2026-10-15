import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { display, useTheme } from '@/theme';
import { webHitArea } from '@/lib/layout';

// M16b header: 40 pt row, 26 pt back chevron, 10 pt gap, Unbounded Bold 24 title (no tracking in the frame).
export function BackTitle({ title, onBack, style }: { title: string; onBack: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={[styles.row, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={onBack} style={webHitArea(26)}>
        <ChevronLeft size={26} color={c.text} strokeWidth={2} />
      </Pressable>
      <Text style={[display(24, 30), { letterSpacing: 0, color: c.text, flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 40 },
});
