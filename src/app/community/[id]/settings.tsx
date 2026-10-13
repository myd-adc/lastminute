import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CommunityForm, communityFormValid, toDraft, type CommunityFormValue } from '@/components/community/CommunityForm';
import { Glow, glows } from '@/components/profile/Glow';
import { PageHead } from '@/components/community/PageHead';
import { ConfirmRow } from '@/components/profile/ProfileSections';
import { Group } from '@/components/profile/Rows';
import { Button, goBack, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getCommunity } from '@/data/mock';
import type { Community } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

// M22 «Налаштування спільноти» — creator only.
export default function CommunitySettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = getCommunity(id);
  if (!community || !community.mine) return <Redirect href="/communities" />;
  return <Settings community={community} />;
}

function Settings({ community }: { community: Community }) {
  const { c } = useTheme();
  const { t } = useT();
  const { dispatch } = useStore();
  const wide = useIsWide();
  const [value, setValue] = useState<CommunityFormValue>({
    name: community.name,
    description: community.description,
    gradient: community.gradient,
    photoUri: community.photoUri,
    access: community.emailDomain ? 'domain' : 'open',
    domain: community.emailDomain ?? '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = communityFormValid(value);

  const save = () => {
    if (!valid) return;
    dispatch({ type: 'updateCommunity', communityId: community.id, patch: toDraft(value) });
    goBack('/communities');
  };
  const remove = () => {
    dispatch({ type: 'deleteCommunity', communityId: community.id });
    router.replace('/communities');
  };

  return (
    <Screen keyboard backdrop={!wide && <Glow blobs={glows.community} />} contentStyle={wide && styles.wide} footer={<Button label={t('community.form.save')} onPress={save} disabled={!valid} />}>
      <PageHead title={t('community.form.settingsTitle')} sub={t('community.form.settingsSub')} />
      <CommunityForm value={value} onChange={setValue} editing />
      {confirmDelete ? (
        <Group>
          <ConfirmRow
            question={t('community.form.deleteQuestion', { name: community.name })}
            confirmLabel={t('community.form.deleteConfirm')}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={remove}
          />
        </Group>
      ) : (
        <View style={styles.footerRow}>
          <Text style={[onest('medium', 15, 19), { color: c.muted }]}>{t('community.form.members', { count: community.members })}</Text>
          <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} hitSlop={8}>
            <Text style={[type.bodyStrong, { color: c.danger }]}>{t('community.form.delete')}</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
