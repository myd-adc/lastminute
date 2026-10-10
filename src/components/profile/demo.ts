import { events, getEvent, PAST_EVENT_IDS } from '@/data/mock';
import type { Event } from '@/data/types';
import { HOUR } from '@/lib/time';
import type { State } from '@/store/state';

export type DemoMode = 'now' | 'live' | 'after';

const LIVE_AFTER_START = 30 * 60 * 1000;
const AFTER_END = HOUR;

// The event the demo clock jumps to: the next one the user is going to (by real time), else «Open mic».
// Uses the real clock, not the demo one, so the target stays the same while the offset is applied.
export function demoTarget(state: State): Event {
  const real = Date.now();
  const next = events
    .filter((e) => state.going[e.id] && !PAST_EVENT_IDS.includes(e.id) && Date.parse(e.endsAt) > real)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  return next ?? getEvent('open-mic')!;
}

export function demoOffsetFor(mode: DemoMode, target: Event): number {
  if (mode === 'now') return 0;
  const at = mode === 'live' ? Date.parse(target.startsAt) + LIVE_AFTER_START : Date.parse(target.endsAt) + AFTER_END;
  return at - Date.now();
}

// Which chip is active: derived from where the demo clock currently stands relative to the target event.
export function demoMode(state: State, target: Event): DemoMode | null {
  if (state.demoOffsetMs === 0) return 'now';
  const now = Date.now() + state.demoOffsetMs;
  const start = Date.parse(target.startsAt);
  const end = Date.parse(target.endsAt);
  if (now >= start && now < end) return 'live';
  if (now >= end) return 'after';
  return null;
}
