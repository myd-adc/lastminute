import Svg, { Circle, Path } from 'react-native-svg';

// The brand mark: the wordmark's dot breaking into a run (Figma "Brand · Runner" → "Mark v2 / Dash").
// Drawn in its own 738 × 400 box; `height` sets the size, the width follows.
export function BrandMark({ height, color }: { height: number; color: string }) {
  return (
    <Svg width={(height * 738) / 400} height={height} viewBox="0 0 738 400">
      <Circle cx={538} cy={200} r={200} fill={color} />
      <Path d="M128 70 L278 70" stroke={color} strokeWidth={56} strokeLinecap="round" opacity={0.55} />
      <Path d="M28 200 L278 200" stroke={color} strokeWidth={56} strokeLinecap="round" />
      <Path d="M128 330 L278 330" stroke={color} strokeWidth={56} strokeLinecap="round" opacity={0.55} />
    </Svg>
  );
}
