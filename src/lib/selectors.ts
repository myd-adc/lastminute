import { attendeesOf, events, getScene, getUser } from '@/data/mock';
import type { Attendance, Event, SceneId, User } from '@/data/types';

type SelectorState = {
  myScenes: SceneId[];
  sceneFilter: SceneId | 'all';
  search: string;
  blocked: Record<string, boolean>;
};

export type Attendee = { user: User; attendance: Attendance };

// Events of the user's scenes only — the product never opens the whole city.
export function myEvents(state: SelectorState, applyFilters = true): Event[] {
  const q = state.search.trim().toLowerCase();
  return events
    .filter((e) => state.myScenes.includes(e.sceneId))
    .filter((e) => !applyFilters || state.sceneFilter === 'all' || e.sceneId === state.sceneFilter)
    .filter(
      (e) =>
        !applyFilters ||
        !q ||
        [e.title, e.venue, getScene(e.sceneId).name].some((s) => s.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

// Visible attendees, people from the user's own scenes first.
export function attendeesFor(eventId: string, state: SelectorState): Attendee[] {
  return attendeesOf(eventId)
    .map((attendance) => ({ attendance, user: getUser(attendance.userId) }))
    .filter((a): a is Attendee => !!a.user && !state.blocked[a.user.id])
    .sort((a, b) => Number(state.myScenes.includes(b.user.sceneId)) - Number(state.myScenes.includes(a.user.sceneId)));
}

export const fromMySceneCount = (eventId: string, state: SelectorState) =>
  attendeesFor(eventId, state).filter((a) => state.myScenes.includes(a.user.sceneId)).length;
