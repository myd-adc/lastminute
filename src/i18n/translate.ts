// Pure translation function (no store import, safe to use from formatters and data modules).
import { getLang, interpolate, pickPlural, type Lang, type Plural } from './core';
import { en } from './locales/en';
import type { Translation } from './locales/types';
import { uk } from './locales/uk';

// Dictionaries: `uk` is the source of truth; `en` must have the same shape (enforced by its type).
export type Dict = typeof uk;
const dicts: Record<Lang, Translation<Dict>> = { uk, en };

type Leaf = string | Plural;
// Dot paths to leaves: 'common.save', 'feed.goingCount'…
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Leaf ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Paths<Dict>;

function lookup(dict: Translation<Dict>, key: string): Leaf | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return node as Leaf | undefined;
}

// t('feed.going', { count: 14 }) — plural entries need `count`; {param} placeholders are filled from params.
export function t(key: TKey, params?: Record<string, string | number>, lang: Lang = getLang()): string {
  const leaf = lookup(dicts[lang], key) ?? lookup(dicts.uk, key);
  if (leaf === undefined) return key;
  const text = typeof leaf === 'string' ? leaf : pickPlural(leaf, Number(params?.count ?? 0), lang);
  return interpolate(text, params);
}

