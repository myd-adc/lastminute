import { Redirect, useLocalSearchParams } from 'expo-router';

import { longId } from '@/lib/links';

// Short event link from a QR code (/e/<base62 id>): expand to the event, keeping where the visit came from.
export default function ShortEventLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const id = longId(code ?? '');
  return id ? <Redirect href={{ pathname: '/event/[id]', params: { id, from: 'qr' } }} /> : <Redirect href="/" />;
}
