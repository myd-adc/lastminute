import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// Figma «glow»: a filled circle with a layer blur (feGaussianBlur). Rendered as a radial gradient whose stops follow
// the blurred-disc profile, so iOS, Android and web match without a blur filter.
const STOPS = 14;

// Abramowitz–Stegun erf approximation (|error| < 1.5e-7).
function erf(x: number) {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

export function Glow({
  cx,
  cy,
  r,
  blur,
  color,
  opacity,
}: {
  cx: number; // centre in the parent's coordinates
  cy: number;
  r: number;
  blur: number; // Figma blur stdDeviation
  color: string;
  opacity: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const R = r + blur * 3;
  const stops = Array.from({ length: STOPS + 1 }, (_, i) => {
    const d = (i / STOPS) * R;
    return { offset: i / STOPS, opacity: opacity * phi((r - d) / blur) };
  });
  return (
    <View style={{ position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, pointerEvents: 'none' }}>
      <Svg width={R * 2} height={R * 2}>
        <Defs>
          <RadialGradient id={`g${uid}`} cx={R} cy={R} r={R} fx={R} fy={R} gradientUnits="userSpaceOnUse">
            {stops.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={color} stopOpacity={s.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Circle cx={R} cy={R} r={R} fill={`url(#g${uid})`} />
      </Svg>
    </View>
  );
}
