import { useState } from 'react';

import { QrSheet } from '@/components/ui';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { eventQrUrl } from '@/lib/links';
import { useNow } from '@/store/AppStore';

import { shareEvent } from './share';

// "Send to a friend" from the feed card rail and the details screen: the code first, the share sheet under it.
export function EventQrSheet({ event, onClose }: { event: Event | null; onClose: () => void }) {
  const { t } = useT();
  const now = useNow();
  // Keep showing the last event while the sheet animates out.
  const [shown, setShown] = useState(event);
  if (event && event !== shown) setShown(event);
  if (!shown) return null;
  return (
    <QrSheet
      visible={!!event}
      onClose={onClose}
      title={t('feed.qr.title')}
      sub={t('feed.qr.sub')}
      subject={shown.title}
      url={eventQrUrl(shown.id)}
      onShare={() => shareEvent(shown, now)}
    />
  );
}
