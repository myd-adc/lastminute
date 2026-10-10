import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type, useTheme } from '@/theme';

// Lightweight transient message («Link copied»). Render `node` last inside the screen root.
export function useToast(bottom: number) {
  const { c } = useTheme();
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const node = msg ? (
    <View style={[styles.wrap, { bottom }]} accessibilityLiveRegion="polite">
      <View style={[styles.toast, { backgroundColor: c.text }]}>
        <Text style={[type.subheadStrong, { color: c.bg }]}>{msg}</Text>
      </View>
    </View>
  ) : null;

  return { show, node };
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' },
  toast: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22 },
});
