import { useStore } from '@/store/AppStore';

import { t, type TKey } from './translate';

export * from './core';
export * from './translate';

// Hook for components: re-renders on language change (it reads the store) and returns `t` bound to the language.
export function useT() {
  const { state } = useStore();
  const lang = state.language;
  return { t: (key: TKey, params?: Record<string, string | number>) => t(key, params, lang), lang };
}
