import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { goBack } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { display, onest, useTheme } from '@/theme';

// M19–M22 header: 40 pt back row, then the Unbounded 26 title (−2 % tracking) and a muted line under it.
export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack('/communities')}>
          <ChevronLeft size={26} color={c.text} strokeWidth={2} />
        </Pressable>
        {right}
      </View>
      <Text style={[display(26, 30), styles.title, { color: c.text }]}>{title}</Text>
      {!!sub && <Text style={[onest('regular', 15, 21), styles.sub, { color: c.muted }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  title: { marginTop: 10, letterSpacing: -0.52 },
  sub: { marginTop: 8 },
});
