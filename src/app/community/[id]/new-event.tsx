import { Redirect, useLocalSearchParams } from 'expo-router';

import { EventForm } from '@/components/community/EventForm';
import { getCommunity } from '@/data/mock';
import { useT } from '@/i18n';

// M21 "New event" for a community — only its creator gets here.
export default function NewEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const community = getCommunity(id);
  if (!community || !community.mine) return <Redirect href="/communities" />;
  return (
    <EventForm
      title={t('community.event.title')}
      sub={t('community.event.sub', { community: community.name })}
      communityId={community.id}
      defaultGradient={community.gradient}
    />
  );
}
