import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

// Figma «glow» layers: a filled circle (centre x/y, radius r, colour, opacity) under a layer blur.
// The light frames use deeper inks of the same hues. Positions are in frame coordinates.
type Glow = { x: number; y: number; r: number; blur: number; color: readonly [dark: string, light: string]; opacity: number };
type Variant = {
  w: number; // frame width; x scales with the container width
  h: number; // frame height; y scales with the container height only when `scaleY`
  scaleY?: boolean;
  glows: Glow[];
};

const PINK = ['#FF3D8B', '#E3246C'] as const;
const VIOLET = ['#7C5CFF', '#6847FF'] as const;
const LIME = ['#D7FF3B', '#D7FF3B'] as const;

// Figma blur 90 = Gaussian σ 45 (mobile), blur 140 = σ 70 (web).
const variants = {
  // M01: pink top-left, violet right, a faint lime top-right (reads grey-olive over the other two).
  login: {
    w: 390,
    h: 844,
    glows: [
      { x: 70, y: 180, r: 160, blur: 45, color: PINK, opacity: 0.55 },
      { x: 320, y: 270, r: 150, blur: 45, color: VIOLET, opacity: 0.6 },
      { x: 310, y: 160, r: 100, blur: 45, color: LIME, opacity: 0.22 },
    ],
  },
  // M02: magenta glow top-right.
  code: { w: 390, h: 844, glows: [{ x: 310, y: 30, r: 130, blur: 45, color: PINK, opacity: 0.3 }] },
  // M03: violet glow top-left.
  profile: { w: 390, h: 844, glows: [{ x: 50, y: 70, r: 130, blur: 45, color: VIOLET, opacity: 0.35 }] },
  // M04: violet glow top-right.
  interests: { w: 390, h: 844, glows: [{ x: 350, y: 30, r: 150, blur: 45, color: VIOLET, opacity: 0.35 }] },
  // W01 hero half (840 × 900).
  wide: {
    w: 840,
    h: 900,
    scaleY: true,
    glows: [
      { x: 140, y: 340, r: 260, blur: 70, color: PINK, opacity: 0.45 },
      { x: 540, y: 480, r: 240, blur: 70, color: VIOLET, opacity: 0.5 },
      { x: 280, y: 680, r: 160, blur: 70, color: LIME, opacity: 0.18 },
    ],
  },
} satisfies Record<string, Variant>;

export type GlowVariant = keyof typeof variants;

// Gaussian-blurred disc profile, sampled as radial-gradient stops (renders the same on iOS, Android and web,
// where SVG blur filters are unreliable). alpha(d) = ∫ g(x − d) · P(|y| < √(R² − x²)) dx over the disc.
const erf = (x: number) => {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
};

const STOPS = 14;
const profiles = new Map<string, { offset: number; alpha: number }[]>();

function profile(r: number, sigma: number) {
  const key = `${r}:${sigma}`;
  const cached = profiles.get(key);
  if (cached) return cached;
  const extent = r + 3 * sigma;
  const steps = 80;
  const dx = (2 * r) / steps;
  const out = Array.from({ length: STOPS }, (_, i) => {
    const offset = i / (STOPS - 1);
    const d = offset * extent;
    let sum = 0;
    for (let k = 0; k < steps; k++) {
      const x = -r + (k + 0.5) * dx;
      const half = Math.sqrt(r * r - x * x);
      const gx = Math.exp(-((x - d) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
      sum += gx * erf(half / (sigma * Math.SQRT2)) * dx;
    }
    return { offset, alpha: i === STOPS - 1 ? 0 : Math.min(1, sum) };
  });
  profiles.set(key, out);
  return out;
}

// Per-frame background glows. Absolute, behind the content, never intercepts touches.
export function HeroBlobs({ variant, style }: { variant: GlowVariant; style?: StyleProp<ViewStyle> }) {
  const { scheme } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const v: Variant = variants[variant];
  return (
    <View style={[StyleSheet.absoluteFill, styles.clip, style]}>
      {v.glows.map((g, i) => {
        const extent = g.r + 3 * g.blur;
        const color = g.color[scheme === 'light' ? 1 : 0];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: extent * 2,
              height: extent * 2,
              left: `${(g.x / v.w) * 100}%`,
              top: v.scaleY ? `${(g.y / v.h) * 100}%` : g.y,
              marginLeft: -extent,
              marginTop: -extent,
            }}
          >
            <Svg width={extent * 2} height={extent * 2}>
              <Defs>
                <RadialGradient id={`${uid}g${i}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%" gradientUnits="objectBoundingBox">
                  {profile(g.r, g.blur).map((s) => (
                    <Stop key={s.offset} offset={s.offset} stopColor={color} stopOpacity={s.alpha * g.opacity} />
                  ))}
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={extent * 2} height={extent * 2} fill={`url(#${uid}g${i})`} />
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', pointerEvents: 'none' },
});
