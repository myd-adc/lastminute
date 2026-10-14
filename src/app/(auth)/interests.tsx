import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { saveProfile } from '@/api/auth';
import { isLive } from '@/api/client';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { pickableInterests, PreferencesForm, preferencesValid, type PreferencesDraft } from '@/components/onboarding/PreferencesForm';
import { emptyProfile } from '@/components/onboarding/ProfileForm';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

// M04 "What gets you out of the house?" — the last onboarding step: saves the profile and opens the feed.
export default function InterestsScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const { c } = useTheme();
  const [draft, setDraft] = useState<PreferencesDraft>(() => ({
    interests: state.interests.filter((id) => pickableInterests().some((i) => i.id === id)),
    vibe: state.vibe,
    goesWith: state.goesWith,
  }));
  const [fallbackMe] = useState(emptyProfile);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const valid = preferencesValid(draft) && !busy;

  const start = async () => {
    if (!valid) return;
    if (isLive) {
      setBusy(true);
      const res = await saveProfile({ ...state, ...draft });
      setBusy(false);
      if (!res.ok) return setSaveError(t('onboarding.errors.save'));
    }
    dispatch({ type: 'setPreferences', ...draft });
    dispatch({ type: 'completeOnboarding', notify: true, seedDemo: !isLive });
    // The root Stack.Protected guard flips on the next render; navigate once the app routes are available.
    setTimeout(() => router.replace('/'), 0);
  };

  return (
    <OnboardingFrame
      step={2}
      title={t('onboarding.interests.title')}
      subtitle={t('onboarding.interests.subtitle')}
      cta={{ label: t('onboarding.interests.start'), onPress: start, disabled: !valid }}
      preview={{ ...(state.me ?? fallbackMe), interests: draft.interests, solo: draft.goesWith === 'solo' }}
    >
      <View style={{ gap: 12 }}>
        <PreferencesForm value={draft} onChange={setDraft} />
        {saveError && <Text style={[type.footnote, { color: c.danger }]}>{saveError}</Text>}
      </View>
    </OnboardingFrame>
  );
}
