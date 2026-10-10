import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

type Blob = { cx: string; cy: string; r: string; color: string; opacity: number };

// Soft blurred colour fields from the Figma hero (pink top-left, violet centre-right, a hint of lime low-left).
// Radial gradients instead of blur filters so it renders the same on iOS, Android and web.
const variants: Record<'hero' | 'corner' | 'wide', Blob[]> = {
  hero: [
    { cx: '18%', cy: '22%', r: '70%', color: '#FF3D8B', opacity: 0.55 },
    { cx: '80%', cy: '38%', r: '65%', color: '#7C5CFF', opacity: 0.6 },
    { cx: '70%', cy: '8%', r: '50%', color: '#7C5CFF', opacity: 0.25 },
  ],
  corner: [{ cx: '95%', cy: '0%', r: '75%', color: '#7C5CFF', opacity: 0.4 }],
  wide: [
    { cx: '12%', cy: '30%', r: '55%', color: '#FF3D8B', opacity: 0.5 },
    { cx: '70%', cy: '55%', r: '55%', color: '#7C5CFF', opacity: 0.55 },
    { cx: '25%', cy: '85%', r: '40%', color: '#D7FF3B', opacity: 0.16 },
  ],
};

// `height` pins the art to the top edge (header glow); without it the blobs fill the parent.
export function HeroBlobs({ variant = 'hero', height, style }: { variant?: keyof typeof variants; height?: number; style?: StyleProp<ViewStyle> }) {
  const { scheme } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const blobs = variants[variant];
  const boost = scheme === 'light' ? 0.8 : 1;
  return (
    <View style={[height ? { position: 'absolute', top: 0, left: 0, right: 0, height } : StyleSheet.absoluteFill, { pointerEvents: 'none' }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          {blobs.map((b, i) => (
            <RadialGradient key={i} id={`${uid}b${i}`} cx={b.cx} cy={b.cy} r={b.r} fx={b.cx} fy={b.cy} gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity * boost} />
              <Stop offset="0.55" stopColor={b.color} stopOpacity={b.opacity * boost * 0.35} />
              <Stop offset="1" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {blobs.map((_, i) => (
          <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#${uid}b${i})`} />
        ))}
      </Svg>
    </View>
  );
}
