import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { gradients, type GradientId } from '@/theme/palette';

// Diagonal fill matching the ~145° Figma gradients (top-left → bottom-right).
export function Gradient({
  id,
  colors,
  style,
  children,
}: {
  id?: GradientId;
  colors?: readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const stops = (colors ?? gradients[id ?? 'aurora']) as unknown as [string, string, ...string[]];
  return (
    <LinearGradient colors={stops} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}
