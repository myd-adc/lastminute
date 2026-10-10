import { MobileFeed } from '@/components/feed/MobileFeed';
import { WideFeed } from '@/components/feed/WideFeed';
import { useIsWide } from '@/lib/layout';

// M06 / M10 on phones and narrow web, W03 on wide web.
export default function FeedScreen() {
  return useIsWide() ? <WideFeed /> : <MobileFeed />;
}
