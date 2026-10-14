import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { rise, useOverlayMotion } from '@/lib/motion';
import { type, useTheme } from '@/theme';

// Lightweight transient message («Link copied»). Render `node` last inside the screen root.
export function useToast(bottom: number) {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((m: string) => {
    setMsg(m);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 2200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const node = msg ? <ToastView msg={msg} open={open} bottom={bottom} onHidden={() => setMsg(null)} /> : null;
  return { show, node };
}

function ToastView({ msg, open, bottom, onHidden }: { msg: string; open: boolean; bottom: number; onHidden: () => void }) {
  const { c } = useTheme();
  const { progress } = useOverlayMotion(open, onHidden);
  return (
    <Animated.View style={[styles.wrap, { bottom }, rise(progress)]} accessibilityLiveRegion="polite">
      <View style={[styles.toast, { backgroundColor: c.text }]}>
        <Text style={[type.subheadStrong, { color: c.bg }]}>{msg}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' },
  toast: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22 },
});
