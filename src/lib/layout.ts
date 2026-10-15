import { Platform, StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';

export const WIDE_BREAKPOINT = 1024;

// Web at ≥ 1024 px renders the Figma web frames (sidebar shell); phones and narrow browsers get the mobile frames.
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

// Wide-web overlays (W04 dialog, sheets): routes render inside the WebShell's main column, so absoluteFill would
// leave the sidebar uncovered. Fixed positioning pins the dim and the dialog to the whole window, as in the frames.
export const fullWindow: ViewStyle =
  Platform.OS === 'web' ? ({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 } as unknown as ViewStyle) : StyleSheet.absoluteFill;

// react-native-web ignores hitSlop, so a bare icon button gets its 44 pt target from padding instead; the negative
// margin keeps the icon where the layout put it. Native keeps using hitSlop.
export const webHitArea = (iconSize: number): ViewStyle | null => {
  if (Platform.OS !== 'web') return null;
  const pad = Math.max(0, (44 - iconSize) / 2);
  return { padding: pad, margin: -pad };
};
