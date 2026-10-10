import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useT } from '@/i18n';

const N = 25;

// Deterministic QR-looking grid (three finder squares + pseudo-random modules). Purely decorative art,
// so it is always black on white like a real code.
const cells: [number, number][] = (() => {
  const out: [number, number][] = [];
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() > 0.52) out.push([x, y]);
  return out;
})();

const finders: [number, number][] = [
  [0, 0],
  [N - 7, 0],
  [0, N - 7],
];

export function QrPlaceholder({ size = 132 }: { size?: number }) {
  const { t } = useT();
  const pad = 2;
  const view = N + pad * 2;
  return (
    <View accessibilityLabel={t('onboarding.login.qrA11y')} style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${view} ${view}`}>
        <Rect x={0} y={0} width={view} height={view} fill="#FFFFFF" />
        {finders.map(([x, y], i) => (
          <Rect key={`f${i}`} x={x + pad + 0.5} y={y + pad + 0.5} width={6} height={6} rx={1.4} fill="none" stroke="#0B0B10" strokeWidth={1} />
        ))}
        {finders.map(([x, y], i) => (
          <Rect key={`c${i}`} x={x + pad + 2} y={y + pad + 2} width={3} height={3} rx={0.6} fill="#0B0B10" />
        ))}
        {cells.map(([x, y]) => (
          <Rect key={`${x}-${y}`} x={x + pad + 0.1} y={y + pad + 0.1} width={0.8} height={0.8} rx={0.3} fill="#0B0B10" />
        ))}
      </Svg>
    </View>
  );
}
