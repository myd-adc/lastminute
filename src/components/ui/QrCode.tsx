import createQr from 'qrcode-generator';
import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

// The brand code, same geometry as the printed artwork from scripts/qr.mjs: dark modules on the lime panel,
// 7-5-3 finder eyes and the "=●" mark knocked out of the centre, which error correction H pays for.
// Dark on lime in both themes: an inverted code is a coin flip on older scanners.

const QUIET = 4;
const HOLE = 0.2; // centre clearing, as a share of the code's width

// The mark measured off the identity lockup, in dot radii: stroke 0.28r, lines at y ±0.65r, running from
// -2.05r (-2.55r for the middle one) to -1.3r; it reaches 2.69r left of the dot centre.
const MARK_LINES: [number, number][] = [
  [-0.65, -2.05],
  [0, -2.55],
  [0.65, -2.05],
];

const f = (n: number) => +n.toFixed(3);

// Rounded rectangle as a path; the counter-clockwise one cuts a hole under the nonzero rule.
function rr(x: number, y: number, w: number, h: number, r: number, ccw = false) {
  if (!ccw)
    return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)}Z`;
  return `M${f(x + r)} ${f(y)}A${r} ${r} 0 0 0 ${f(x)} ${f(y + r)}V${f(y + h - r)}A${r} ${r} 0 0 0 ${f(x + r)} ${f(y + h)}H${f(x + w - r)}A${r} ${r} 0 0 0 ${f(x + w)} ${f(y + h - r)}V${f(y + r)}A${r} ${r} 0 0 0 ${f(x + w - r)} ${f(y)}Z`;
}

function build(value: string) {
  const qr = createQr(0, 'H');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const total = n + QUIET * 2;
  // From version 7 on an alignment pattern sits in the middle of the code and the mark would cover it. The app's
  // own links are kept short enough to stay below that (lib/links.ts); anything longer stays plain.
  const mark = (n - 17) / 4 <= 6;
  const c = total / 2;
  const clear = (total * HOLE) / 2 + 0.6;
  const inFinder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  // One path for the whole code: modules are rounded squares at full size, since a decoder reads run lengths
  // and gaps between neighbours break them.
  let d = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.isDark(y, x) || inFinder(x, y)) continue;
      if (mark && Math.hypot(x + QUIET + 0.5 - c, y + QUIET + 0.5 - c) < clear) continue;
      d += rr(x + QUIET, y + QUIET, 1, 1, 0.3);
    }
  }
  for (const [fx, fy] of [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ]) {
    const X = fx + QUIET;
    const Y = fy + QUIET;
    d += rr(X, Y, 7, 7, 0.9) + rr(X + 1, Y + 1, 5, 5, 0.7, true) + rr(X + 2, Y + 2, 3, 3, 0.55);
  }
  return { total, d, mark };
}

export function QrCode({ value, label, size = 132 }: { value: string; label: string; size?: number }) {
  const { c } = useTheme();
  const { total, d, mark } = useMemo(() => build(value), [value]);
  const r = total * HOLE * 0.27;
  const cx = total / 2 + (r * (2.69 - 1)) / 2;
  const cy = total / 2;

  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${total} ${total}`}>
        <Rect x={0} y={0} width={total} height={total} rx={total * 0.07} fill={c.accent} />
        <Path d={d} fill={c.onAccent} />
        {mark && (
          <>
            <Circle cx={cx} cy={cy} r={r} fill={c.onAccent} />
            {MARK_LINES.map(([dy, x0], i) => (
              <Path
                key={i}
                d={`M${cx + r * x0} ${cy + r * dy}H${cx - r * 1.3}`}
                stroke={c.onAccent}
                strokeWidth={r * 0.28}
                strokeLinecap="round"
              />
            ))}
          </>
        )}
      </Svg>
    </View>
  );
}
