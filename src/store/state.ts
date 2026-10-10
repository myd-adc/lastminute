import { pastChats, PAST_EVENT_IDS } from '@/data/mock';
import type { GoesWith, InterestId, Message, Photo, ReportReason, SceneId, Survey, Vibe } from '@/data/types';
import type { ThemeMode } from '@/theme';
import type { GradientId } from '@/theme/palette';

export const STATE_VERSION = 4;

export type Me = {
  name: string;
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

export type FeedTab = 'scene' | 'city' | 'saved';

export type Report = { userId: string; eventId?: string; reason: ReportReason; alsoBlock: boolean; at: string };

export type State = {
  version: number;
  // M01–M02: phone + SMS code (demo: any 6 digits).
  phone: string | null;
  phoneVerified: boolean;
  // M03
  me: Me | null;
  // M04
  interests: InterestId[];
  vibe: Vibe | null;
  goesWith: GoesWith | null;
  // M05
  sceneId: SceneId | null;
  studentEmail: string | null;
  onboarded: boolean;

  settings: {
    theme: ThemeMode;
    notify: { soloOnMyEvent: boolean; albumOpened: boolean; newSceneEvents: boolean };
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
};

export const pairKey = (eventId: string, userId: string) => `${eventId}:${userId}`;
export const dmChatId = (eventId: string, userId: string) => `dm:${eventId}:${userId}`;
export const groupChatId = (eventId: string) => `group:${eventId}`;

export const initialState: State = {
  version: STATE_VERSION,
  phone: null,
  phoneVerified: false,
  me: null,
  interests: [],
  vibe: null,
  goesWith: null,
  sceneId: null,
  studentEmail: null,
  onboarded: false,
  settings: {
    theme: 'dark',
    notify: { soloOnMyEvent: true, albumOpened: true, newSceneEvents: false },
    showSolo: true,
    showSharedEvents: true,
  },
  feedTab: 'scene',
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
};

export type Action =
  | { type: 'setPhone'; phone: string }
  | { type: 'verifyPhone' }
  | { type: 'setMe'; me: Me }
  | { type: 'setPreferences'; interests: InterestId[]; vibe: Vibe | null; goesWith: GoesWith | null }
  | { type: 'setScene'; sceneId: SceneId; studentEmail?: string | null }
  | { type: 'completeOnboarding'; notify: boolean }
  | { type: 'setTheme'; theme: ThemeMode }
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
  | { type: 'logout' };

// History a freshly onboarded demo user starts with: two past events with matches in «Минулі події».
function seedHistory(state: State): State {
  const going = { ...state.going };
  const decisions = { ...state.decisions };
  const messages = { ...state.messages };
  const myContacts = { ...state.myContacts };
  const surveys = { ...state.surveys };
  for (const eventId of PAST_EVENT_IDS) {
    going[eventId] = { at: new Date().toISOString(), with: 'solo', joinSoloGroup: false };
    surveys[eventId] = { talked: 'one', cameWith: 'match' };
  }
  for (const chat of pastChats) {
    decisions[pairKey(chat.eventId, chat.userId)] = { choice: 'go', at: chat.messages[0].at };
    messages[dmChatId(chat.eventId, chat.userId)] = chat.messages;
    if (chat.myContact) myContacts[pairKey(chat.eventId, chat.userId)] = chat.myContact;
  }
  return { ...state, going, decisions, messages, myContacts, surveys };
}

const omit = <T extends Record<string, unknown>>(obj: T, key: string): T => {
  const { [key]: _, ...rest } = obj;
  return rest as T;
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setPhone':
      return { ...state, phone: action.phone, phoneVerified: false };
    case 'verifyPhone':
      return { ...state, phoneVerified: true };
    case 'setMe':
      return { ...state, me: action.me };
    case 'setPreferences':
      return { ...state, interests: action.interests, vibe: action.vibe, goesWith: action.goesWith };
    case 'setScene':
      return { ...state, sceneId: action.sceneId, studentEmail: action.studentEmail ?? state.studentEmail };
    case 'completeOnboarding': {
      const next = {
        ...state,
        onboarded: true,
        settings: { ...state.settings, notify: { ...state.settings.notify, soloOnMyEvent: action.notify, albumOpened: action.notify } },
      };
      return seedHistory(next);
    }
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
    case 'logout':
      return { ...initialState, settings: { ...initialState.settings, theme: state.settings.theme } };
  }
}
