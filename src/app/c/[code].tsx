import { Redirect, useLocalSearchParams } from 'expo-router';

import { longId } from '@/lib/links';

// Short community link from a QR code (/c/<base62 id>): expand to the community page.
export default function ShortCommunityLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const id = longId(code ?? '');
  return id ? <Redirect href={{ pathname: '/community/[id]', params: { id, from: 'qr' } }} /> : <Redirect href="/" />;
}
