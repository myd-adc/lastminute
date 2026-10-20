import { useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Platform, StyleSheet, View, type ImageResizeMode, type StyleProp, type ViewStyle } from 'react-native';

import { easeOut, ms, ND } from '@/lib/motion';
import { useTheme } from '@/theme';

// URLs that already arrived this session: they render at once, without the placeholder or the fade.
const arrived = new Set<string>();

// Starts downloads before the photos are on screen (the next posters in the feed), so a swipe finds them ready.
// Web: a detached <img> only warms the HTTP cache. react-native-web's Image.prefetch keeps every decoded bitmap in
// a request table it never clears, which grew until iOS Safari killed the tab after a few swipes.
const requested = new Set<string>();
export function prefetchImages(uris: (string | undefined)[]) {
  for (const uri of uris) {
    if (!uri || arrived.has(uri) || requested.has(uri)) continue;
    requested.add(uri);
    if (Platform.OS === 'web') {
      const img = new window.Image();
      img.decoding = 'async';
      img.src = uri;
      continue;
    }
    Image.prefetch(uri)
      .then((ok) => ok && arrived.add(uri))
      .catch(() => requested.delete(uri));
  }
}

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
// `loader`: a spinner on top of the tile, for big photos (event posters) where the wait is noticeable;
// `placeholder: false` keeps whatever is behind visible instead of the tile (the poster's own gradient).
export function RemoteImage({
  uri,
  style,
  resizeMode = 'cover',
  loader,
  placeholder = true,
  blurRadius,
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  loader?: boolean;
  placeholder?: boolean;
  blurRadius?: number;
}) {
  const { c } = useTheme();
  const breathe = sharedPulse();
  const [ready] = useState(() => arrived.has(uri));
  const [shown, setShown] = useState(ready);
  const [opacity] = useState(() => new Animated.Value(ready ? 1 : 0));
  return (
    <View style={[styles.frame, style]}>
      {!shown && placeholder && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface2, opacity: breathe }]} />}
      {!shown && loader && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator size="large" color={c.text} />
        </View>
      )}
      <Animated.Image
        source={{ uri }}
        resizeMode={resizeMode}
        blurRadius={blurRadius}
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
  center: { alignItems: 'center', justifyContent: 'center' },
});
