import type { Plural } from '../core';

// English dictionaries must mirror the Ukrainian keys; plural leaves may use one/other instead of one/few/many.
export type Translation<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends Plural ? Plural : Translation<T[K]>;
};
