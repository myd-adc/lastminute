import type { TextStyle } from 'react-native';

// Figma uses Unbounded for display text and Onest for everything else.
export const fonts = {
  display: 'Unbounded_700Bold',
  displaySemibold: 'Unbounded_600SemiBold',
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
};

// Unbounded headlines are tight in Figma (letter-spacing ≈ -2% of size).
export const display = (size: number, lineHeight = Math.round(size * 1.15)): TextStyle => ({
  fontFamily: fonts.display,
  fontSize: size,
  lineHeight,
  letterSpacing: -size * 0.02,
});

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
export const onest = (weight: Weight, size: number, lineHeight?: number): TextStyle => ({
  fontFamily: fonts[weight],
  fontSize: size,
  ...(lineHeight ? { lineHeight } : null),
});

// Named styles for the sizes that repeat across the v4 frames.
export const type = {
  hero: display(40, 44), // M01 «Не йди сам…»
  title: display(30, 36), // screen titles: «Чати», «Профіль», «Введи код з SMS»
  title2: display(24, 30), // event titles on sheets/cards
  title3: display(22, 28), // person name on the card
  button: onest('bold', 17),
  headline: onest('bold', 17, 22),
  bodyStrong: onest('semibold', 15, 20),
  body: onest('regular', 15, 21),
  callout: onest('medium', 15, 20),
  subhead: onest('regular', 14, 19),
  subheadStrong: onest('semibold', 14, 19),
  footnote: onest('regular', 13, 18),
  footnoteStrong: onest('semibold', 13, 18),
  caption: onest('medium', 12, 16),
};
