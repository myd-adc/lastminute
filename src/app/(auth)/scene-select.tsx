import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { emptyProfile } from '@/components/onboarding/ProfileForm';
import { knownStudentEmail, NotifyCard, SceneForm, sceneValid, type SceneDraft } from '@/components/onboarding/SceneForm';
import { Text } from '@/components/ui/Text';
import { scenes } from '@/data/mock';
import { useT } from '@/i18n';
import { saveProfile } from '@/api/auth';
import { isLive } from '@/api/client';
import { useStore } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

// M05 «Твоя сцена» — onboarding step 3 of 3, finishes onboarding.
export default function SceneSelectScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const { c } = useTheme();
  const [draft, setDraft] = useState<SceneDraft>({ sceneId: state.sceneId ?? 'ucu', studentEmail: knownStudentEmail(state.studentEmail, state.email) });
  const [notify, setNotify] = useState(state.settings.notify.soloOnMyEvent);
  const [fallbackMe] = useState(emptyProfile);
  const [saveError, setSaveError] = useState<string | null>(null);
  const valid = sceneValid(draft);

  const start = async () => {
    if (!valid || !draft.sceneId) return;
    if (isLive) {
      const res = await saveProfile({ ...state, sceneId: draft.sceneId, studentEmail: draft.studentEmail });
      if (!res.ok) return setSaveError(t('onboarding.errors.save'));
    }
    dispatch({ type: 'setScene', sceneId: draft.sceneId, studentEmail: draft.studentEmail });
    dispatch({ type: 'completeOnboarding', notify, seedDemo: !isLive });
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
      {/* M05: scene cards, then 30 pt to the notifications card. */}
      <View style={{ gap: 30 }}>
        <SceneForm value={draft} onChange={setDraft} />
        <NotifyCard value={notify} onChange={setNotify} />
        {saveError && <Text style={[type.footnote, { color: c.danger }]}>{saveError}</Text>}
      </View>
    </OnboardingFrame>
  );
}
