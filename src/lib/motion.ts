import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Platform } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

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

// Bottom sheet: slides up by its own height, plus the live drag offset while the user pulls it down.
export const slideUp = (p: Animated.Value, height: number, drag?: Animated.Value) => ({
  transform: [{ translateY: drag ? Animated.add(lerp(p, height, 0), drag) : lerp(p, height, 0) }],
});

// Pull past this (or flick faster than this) and the sheet closes instead of springing back.
const DISMISS_DY = 110;
const DISMISS_VY = 1.2;

const settle = (drag: Animated.Value) => Animated.spring(drag, { toValue: 0, speed: 16, bounciness: 6, useNativeDriver: ND }).start();

// Drag-to-dismiss for bottom sheets: the gesture is picked up on the handle, or on the content while it sits at the
// very top of its scroll. Past the threshold the sheet hands over to the caller's exit animation, which keeps playing
// from wherever the finger left it.
export function useSheetDrag(onDismiss: () => void, enabled = true) {
  const [drag] = useState(() => new Animated.Value(0));
  // Scrolled-away content keeps its own scroll; only a sheet sitting at the top follows the finger.
  const [atTop, setAtTop] = useState(true);
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, m) => enabled && atTop && m.dy > 8 && m.dy > Math.abs(m.dx) * 1.5,
    onPanResponderMove: (_, m) => drag.setValue(Math.max(0, m.dy)),
    onPanResponderRelease: (_, m) => {
      if (m.dy > DISMISS_DY || m.vy > DISMISS_VY) onDismiss();
      else settle(drag);
    },
    onPanResponderTerminate: () => settle(drag),
  });
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => setAtTop(e.nativeEvent.contentOffset.y <= 0), []);
  return { drag, panHandlers: responder.panHandlers, onScroll };
}

// Centred dialog: fades in, rises 16 pt and grows from 97 %.
export const pop = (p: Animated.Value) => ({ opacity: p, transform: [{ translateY: lerp(p, 16, 0) }, { scale: lerp(p, 0.97, 1) }] });

// Toast and small chips: fades in, rises 8 pt.
export const rise = (p: Animated.Value) => ({ opacity: p, transform: [{ translateY: lerp(p, 8, 0) }] });

// Web: Escape closes the topmost overlay. Each one pushes its handler; only the last one fires.
const escapeStack: (() => void)[] = [];
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && escapeStack.length) escapeStack[escapeStack.length - 1]();
  });
}

export function useEscape(onEscape: () => void, enabled = true) {
  const handler = useRef(onEscape);
  useEffect(() => {
    handler.current = onEscape;
  });
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;
    const fire = () => handler.current();
    escapeStack.push(fire);
    return () => {
      const i = escapeStack.lastIndexOf(fire);
      if (i >= 0) escapeStack.splice(i, 1);
    };
  }, [enabled]);
}

// Content that slides in from the side it comes from when `key` changes (feed tabs: left of "For you" comes in from
// the left). `order` lists the keys left to right. A short travel from half-visible with a hard ease-out reads as
// the page settling into place; a long slide from transparent showed the black background behind it.
// Set before paint, so the new content never flashes in place.
const settleEase = Easing.out(Easing.exp);
export function useSlideIn(key: string, order: readonly string[], distance = 28) {
  const [x] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const prev = useRef(key);
  useLayoutEffect(() => {
    if (prev.current === key) return;
    const dir = Math.sign(order.indexOf(key) - order.indexOf(prev.current)) || 1;
    prev.current = key;
    x.setValue(dir * distance);
    opacity.setValue(0.5);
    Animated.parallel([
      Animated.timing(x, { toValue: 0, duration: ms(320), easing: settleEase, useNativeDriver: ND }),
      Animated.timing(opacity, { toValue: 1, duration: ms(180), easing: easeOut, useNativeDriver: ND }),
    ]).start();
  }, [key, order, distance, x, opacity]);
  return { opacity, transform: [{ translateX: x }] };
}

// Horizontal swipe between neighbours in `order` (the feed tabs). It claims the gesture only when it is clearly
// sideways, so vertical scrolling stays with the list; the content follows the finger with resistance, then either
// hands over to the next key or springs back. Swiping left moves to the key on the right.
export function useSideSwipe(key: string, order: readonly string[], onChange: (next: string) => void) {
  const [drag] = useState(() => new Animated.Value(0));
  const i = order.indexOf(key);
  const springBack = () => Animated.spring(drag, { toValue: 0, useNativeDriver: ND, speed: 18, bounciness: 6 }).start();
  const responder = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderMove: (_, g) => {
      // No neighbour on that side: a stiffer pull says so.
      const edge = (g.dx > 0 && i <= 0) || (g.dx < 0 && i >= order.length - 1);
      drag.setValue(g.dx * (edge ? 0.12 : 0.35));
    },
    onPanResponderRelease: (_, g) => {
      const next = g.dx < 0 ? order[i + 1] : order[i - 1];
      if (next && (Math.abs(g.dx) > 70 || Math.abs(g.vx) > 0.5)) {
        drag.setValue(0);
        onChange(next);
      } else springBack();
    },
    onPanResponderTerminate: springBack,
  });
  return { drag, panHandlers: responder.panHandlers };
}
