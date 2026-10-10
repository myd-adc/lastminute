import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Palette } from './palette';

export * from './palette';
export * from './typography';

export type ThemeMode = 'dark' | 'light' | 'system';
export type Scheme = 'dark' | 'light';

type Theme = { c: Palette; scheme: Scheme };

const ThemeContext = createContext<Theme>({ c: dark, scheme: 'dark' });

export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const system = useColorScheme();
  const scheme: Scheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
  const value = useMemo(() => ({ c: scheme === 'light' ? light : dark, scheme }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Theme-aware StyleSheet: `const s = useStyles(makeStyles)` with `makeStyles = (c: Palette) => StyleSheet.create({...})`
// declared at module level so the factory identity is stable.
export function useStyles<T>(factory: (c: Palette, scheme: Scheme) => T): T {
  const { c, scheme } = useTheme();
  return useMemo(() => factory(c, scheme), [factory, c, scheme]);
}
