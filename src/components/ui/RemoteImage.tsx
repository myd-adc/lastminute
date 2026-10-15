import { useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ImageResizeMode, type StyleProp, type ViewStyle } from 'react-native';

import { easeOut, ms, ND } from '@/lib/motion';
import { useTheme } from '@/theme';

// URLs that already arrived this session: they render at once, without the placeholder or the fade.
const arrived = new Set<string>();

// One shared breathing loop for every placeholder on screen, started on first use.
let pulse: Animated.Value | null = null;
function sharedPulse() {
  if (!pulse) {
    pulse = new Animated.Value(1);
    if (ms(1)) {
      const ease = Easing.inOut(Easing.quad);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: ease, useNativeDriver: ND }),
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: ease, useNativeDriver: ND }),
        ]),
      ).start();
    }
  }
  return pulse;
}

// A photo people uploaded (avatar, person card, community cover, album). Until the bytes arrive it shows a pulsing
// tile instead of an empty hole, then fades the photo in. `style` sizes and shapes the frame.
export function RemoteImage({ uri, style, resizeMode = 'cover' }: { uri: string; style?: StyleProp<ViewStyle>; resizeMode?: ImageResizeMode }) {
  const { c } = useTheme();
  const breathe = sharedPulse();
  const [ready] = useState(() => arrived.has(uri));
  const [shown, setShown] = useState(ready);
  const [opacity] = useState(() => new Animated.Value(ready ? 1 : 0));
  return (
    <View style={[styles.frame, style]}>
      {!shown && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface2, opacity: breathe }]} />}
      <Animated.Image
        source={{ uri }}
        resizeMode={resizeMode}
        accessibilityIgnoresInvertColors
        onLoad={() => {
          arrived.add(uri);
          setShown(true);
          Animated.timing(opacity, { toValue: 1, duration: ms(200), easing: easeOut, useNativeDriver: ND }).start();
        }}
        style={[StyleSheet.absoluteFill, { opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
});
