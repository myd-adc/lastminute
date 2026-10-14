import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { CommunityForm, communityFormValid, toDraft, type CommunityFormValue } from '@/components/community/CommunityForm';
import { Glow, glows } from '@/components/profile/Glow';
import { PageHead } from '@/components/community/PageHead';
import { Button, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

// M20 "New community".
export default function NewCommunityScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const { createCommunity } = useStore();
  const wide = useIsWide();
  const [value, setValue] = useState<CommunityFormValue>({ name: '', description: '', gradient: 'lime', access: 'open', domain: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const create = async () => {
    if (!communityFormValid(value)) return;
    setBusy(true);
    const id = await createCommunity(toDraft(value));
    setBusy(false);
    if (!id) return setError(true);
    router.replace({ pathname: '/community/[id]', params: { id } });
  };

  return (
    <Screen
      keyboard
      backdrop={!wide && <Glow blobs={glows.community} />}
      contentStyle={wide && styles.wide}
      footer={<Button label={t('community.form.create')} onPress={create} disabled={!communityFormValid(value) || busy} loading={busy} />}
    >
      <PageHead title={t('community.form.newTitle')} sub={t('community.form.newSub')} />
      <CommunityForm value={value} onChange={setValue} />
      {error && <Text style={[type.footnote, { color: c.danger }]}>{t('community.form.failed')}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
});
