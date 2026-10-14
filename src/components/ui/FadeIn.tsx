import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

import { easeOut, ms, ND } from '@/lib/motion';

// Web stack screens mount with no transition at all; this eases each one in instead of a hard cut.
export function FadeIn({ children }: { children: ReactNode }) {
  const [p] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration: ms(240), easing: easeOut, useNativeDriver: ND }).start();
  }, [p]);
  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  return <Animated.View style={[styles.fill, { opacity: p, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// Stack `screenLayout` for web: fades every screen in except `skip` (overlays that animate themselves).
export function webScreenFade(skip: string[] = []) {
  if (Platform.OS !== 'web') return undefined;
  const own = new Set(skip);
  return function Layout({ route, children }: { route: { name: string }; children: ReactElement }) {
    return own.has(route.name) ? children : <FadeIn>{children}</FadeIn>;
  };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
