import type { Community } from '@/data/types';
import { t } from '@/i18n/translate';

// "Only @ucu.edu.ua ✓ · 142 participants · 6 events this week" / "Open · 38 participants · 2 events this week".
export function communityMeta(c: Community, member: boolean) {
  const access = c.emailDomain ? `${t('community.meta.onlyDomain', { domain: c.emailDomain })}${member ? ' ✓' : ''}` : t('community.meta.open');
  return [access, t('community.meta.members', { count: c.members }), t('community.meta.events', { count: c.eventsThisWeek })].join(' · ');
}

// "142 participants · 6 events this week" under the community name.
export const communityCounts = (c: Community) =>
  [t('community.meta.members', { count: c.members }), t('community.meta.events', { count: c.eventsThisWeek })].join(' · ');

export const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
export const normalizeDomain = (s: string) => s.trim().toLowerCase().replace(/^@/, '');
