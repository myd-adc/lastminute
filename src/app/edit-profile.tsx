import { useState } from 'react';

import { EditLayout } from '@/components/onboarding/EditLayout';
import { cleanProfile, emptyProfile, isProfileValid, ProfileForm, useUsernameStatus } from '@/components/onboarding/ProfileForm';
import { goBack } from '@/components/ui';
import { useT } from '@/i18n';
import { suggestUsername } from '@/lib/username';
import { useStore } from '@/store/AppStore';

// M16 → «Змінити профіль»: the M03 form prefilled from the stored profile.
export default function EditProfileScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [draft, setDraft] = useState(() => (state.me ? { ...state.me, username: state.me.username ?? suggestUsername(state.me.name, state.email) } : emptyProfile(state.email)));
  const usernameStatus = useUsernameStatus(draft.username);
  const valid = isProfileValid(draft, usernameStatus);

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
      }}
    >
      <ProfileForm value={draft} onChange={setDraft} usernameStatus={usernameStatus} email={state.email} />
    </EditLayout>
  );
}
