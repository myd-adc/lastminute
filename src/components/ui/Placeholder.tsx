
import { type, useTheme } from '@/theme';

import { Header, Screen } from './Screen';
import { Text } from './Text';

// Temporary stand-in for a route that is not implemented yet.
export function Placeholder({ title, frame }: { title: string; frame: string }) {
  const { c } = useTheme();
  return (
    <Screen>
      <Header title={title} />
      <Text style={[type.body, { color: c.muted }]}>Екран {frame} ще в роботі.</Text>
    </Screen>
  );
}
