import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { useT } from '@/i18n';
import { onCropRequest, type CropRect } from '@/lib/cropRequest';
import { onest, useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

type Request = { uri: string; width: number; height: number; resolve: (rect: CropRect | null) => void };

const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
// The dim around the round frame is a thick border on a circle larger than the square, clipped by the square.
const DIM = 200;

// Framing for profile photos and community covers: drag the photo to place it, zoom with the buttons (or the
// wheel on web), and the round frame shows what the avatar will be. Mounted once in the root layout.
export function CropperHost() {
  const [req, setReq] = useState<Request | null>(null);
  useEffect(() => onCropRequest(setReq), []);
  if (!req) return null;
  return (
    <Cropper
      key={req.uri}
      req={req}
      done={(rect) => {
        req.resolve(rect);
        setReq(null);
      }}
    />
  );
}

function Cropper({ req, done }: { req: Request; done: (rect: CropRect | null) => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const { width: winW, height: winH } = useWindowDimensions();
  const size = Math.min(winW - 40, winH - 260, 380);
  // Scale at zoom 1: the photo just covers the frame.
  const base = size / Math.min(req.width, req.height);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState(() => ({ x: (size - req.width * base) / 2, y: (size - req.height * base) / 2 }));
  const scale = base * zoom;
  const w = req.width * scale;
  const h = req.height * scale;
  const clamp = (p: { x: number; y: number }, sw = w, sh = h) => ({
    x: Math.min(0, Math.max(size - sw, p.x)),
    y: Math.min(0, Math.max(size - sh, p.y)),
  });

  // Zooms around the frame's centre, so the part in the middle stays in the middle.
  const zoomTo = (next: number) => {
    const z = Math.max(1, Math.min(MAX_ZOOM, next));
    const k = z / zoom;
    const cx = size / 2;
    setPos((p) => clamp({ x: cx - (cx - p.x) * k, y: cx - (cx - p.y) * k }, req.width * base * z, req.height * base * z));
    setZoom(z);
  };

  // Where the finger and the photo were when the drag began.
  const drag = useRef({ px: 0, py: 0, x: 0, y: 0 });
  const handlers = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => {
      drag.current = { px: e.nativeEvent.pageX, py: e.nativeEvent.pageY, x: pos.x, y: pos.y };
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const d = drag.current;
      setPos(clamp({ x: d.x + e.nativeEvent.pageX - d.px, y: d.y + e.nativeEvent.pageY - d.py }));
    },
  };

  const frame = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = frame.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  });

  const confirm = () =>
    done({
      originX: Math.round(-pos.x / scale),
      originY: Math.round(-pos.y / scale),
      width: Math.round(size / scale),
      height: Math.round(size / scale),
    });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => done(null)}>
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Text style={[onest('bold', 18, 23), { color: c.text }]}>{t('common.crop.title')}</Text>
        <Text style={[onest('regular', 14, 19), { color: c.muted, textAlign: 'center' }]}>{t('common.crop.hint')}</Text>
        <View ref={frame} style={[styles.frame, { width: size, height: size, backgroundColor: c.surface }]} {...handlers}>
          <Image source={{ uri: req.uri }} style={{ position: 'absolute', left: pos.x, top: pos.y, width: w, height: h }} />
          {/* Dims the corners outside the round avatar; the whole square is what gets saved. */}
          <View
            style={[
              styles.ring,
              { left: -DIM, top: -DIM, width: size + DIM * 2, height: size + DIM * 2, borderRadius: size / 2 + DIM, borderWidth: DIM, borderColor: 'rgba(11,11,16,0.55)' },
            ]}
          />
          <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: c.accent }]} />
        </View>
        <View style={styles.zoom}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.crop.zoomOut')} onPress={() => zoomTo(zoom - ZOOM_STEP)} style={[styles.zoomBtn, { backgroundColor: c.surface2 }]}>
            <Minus size={20} color={c.text} strokeWidth={2} />
          </Pressable>
          <View style={[styles.track, { backgroundColor: c.surface2 }]}>
            <View style={[styles.fill, { width: `${((zoom - 1) / (MAX_ZOOM - 1)) * 100}%`, backgroundColor: c.accent }]} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.crop.zoomIn')} onPress={() => zoomTo(zoom + ZOOM_STEP)} style={[styles.zoomBtn, { backgroundColor: c.surface2 }]}>
            <Plus size={20} color={c.text} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={[styles.actions, { width: size }]}>
          <Button label={t('common.cancel')} variant="secondary" onPress={() => done(null)} style={styles.flex} />
          <Button label={t('common.done')} onPress={confirm} style={styles.flex} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 },
  frame: { overflow: 'hidden', borderRadius: 24, cursor: 'grab' } as object,
  ring: { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' },
  zoom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zoomBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  track: { width: 160, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
});
