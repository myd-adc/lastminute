import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

// Figma draws the M15/W08 glows as flat circles with a layer blur (Gaussian, σ = stdDeviation). We rebuild that
// falloff as a radial gradient so it renders identically on iOS, Android and web (no blur filters needed).
type Blob = {
  // Circle centre, measured from the container's top edge and its left (x) or right (fromRight) edge.
  x?: number;
  fromRight?: number;
  y: number;
  r: number;
  sigma: number;
  opacity: number;
  dark: string;
  light: string;
};

// Standard normal CDF via the Abramowitz–Stegun erf approximation (|error| < 1.5e-7).
function phi(x: number) {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + (x >= 0 ? erf : -erf));
}

const STOPS = [0, 0.15, 0.3, 0.42, 0.52, 0.62, 0.72, 0.82, 0.91, 1];

export const glows = {
  // M15 "How did it go?": orange top-left, pink top-right (390 pt frame).
  after: [
    { x: 60, y: 100, r: 140, sigma: 45, opacity: 0.35, dark: '#FF8A3D', light: '#FF7426' },
    { fromRight: 80, y: 160, r: 120, sigma: 45, opacity: 0.35, dark: '#FF3D8B', light: '#E3246C' },
  ],
  // W08: the same pair inside the 640 pt dialog.
  afterWide: [
    { x: 49, y: 29, r: 150, sigma: 55, opacity: 0.35, dark: '#FF8A3D', light: '#FF7426' },
    { fromRight: 91, y: 29, r: 130, sigma: 55, opacity: 0.35, dark: '#FF3D8B', light: '#E3246C' },
  ],
  // M19/M19b community page: one violet glow behind the back button and title.
  community: [{ x: 50, y: 70, r: 130, sigma: 45, opacity: 0.35, dark: '#7C5CFF', light: '#6847FF' }],
} satisfies Record<string, Blob[]>;

export function Glow({ blobs }: { blobs: Blob[] }) {
  const { scheme } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {blobs.map((b, i) => {
        const outer = b.r + 3 * b.sigma;
        const size = outer * 2;
        const color = scheme === 'light' ? b.light : b.dark;
        const pos = b.fromRight !== undefined ? { right: b.fromRight - outer } : { left: (b.x ?? 0) - outer };
        return (
          <Svg key={i} width={size} height={size} style={{ position: 'absolute', top: b.y - outer, ...pos }}>
            <Defs>
              <RadialGradient id={`${uid}g${i}`} cx="50%" cy="50%" r="50%">
                {STOPS.map((o) => (
                  <Stop key={o} offset={o} stopColor={color} stopOpacity={b.opacity * phi((b.r - o * outer) / b.sigma)} />
                ))}
              </RadialGradient>
            </Defs>
            <Circle cx={outer} cy={outer} r={outer} fill={`url(#${uid}g${i})`} />
          </Svg>
        );
      })}
    </View>
  );
}
