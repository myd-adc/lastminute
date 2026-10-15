import { router } from 'expo-router';

import { EventForm } from '@/components/community/EventForm';
import { Button, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { MAX_OWN_EVENTS, myOwnEvents } from '@/lib/selectors';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';
import { gradientIds } from '@/theme/palette';

// "Your own event" — the same M21 form without a community behind it. Reached from the feed and the communities tab.
export default function NewPersonalEventScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const now = useNow();
  const mine = myOwnEvents(state, now);
  const left = MAX_OWN_EVENTS - mine.length;

  if (left <= 0) {
    return (
      <Screen contentStyle={styles.narrow}>
        <Text style={[type.title2, { color: c.text }]}>{t('feed.own.fullTitle')}</Text>
        <Text style={[type.body, { color: c.muted }]}>{t('feed.own.fullBody', { count: MAX_OWN_EVENTS })}</Text>
        <Button label={t('feed.backToFeed')} variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <EventForm
      title={t('feed.own.title')}
      sub={t('feed.own.sub')}
      communityId={null}
      defaultGradient={state.me?.gradient ?? gradientIds[0]}
      note={<Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{t('feed.own.left', { count: left })}</Text>}
    />
  );
}

const styles = { narrow: { maxWidth: 480, width: '100%' as const, alignSelf: 'center' as const, gap: 12 } };
