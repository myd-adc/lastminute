import { Platform, useWindowDimensions } from 'react-native';

export const WIDE_BREAKPOINT = 1024;

// Web at ≥ 1024 px renders the «Веб» frames (sidebar shell); phones and narrow browsers get the «Мобільний» frames.
export function useIsWide() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
}

// Figma: the 64 pt glass tab bar ends 34 pt above the screen bottom (the home-indicator zone on a 390×844 frame).
export const TAB_BAR_HEIGHT = 64;
export const tabBarBottom = (bottomInset: number) => Math.max(bottomInset, 34);
// Scroll content clears the bar plus a 16 pt gap.
export const tabBarClearance = (bottomInset: number) => TAB_BAR_HEIGHT + tabBarBottom(bottomInset) + 16;
// Pinned bottom CTAs sit 38 pt above the screen bottom in the frames (34 pt home indicator + 4).
export const footerBottom = (bottomInset: number) => Math.max(bottomInset, 34) + 4;
