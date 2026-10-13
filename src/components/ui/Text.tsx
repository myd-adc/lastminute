import { Children, forwardRef, type ReactNode } from 'react';
import { Image, Platform, StyleSheet, Text as RNText, type ImageStyle, type TextProps } from 'react-native';

import { emojiAssets } from './emoji/assets';

// Drop-in for react-native's Text: emoji from the bundled Apple set render as images, so they look the same on
// iOS, Android and web instead of following each platform's emoji font. Anything outside the set stays a glyph.
const EMOJI = /([\u{1F1E6}-\u{1F1FF}]{2}|[©®←-⯿\u{1F000}-\u{1FAFF}]️?(?:‍[☀-➿\u{1F000}-\u{1FAFF}]️?)*)/u;
const SPLIT = new RegExp(EMOJI.source, 'gu');

// System emoji are drawn a bit larger than the font size; match that so Figma layouts don't shift.
const EMOJI_SCALE = 1.15;

function renderString(s: string, fontSize: number, lineHeight: number | undefined, key: number): ReactNode {
  if (!EMOJI.test(s)) return s;
  const box = Math.min(fontSize * EMOJI_SCALE, lineHeight ?? Infinity);
  const style: ImageStyle[] = [{ width: box, height: box }, Platform.OS === 'web' ? styles.webInline : {}];
  return s.split(SPLIT).map((part, i) => {
    const src = part ? emojiAssets[part.replace(/️/g, '')] : undefined;
    return src ? <Image key={`${key}-${i}`} source={src} accessibilityLabel={part} style={style} /> : part;
  });
}

export const Text = forwardRef<RNText, TextProps>(function Text({ children, style, ...rest }, ref) {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = flat.fontSize ?? 14;
  // Only direct string children: nested <Text> elements are this component too and handle their own.
  const content = Children.map(children, (child, i) => (typeof child === 'string' ? renderString(child, fontSize, flat.lineHeight, i) : child));
  return (
    <RNText ref={ref} style={style} {...rest}>
      {content}
    </RNText>
  );
});

const styles = StyleSheet.create({
  // react-native-web lays an Image out as a block box; keep it in the text line like a glyph.
  webInline: { display: 'inline-flex' as 'flex', verticalAlign: 'text-bottom' } as ImageStyle,
});
