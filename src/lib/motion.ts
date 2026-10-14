import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

// Web has no native driver; Animated falls back to JS there and warns if asked.
export const ND = Platform.OS !== 'web';
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => (reduceMotion = v))
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => (reduceMotion = v));

// Durations collapse to 0 under the system «reduce motion» setting.
export const ms = (duration: number) => (reduceMotion ? 0 : duration);

export const ENTER = 280;
export const EXIT = 200;

// Enter/exit progress (0 → 1) for sheets, dialogs and toasts. Routes mount overlays without a transition on web,
// so the overlay animates itself and `exit` plays the way out before the route is popped.
// `open` drives it from outside (a Modal kept mounted until `onHidden`).
export function useOverlayMotion(open = true, onHidden?: () => void) {
  const [progress] = useState(() => new Animated.Value(0));
  const hidden = useRef(onHidden);
  const leaving = useRef(false);
  useEffect(() => {
    hidden.current = onHidden;
  });
  useEffect(() => {
    if (open) leaving.current = false;
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: ms(open ? ENTER : EXIT),
      easing: open ? easeOut : easeIn,
      useNativeDriver: ND,
    }).start(({ finished }) => {
      if (finished && !open) hidden.current?.();
    });
  }, [open, progress]);
  const exit = useCallback(
    (then: () => void) => {
      if (leaving.current) return;
      leaving.current = true;
      Animated.timing(progress, { toValue: 0, duration: ms(EXIT), easing: easeIn, useNativeDriver: ND }).start(() => then());
    },
    [progress],
  );
  return { progress, exit };
}

const lerp = (p: Animated.Value, from: number, to: number) => p.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

// Bottom sheet: slides up by its own height.
export const slideUp = (p: Animated.Value, height: number) => ({ transform: [{ translateY: lerp(p, height, 0) }] });

// Centred dialog: fades in, rises 16 pt and grows from 97 %.
export const pop = (p: Animated.Value) => ({ opacity: p, transform: [{ translateY: lerp(p, 16, 0) }, { scale: lerp(p, 0.97, 1) }] });

// Toast and small chips: fades in, rises 8 pt.
export const rise = (p: Animated.Value) => ({ opacity: p, transform: [{ translateY: lerp(p, 8, 0) }] });
