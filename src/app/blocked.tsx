import { ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { BackTitle } from '@/components/profile/BackTitle';
import { Avatar, goBack, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

// "Blocked": people the user blocked (from M17 or a chat). Unblocking returns them to rooms and albums.
export default function BlockedScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const people = Object.keys(state.blocked)
    .map(getUser)
    .filter((u) => !!u);

  return (
    <Screen contentStyle={[styles.content, wide && styles.wide]}>
      <BackTitle title={t('profile.safety.blocked')} onBack={() => goBack('/me')} style={styles.header} />
      {people.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surface }]}>
          <View style={[styles.emptyIcon, { backgroundColor: c.surface2 }]}>
            <ShieldCheck size={26} color={c.text} strokeWidth={2} />
          </View>
          <Text style={[type.headline, { color: c.text, textAlign: 'center' }]}>{t('profile.blocked.emptyTitle')}</Text>
          <Text style={[type.subhead, { color: c.muted, textAlign: 'center' }]}>
            {t('profile.blocked.emptyText')}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[type.footnote, { color: c.muted }]}>{t('profile.blocked.hint')}</Text>
          <View style={[styles.list, { backgroundColor: c.surface }]}>
            {people.map((u, i) => (
              <View key={u.id} style={[styles.row, i < people.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
                <Avatar name={u.name} gradient={u.gradient} photoUri={u.photoUri} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: c.text }]}>{u.name}</Text>
                  <Text style={[type.footnote, { color: c.muted }]} numberOfLines={1}>
                    {u.affiliation}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.blocked.unblockA11y', { name: u.name })}
                  onPress={() => dispatch({ type: 'unblock', userId: u.id })}
                  style={({ pressed }) => [styles.unblock, { backgroundColor: c.surface2 }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[onest('semibold', 13), { color: c.text }]}>{t('common.unblock')}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Same header and grouped-list geometry as M16b (no dedicated frame).
  content: { gap: 12 },
  header: { marginTop: -2 },
  list: { borderRadius: 18, overflow: 'hidden' },
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  unblock: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  empty: { borderRadius: 18, padding: 24, gap: 10, alignItems: 'center' },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
