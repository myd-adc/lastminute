import { useState } from 'react';

import { EditLayout } from '@/components/onboarding/EditLayout';
import { cleanProfile, emptyProfile, isProfileValid, ProfileForm } from '@/components/onboarding/ProfileForm';
import { goBack } from '@/components/ui';
import { getScene } from '@/data/mock';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M16 → «Змінити профіль»: the M03 form prefilled from the stored profile.
export default function EditProfileScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [draft, setDraft] = useState(() => state.me ?? emptyProfile());
  const valid = isProfileValid(draft);

  const save = () => {
    if (!valid) return;
    dispatch({ type: 'setMe', me: cleanProfile(draft) });
    goBack('/me');
  };

  return (
    <EditLayout
      title={t('onboarding.profile.editTitle')}
      onSave={save}
      canSave={valid}
      preview={{
        ...draft,
        interests: state.interests,
        solo: state.goesWith === 'solo',
        sceneName: state.sceneId ? getScene(state.sceneId).name : undefined,
      }}
    >
      <ProfileForm value={draft} onChange={setDraft} />
    </EditLayout>
  );
}
