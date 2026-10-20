import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useId, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

import { RemoteImage } from '@/components/ui/RemoteImage';
import { Text } from '@/components/ui/Text';
import type { Event } from '@/data/types';
import { fonts, gradients, useTheme } from '@/theme';

// Poster layouts measured from the Figma frames (all values in points of the reference width `w`).
// words: top-left corner of the first line after the 6° rotation; ring: accent circle bounding box;
// emoji: text box origin; scrim: bottom-anchored fade (height, opacity at 45 %); topScrim: top fade height.
type Spec = {
  w: number;
  words: { x: number; y: number; size: number };
  ring?: { x: number; y: number; d: number };
  emoji?: { x: number; y: number; size: number };
  scrim?: { h: number; mid: number };
  topScrim?: number;
  // Where a poster photo sits whole (contained): top inset and the share of the height kept free at the bottom for
  // the card's text. Posters are mostly portrait 1:√2, so a cover crop on a tall phone cut off their sides and text.
  photo?: { top: number; bottomFree: number };
};

const SPECS = {
  feed: { w: 390, words: { x: 17.97, y: 112, size: 118 }, ring: { x: 120, y: -60, d: 420 }, emoji: { x: 260, y: 330, size: 90 }, scrim: { h: 520, mid: 0.82 }, topScrim: 140, photo: { top: 92, bottomFree: 0.36 } }, // M06
  backdrop: { w: 390, words: { x: 17.97, y: 70, size: 118 } }, // M07 behind the sheet
  card: { w: 440, words: { x: 21.93, y: 70, size: 128 }, ring: { x: 150, y: -80, d: 420 }, emoji: { x: 310, y: 300, size: 90 }, scrim: { h: 460, mid: 0.85 }, photo: { top: 16, bottomFree: 0.4 } }, // W03
  dialog: { w: 380, words: { x: 19.96, y: 120, size: 110 }, ring: { x: 120, y: -80, d: 360 }, emoji: { x: 250, y: 420, size: 80 }, photo: { top: 16, bottomFree: 0.1 } }, // W04
} satisfies Record<string, Spec>;

export type PosterVariant = keyof typeof SPECS;

type Props = {
  event: Event;
  width: number;
  height: number;
  variant: PosterVariant;
  // Vertical shift of the frame coordinates: on phones `insets.top - 50` (safe area instead of the 50 pt status bar).
  shift?: number;
};

const LINE = 0.88; // Figma line height of the poster words
const BOX = 1.2; // RN line box per line (avoids glyph clipping); glyphs stay centred like in Figma
const ROT = 6;

// The Figma poster fill: same handles in every frame, so the CSS angle is 90° + atan(4/3 · w/h);
// stops at 7 % / 39 % / 79 %. Drawn with SVG in user space so iOS, Android and web agree.
function PosterFill({ colors, width, height }: { colors: readonly string[]; width: number; height: number }) {
  // Unique per instance: several posters share one DOM on web.
  const id = `poster${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const angle = ((90 + (Math.atan((4 / 3) * (width / height)) * 180) / Math.PI) * Math.PI) / 180;
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const offsets = colors.length === 3 ? [0.0714, 0.3929, 0.7857] : colors.map((_, i) => 0.0714 + (0.7143 * i) / Math.max(1, colors.length - 1));
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={id} gradientUnits="userSpaceOnUse" x1={cx - dx * half} y1={cy - dy * half} x2={cx + dx * half} y2={cy + dy * half}>
          {colors.map((col, i) => (
            <Stop key={i} offset={offsets[i]} stopColor={col} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

// Generated event poster (M06/M07/W03/W04): gradient, huge rotated Unbounded words bleeding off the edge,
// a thin accent ring, an oversized emoji and the frame's scrims.
export const PosterArt = memo(function PosterArt({ event, width, height, variant, shift = 0 }: Props) {
  const { c, scheme } = useTheme();
  const spec: Spec = SPECS[variant];
  const k = width / spec.w;
  const size = spec.words.size * k;
  const scrim = scheme === 'light' ? '218,217,214' : '11,11,16';
  return (
    <View style={[styles.clip, { width, height }]}>
      <PosterFill colors={gradients[event.poster.gradient]} width={width} height={height} />
      {/* A poster photo replaces the generated words: shown whole, with rounded corners, above the card's text, over a
          blurred and dimmed copy of itself; the backdrop variant behind a sheet just takes the blurred copy. */}
      {event.image ? (
        <>
          <RemoteImage uri={event.image} style={StyleSheet.absoluteFill} placeholder={false} blurRadius={spec.photo ? 28 : 18} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(${scrim},${spec.photo ? 0.5 : 0.3})` }]} />
          {spec.photo && (
            <PosterPhoto
              uri={event.image}
              box={{ x: 16 * k, y: spec.photo.top * k + shift, w: width - 32 * k, h: height * (1 - spec.photo.bottomFree) - spec.photo.top * k - shift }}
              radius={16 * k}
            />
          )}
        </>
      ) : null}
      {!event.image && spec.ring && (
        <View
          style={[
            styles.ring,
            { left: spec.ring.x * k, top: spec.ring.y * k + shift, width: spec.ring.d * k, height: spec.ring.d * k, borderRadius: (spec.ring.d * k) / 2, borderColor: c.accent },
          ]}
        />
      )}
      {!event.image && (
        <View style={[styles.words, { left: spec.words.x * k, top: spec.words.y * k + shift }]}>
          {event.poster.lines.map((line, i) => (
            // No numberOfLines: on web it adds maxWidth: 100% of the 1 pt anchor and clips the word.
            <Text
              key={i}
              style={[
                styles.word,
                {
                  color: c.bg,
                  top: i * LINE * size - ((BOX - LINE) / 2) * size,
                  fontSize: size,
                  lineHeight: BOX * size,
                  letterSpacing: -size * 0.06,
                  width: width * 2.4,
                },
              ]}
            >
              {line}
            </Text>
          ))}
        </View>
      )}
      {!event.image && spec.emoji && (
        <Text style={[styles.emoji, { left: spec.emoji.x * k, top: spec.emoji.y * k + shift, fontSize: spec.emoji.size * k }]}>{event.poster.emoji}</Text>
      )}
      {spec.topScrim && (
        <LinearGradient
          colors={[`rgba(${scrim},0.55)`, `rgba(${scrim},0)`]}
          style={[styles.top, { height: spec.topScrim + shift }]}
        />
      )}
      {spec.scrim && (
        <LinearGradient
          colors={[`rgba(${scrim},0)`, `rgba(${scrim},${spec.scrim.mid})`, `rgb(${scrim})`]}
          locations={[0, 0.45, 1]}
          style={[styles.bottom, { height: spec.scrim.h * k }]}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', pointerEvents: 'none' },
  ring: { position: 'absolute', borderWidth: 3, opacity: 0.9 },
  words: { position: 'absolute', width: 1, height: 1, transformOrigin: 'left top', transform: [{ rotate: `${ROT}deg` }] },
  word: { position: 'absolute', left: 0, fontFamily: fonts.display },
  emoji: { position: 'absolute' },
  top: { position: 'absolute', left: 0, right: 0, top: 0 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

// Natural size of each poster photo, so it can be fitted into its box and rounded at its own edges.
const photoSizes = new Map<string, { w: number; h: number }>();

function PosterPhoto({ uri, box, radius }: { uri: string; box: { x: number; y: number; w: number; h: number }; radius: number }) {
  const [size, setSize] = useState(() => photoSizes.get(uri) ?? null);
  useEffect(() => {
    if (photoSizes.has(uri)) return;
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        photoSizes.set(uri, { w, h });
        if (alive) setSize({ w, h });
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [uri]);
  // Until the size is known, a spinner fills the whole box.
  const scale = size ? Math.min(box.w / size.w, box.h / size.h) : 1;
  const w = size ? size.w * scale : box.w;
  const h = size ? size.h * scale : box.h;
  return (
    <RemoteImage
      key={size ? 'fitted' : 'box'}
      uri={uri}
      loader
      placeholder={false}
      style={{ position: 'absolute', left: box.x + (box.w - w) / 2, top: box.y, width: w, height: h, borderRadius: radius }}
    />
  );
}
