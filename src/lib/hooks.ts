import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export const WIDE_BREAKPOINT = 1024;

// The "v3 · Web" layout (top bar + sidebar + chat rail) applies to wide browser windows only;
// phones and narrow browsers get the "v3 · iOS 26" layout.
export function useIsWide() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
