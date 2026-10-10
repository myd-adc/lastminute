import { Platform, useWindowDimensions } from 'react-native';

export const WIDE_BREAKPOINT = 1024;

// Web at ≥ 1024 px renders the «Веб» frames (sidebar shell); phones and narrow browsers get the «Мобільний» frames.
export function useIsWide() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
}

// Floating glass tab bar: 64 pt high, 24 pt above the home indicator. Scroll content must clear it.
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_GAP = 24;
export const tabBarClearance = (bottomInset: number) => TAB_BAR_HEIGHT + Math.max(bottomInset, 12) + TAB_BAR_GAP;
