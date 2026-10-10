import { getInterest, getScene } from '@/data/mock';
import type { Event } from '@/data/types';
import { t } from '@/i18n/translate';

export const priceLabel = (e: Event) => (e.price == null ? t('common.free') : t('common.price', { price: e.price }));

// «Open mic: …» → «Open mic» (used in «You’re going to …», «Solo at …»).
export const shortTitle = (e: Event) => e.title.split(':')[0].trim();

export const categoryLabel = (e: Event) => {
  const i = getInterest(e.category);
  return i ? `${i.emoji} ${i.label}` : '';
};

export const sceneName = (e: Event) => getScene(e.sceneId).name;

export const mapsUrl = (e: Event) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.address}, ${t('feed.city')}`)}`;

export const matchesLabel = (n: number) => t('feed.end.matches', { count: n });
