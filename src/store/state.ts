import type { Synced } from '@/api/sync';
import { pastChats, PAST_EVENT_IDS } from '@/data/mock';
import type { Community, Event, GoesWith, InterestId, Message, Photo, ReportReason, Survey, Vibe } from '@/data/types';
import { deviceLang, type Lang } from '@/i18n/core';
import type { ThemeMode } from '@/theme';
import type { GradientId } from '@/theme/palette';

export const STATE_VERSION = 7;

export type Me = {
  name: string;
  username?: string; // «taras.k», shown as @taras.k; unique on the server
  affiliation: string; // «Філософія, 4 курс», optional
  talkAbout: string; // «Говори зі мною про…», ≤ 80 chars
  gradient: GradientId;
  photoUri?: string;
};

export type Going = {
  at: string;
  with: 'solo' | 'friends'; // M08 «Ти йдеш сам чи з кимось?»
  joinSoloGroup: boolean; // M08 «Додати мене» to «Самі на …»
};

// 'saved' is reached from the bookmark next to the tabs and shows as a tab only while open.
export type FeedTab = 'forYou' | 'communities' | 'met' | 'saved';

export type Report = { userId: string; eventId?: string; reason: ReportReason; alsoBlock: boolean; at: string };

export type State = {
  version: number;
  language: Lang;
  // M01–M02: e-mail + code from the letter (demo: any 6 digits).
  email: string | null;
  emailVerified: boolean;
  // M03
  me: Me | null;
  // M04
  interests: InterestId[];
  vibe: Vibe | null;
  goesWith: GoesWith | null;
  onboarded: boolean;
  // Communities the user is in (server-owned in live mode).
  memberships: Record<string, { at: string }>;
  // Demo mode only: communities and events the user created (the server keeps them in live mode).
  localCommunities: Community[];
  localEvents: Event[];

  settings: {
    theme: ThemeMode;
    notify: { soloOnMyEvent: boolean; albumOpened: boolean; newCommunityEvents: boolean };
    showSolo: boolean; // «Показувати, що я йду сам(а)»
    showSharedEvents: boolean; // «Показувати спільні події»
  };

  feedTab: FeedTab;
  skipped: Record<string, true>; // eventId → swiped away with ✕
  saved: Record<string, true>; // eventId → «Зберегти»
  going: Record<string, Going>; // eventId → «Я йду»
  // Room swipe decisions per person per event: pairKey → 'go' («Піти разом») | 'skip' (✕).
  decisions: Record<string, { choice: 'go' | 'skip'; at: string }>;
  messages: Record<string, Message[]>; // chatId → thread
  lastRead: Record<string, string>; // chatId → ISO
  groupMeetConfirmed: Record<string, true>; // eventId → «Я буду» at the group meeting point
  myContacts: Record<string, string>; // pairKey → contact the user left («@taras_hnatyk»)
  closedChats: Record<string, true>; // chatId → «Закрити чат зараз»
  photos: Photo[]; // photos the user added to albums
  surveys: Record<string, Survey>; // eventId → M15 answers
  reports: Report[];
  blocked: Record<string, true>; // userId
  demoOffsetMs: number; // demo clock: shifts «now» to preview live/after-event states
  syncedAt: string | null; // live backend: last server snapshot (server data itself lives in the data layer)
};

export const pairKey = (eventId: string, userId: string) => `${eventId}:${userId}`;
export const dmChatId = (eventId: string, userId: string) => `dm:${eventId}:${userId}`;
export const groupChatId = (eventId: string) => `group:${eventId}`;

export const initialState: State = {
  version: STATE_VERSION,
  language: deviceLang(),
  email: null,
  emailVerified: false,
  me: null,
  interests: [],
  vibe: null,
  goesWith: null,
  onboarded: false,
  memberships: {},
  localCommunities: [],
  localEvents: [],
  settings: {
    theme: 'dark',
    notify: { soloOnMyEvent: true, albumOpened: true, newCommunityEvents: false },
    showSolo: true,
    showSharedEvents: true,
  },
  feedTab: 'forYou',
  skipped: {},
  saved: {},
  going: {},
  decisions: {},
  messages: {},
  lastRead: {},
  groupMeetConfirmed: {},
  myContacts: {},
  closedChats: {},
  photos: [],
  surveys: {},
  reports: [],
  blocked: {},
  demoOffsetMs: 0,
  syncedAt: null,
};

export type Action =
  | { type: 'setEmail'; email: string }
  | { type: 'verifyEmail' }
  | { type: 'setMe'; me: Me }
  | { type: 'setPreferences'; interests: InterestId[]; vibe: Vibe | null; goesWith: GoesWith | null }
  | { type: 'joinCommunity'; communityId: string }
  | { type: 'leaveCommunity'; communityId: string }
  | { type: 'createCommunity'; community: Community }
  | { type: 'updateCommunity'; communityId: string; patch: Partial<Community> }
  | { type: 'deleteCommunity'; communityId: string }
  | { type: 'createEvent'; event: Event }
  | { type: 'completeOnboarding'; notify: boolean; seedDemo?: boolean }
  | { type: 'restoreAccount'; me: Me; interests: InterestId[]; vibe: Vibe | null; goesWith: GoesWith | null }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'setLanguage'; language: Lang }
  | { type: 'setNotify'; key: keyof State['settings']['notify']; value: boolean }
  | { type: 'setPrivacy'; key: 'showSolo' | 'showSharedEvents'; value: boolean }
  | { type: 'setFeedTab'; tab: FeedTab }
  | { type: 'skipEvent'; eventId: string }
  | { type: 'resetSkipped' }
  | { type: 'toggleSaved'; eventId: string }
  | { type: 'go'; eventId: string }
  | { type: 'setGoing'; eventId: string; patch: Partial<Going> }
  | { type: 'leave'; eventId: string }
  | { type: 'decide'; eventId: string; userId: string; choice: 'go' | 'skip' }
  | { type: 'addMessage'; chatId: string; message: Message }
  | { type: 'markRead'; chatId: string; at: string }
  | { type: 'toggleGroupMeet'; eventId: string }
  | { type: 'leaveContact'; eventId: string; userId: string; contact: string }
  | { type: 'closeChat'; chatId: string }
  | { type: 'addPhoto'; photo: Photo }
  | { type: 'saveSurvey'; eventId: string; survey: Survey }
  | { type: 'report'; report: Report }
  | { type: 'block'; userId: string }
  | { type: 'unblock'; userId: string }
  | { type: 'setDemoOffset'; ms: number }
  | { type: 'hydrate'; state: State }
  | { type: 'sync'; synced: Synced }
  | { type: 'logout' };

// History a freshly onboarded demo user starts with: two past events with matches in «Минулі події», two communities.
function seedHistory(state: State): State {
  const going = { ...state.going };
  const decisions = { ...state.decisions };
  const myContacts = { ...state.myContacts };
  const surveys = { ...state.surveys };
  for (const eventId of PAST_EVENT_IDS) {
    going[eventId] = { at: new Date().toISOString(), with: 'solo', joinSoloGroup: false };
    surveys[eventId] = { talked: 'one', cameWith: 'match' };
  }
  for (const chat of pastChats) {
    decisions[pairKey(chat.eventId, chat.userId)] = { choice: 'go', at: chat.messages[0].at };
    if (chat.myContact) myContacts[pairKey(chat.eventId, chat.userId)] = chat.myContact;
  }
  // The demo user is already in two communities, so the Communities tab has something to show.
  const at = new Date().toISOString();
  const memberships = { ...state.memberships, ucu: { at }, kulbaba: { at } };
  return { ...state, going, decisions, myContacts, surveys, memberships };
}

const omit = <T extends Record<string, unknown>>(obj: T, key: string): T => {
  const { [key]: _, ...rest } = obj;
  return rest as T;
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.email, emailVerified: false };
    case 'verifyEmail':
      return { ...state, emailVerified: true };
    case 'setMe':
      return { ...state, me: action.me };
    case 'setPreferences':
      return { ...state, interests: action.interests, vibe: action.vibe, goesWith: action.goesWith };
    case 'joinCommunity':
      return { ...state, memberships: { ...state.memberships, [action.communityId]: { at: new Date().toISOString() } } };
    case 'leaveCommunity':
      return { ...state, memberships: omit(state.memberships, action.communityId) };
    case 'createCommunity':
      return {
        ...state,
        localCommunities: [...state.localCommunities, action.community],
        memberships: { ...state.memberships, [action.community.id]: { at: new Date().toISOString() } },
      };
    case 'updateCommunity':
      return {
        ...state,
        localCommunities: state.localCommunities.map((c) => (c.id === action.communityId ? { ...c, ...action.patch } : c)),
      };
    case 'deleteCommunity':
      return {
        ...state,
        localCommunities: state.localCommunities.filter((c) => c.id !== action.communityId),
        localEvents: state.localEvents.filter((e) => e.communityId !== action.communityId),
        memberships: omit(state.memberships, action.communityId),
      };
    case 'createEvent':
      return { ...state, localEvents: [...state.localEvents, action.event] };
    case 'completeOnboarding': {
      const next = {
        ...state,
        onboarded: true,
        settings: { ...state.settings, notify: { ...state.settings.notify, soloOnMyEvent: action.notify, albumOpened: action.notify } },
      };
      // Demo mode starts with a fake history; the live backend starts empty.
      return action.seedDemo === false ? next : seedHistory(next);
    }
    case 'restoreAccount': {
      const { type: _, ...account } = action;
      return { ...state, ...account, emailVerified: true, onboarded: true };
    }
    case 'setLanguage':
      return { ...state, language: action.language };
    case 'setTheme':
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case 'setNotify':
      return { ...state, settings: { ...state.settings, notify: { ...state.settings.notify, [action.key]: action.value } } };
    case 'setPrivacy':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'setFeedTab':
      return { ...state, feedTab: action.tab };
    case 'skipEvent':
      return { ...state, skipped: { ...state.skipped, [action.eventId]: true } };
    case 'resetSkipped':
      return { ...state, skipped: {} };
    case 'toggleSaved':
      return {
        ...state,
        saved: state.saved[action.eventId] ? omit(state.saved, action.eventId) : { ...state.saved, [action.eventId]: true },
      };
    case 'go':
      if (state.going[action.eventId]) return state;
      return {
        ...state,
        going: {
          ...state.going,
          [action.eventId]: { at: new Date().toISOString(), with: state.goesWith === 'company' ? 'friends' : 'solo', joinSoloGroup: true },
        },
        skipped: omit(state.skipped, action.eventId),
      };
    case 'setGoing': {
      const current = state.going[action.eventId];
      if (!current) return state;
      return { ...state, going: { ...state.going, [action.eventId]: { ...current, ...action.patch } } };
    }
    case 'leave':
      return { ...state, going: omit(state.going, action.eventId) };
    case 'decide':
      return {
        ...state,
        decisions: {
          ...state.decisions,
          [pairKey(action.eventId, action.userId)]: { choice: action.choice, at: new Date().toISOString() },
        },
      };
    case 'addMessage':
      return {
        ...state,
        messages: { ...state.messages, [action.chatId]: [...(state.messages[action.chatId] ?? []), action.message] },
      };
    case 'markRead':
      return { ...state, lastRead: { ...state.lastRead, [action.chatId]: action.at } };
    case 'toggleGroupMeet':
      return {
        ...state,
        groupMeetConfirmed: state.groupMeetConfirmed[action.eventId]
          ? omit(state.groupMeetConfirmed, action.eventId)
          : { ...state.groupMeetConfirmed, [action.eventId]: true },
      };
    case 'leaveContact':
      return { ...state, myContacts: { ...state.myContacts, [pairKey(action.eventId, action.userId)]: action.contact } };
    case 'closeChat':
      return { ...state, closedChats: { ...state.closedChats, [action.chatId]: true } };
    case 'addPhoto':
      return { ...state, photos: [...state.photos, action.photo] };
    case 'saveSurvey':
      return { ...state, surveys: { ...state.surveys, [action.eventId]: action.survey } };
    case 'report':
      return {
        ...state,
        reports: [...state.reports, action.report],
        blocked: action.report.alsoBlock ? { ...state.blocked, [action.report.userId]: true } : state.blocked,
      };
    case 'block':
      return { ...state, blocked: { ...state.blocked, [action.userId]: true } };
    case 'unblock':
      return { ...state, blocked: omit(state.blocked, action.userId) };
    case 'setDemoOffset':
      return { ...state, demoOffsetMs: action.ms };
    case 'hydrate':
      return action.state;
    case 'sync': {
      // The server is the source of truth for the user's own photo too (a fresh signed URL each sync).
      const { myPhoto, ...synced } = action.synced;
      const me = state.me && myPhoto !== undefined ? { ...state.me, photoUri: myPhoto ?? undefined } : state.me;
      return { ...state, ...synced, me };
    }
    case 'logout':
      return { ...initialState, language: state.language, settings: { ...initialState.settings, theme: state.settings.theme } };
  }
}
