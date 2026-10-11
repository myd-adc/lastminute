import { memo, useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// A Figma «glow»: a filled circle (radius `r`, centre `x`/`y`, fill opacity `opacity`) under a layer blur
// with standard deviation `blur`. Coordinates are in frame points; `left`/`top` shift the whole set
// (e.g. `insets.top - 50` to replace the 50 pt Figma status bar with the device safe area).
export type GlowSpec = { x: number; y: number; r: number; color: string; opacity: number; blur: number };

// Abramowitz–Stegun erf, good to ~1e-7.
function erf(x: number) {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}

// Radial profile of a Gaussian-blurred disc: ½·erfc((d − r) / (σ√2)), sampled into gradient stops.
function stops(r: number, blur: number) {
  const reach = r + blur * 2.6;
  const out: { offset: number; alpha: number }[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const d = (reach * i) / n;
    out.push({ offset: i / n, alpha: i === n ? 0 : 0.5 * (1 - erf((d - r) / (blur * Math.SQRT2))) });
  }
  return { reach, out };
}

export const Glows = memo(function Glows({ glows, left = 0, top = 0 }: { glows: GlowSpec[]; left?: number; top?: number }) {
  const uid = `glow${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg style={styles.fill} width="100%" height="100%">
      <Defs>
        {glows.map((g, i) => {
          const { reach, out } = stops(g.r, g.blur);
          return (
            <RadialGradient key={i} id={`${uid}-${i}`} cx={g.x + left} cy={g.y + top} r={reach} gradientUnits="userSpaceOnUse">
              {out.map((s, k) => (
                <Stop key={k} offset={s.offset} stopColor={g.color} stopOpacity={s.alpha * g.opacity} />
              ))}
            </RadialGradient>
          );
        })}
      </Defs>
      {glows.map((g, i) => (
        <Circle key={i} cx={g.x + left} cy={g.y + top} r={stops(g.r, g.blur).reach} fill={`url(#${uid}-${i})`} />
      ))}
    </Svg>
  );
});

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
