import { Image, Platform, StyleSheet, View } from 'react-native';

import { emojiAssets } from './assets';

const sources = Object.values(emojiAssets);

// react-native-web draws an Image only once its URL is in its load cache, so each emoji popped in late the first
// time a screen showed it. Mounting the whole set once, invisibly, loads them all and keeps them cached.
export function EmojiPreload() {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={styles.hidden} aria-hidden>
      {sources.map((src, i) => (
        <Image key={i} source={src} style={styles.img} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' },
  img: { width: 1, height: 1 },
});
