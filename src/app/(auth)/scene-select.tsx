import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { emptyProfile } from '@/components/onboarding/ProfileForm';
import { NotifyCard, SceneForm, sceneValid, type SceneDraft } from '@/components/onboarding/SceneForm';
import { scenes } from '@/data/mock';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M05 «Твоя сцена» — onboarding step 3 of 3, finishes onboarding.
export default function SceneSelectScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [draft, setDraft] = useState<SceneDraft>({ sceneId: state.sceneId ?? 'ucu', studentEmail: state.studentEmail });
  const [notify, setNotify] = useState(state.settings.notify.soloOnMyEvent);
  const [fallbackMe] = useState(emptyProfile);
  const valid = sceneValid(draft);

  const start = () => {
    if (!valid || !draft.sceneId) return;
    dispatch({ type: 'setScene', sceneId: draft.sceneId, studentEmail: draft.studentEmail });
    dispatch({ type: 'completeOnboarding', notify });
    // The root Stack.Protected guard flips on the next render; navigate once the app routes are available.
    setTimeout(() => router.replace('/'), 0);
  };

  return (
    <OnboardingFrame
      step={3}
      title={t('onboarding.scene.title')}
      subtitle={t('onboarding.scene.subtitle')}
      cta={{ label: t('onboarding.scene.start'), onPress: start, disabled: !valid }}
      preview={{
        ...(state.me ?? fallbackMe),
        interests: state.interests,
        solo: state.goesWith === 'solo',
        sceneName: scenes.find((s) => s.id === draft.sceneId)?.name,
      }}
    >
      <SceneForm value={draft} onChange={setDraft} />
      <View style={{ height: 8 }} />
      <NotifyCard value={notify} onChange={setNotify} />
    </OnboardingFrame>
  );
}
