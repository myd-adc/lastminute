import { Redirect } from 'expo-router';

import { Landing } from '@/components/landing/Landing';
import { useIsWide } from '@/lib/layout';

// W00 landing for signed-out visitors on wide web. Phones already know why they opened the app: straight to sign-in.
export default function WelcomeScreen() {
  const wide = useIsWide();
  if (!wide) return <Redirect href="/login" />;
  return <Landing />;
}
