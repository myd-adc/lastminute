import type { TextStyle } from 'react-native';

// Tokens mirror the Figma variables of "LastMinute — App UI" v3 (ios/*).
export const colors = {
  label: '#000000',
  label2: '#6E6E73',
  label3: '#A9A9AE',
  tint: '#FF4A1C',
  tintSoft: '#FFEDE7',
  green: '#34C759',
  elevated: '#FFFFFF',
  grouped: '#F2F2F7',
  fill: '#EFEFF4',
  separator: '#E3E3E8',
};

export const avatarColors = ['#FFB26B', '#9A8BFF', '#5EC6A8', '#FF8FA3', '#6FB7FF'];

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const t = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
});

// Figma text styles: iOS/* for the phone layout, Web/* for the wide web layout.
export const type = {
  largeTitle: t(fonts.bold, 34, 41, 0.37),
  title2: t(fonts.bold, 22, 28, 0.35),
  title3: t(fonts.semibold, 20, 25, 0.38),
  headline: t(fonts.semibold, 17, 22, -0.43),
  body: t(fonts.regular, 17, 22, -0.43),
  callout: t(fonts.regular, 16, 21, -0.31),
  subhead: t(fonts.regular, 15, 20, -0.23),
  subheadMedium: t(fonts.medium, 15, 20, -0.23),
  footnote: t(fonts.regular, 13, 18, -0.08),
  caption: t(fonts.regular, 12, 16, 0),
  dateNumeral: t(fonts.bold, 20, 24, 0.3),

  webDisplay: t(fonts.bold, 36, 42, -0.8),
  webH2: t(fonts.semibold, 22, 28, -0.3),
  webH3: t(fonts.semibold, 17, 24, -0.2),
  webBody: t(fonts.regular, 15, 22, -0.1),
  webBodyMedium: t(fonts.medium, 15, 22, -0.1),
  webNav: t(fonts.medium, 14, 20, -0.1),
  webCaption: t(fonts.regular, 13, 18, 0),
  webCaptionMedium: t(fonts.medium, 13, 18, 0),
  webEyebrow: t(fonts.semibold, 11, 14, 0.8),
  webNumeral: t(fonts.bold, 22, 26, -0.2),
};

// Space reserved under scrollable content for the floating glass tab bar.
export const TAB_BAR_CLEARANCE = 118;
