import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { useT } from '@/i18n';
import { ND } from '@/lib/motion';
import { useTheme } from '@/theme';

const Pulse = createContext<Animated.Value | null>(null);

// M06s–M18s, W03s: one pulse for the whole screen, so every bone breathes together (none with reduced motion).
export function Skeleton({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { t } = useT();
  const [value] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (!alive || reduce) return;
        const ease = Easing.inOut(Easing.quad);
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(value, { toValue: 0.45, duration: 700, easing: ease, useNativeDriver: ND }),
            Animated.timing(value, { toValue: 1, duration: 700, easing: ease, useNativeDriver: ND }),
          ]),
        );
        loop.start();
      });
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [value]);
  return (
    <Pulse.Provider value={value}>
      <Animated.View accessible accessibilityRole="progressbar" accessibilityLabel={t('common.loading')} style={style}>
        {children}
      </Animated.View>
    </Pulse.Provider>
  );
}

// A placeholder block in the text colour at 8 %, as in the Figma «bone» layers.
export function Bone({ w, h, r = 10, style }: { w?: number | `${number}%`; h: number; r?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const pulse = useContext(Pulse);
  return <Animated.View style={[{ width: w ?? '100%', height: h, borderRadius: r, backgroundColor: `${c.text}14`, opacity: pulse ?? 1 }, style]} />;
}
