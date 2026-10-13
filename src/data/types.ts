// Domain model. Mirrors the planned backend entities:
// user, community, event, attendance, interest (room decision), match, message, photo, report.
import type { GradientId } from '@/theme/palette';

// Anyone can start one; open to everyone or only to people with a confirmed e-mail on `emailDomain`.
export type Community = {
  id: string;
  name: string; // «УКУ», «Настолки Львів»
  description: string;
  gradient: GradientId;
  photoUri?: string; // cover photo; without one the initial sits on the gradient
  emailDomain: string | null; // «ucu.edu.ua»; null = open
  members: number;
  eventsThisWeek: number;
  mine: boolean; // the user created it: adds events, edits settings
};

export type InterestId =
  | 'concerts'
  | 'parties'
  | 'standup'
  | 'cinema'
  | 'lectures'
  | 'boardgames'
  | 'exhibitions'
  | 'dance'
  | 'books'
  | 'indie';

export type Interest = { id: InterestId; label: string; emoji: string };

export type Vibe = 'chamber' | 'party' | 'any';
export type GoesWith = 'solo' | 'pair' | 'company';

export type Event = {
  id: string;
  communityId: string | null; // null = city-wide event added by us
  title: string; // «Open mic: стендап для своїх»
  poster: { lines: string[]; emoji: string; gradient: GradientId }; // big poster word(s) on the feed card
  startsAt: string; // ISO
  endsAt: string; // ISO
  venue: string; // «Бар «Кульбаба»»
  address: string; // «вул. Вигадана, 12»
  walk?: string; // «7 хв пішки від УКУ»
  price: number | null; // UAH, null = free
  priceNote?: string;
  category: InterestId;
  ageLimit?: number;
  description: string;
  partner: boolean; // «Майданчик-партнер LastMinute»
  goingCount: number; // total «Я йду», including people who are not listed
  soloCount: number; // how many of them go without company
  metCount?: number; // live backend: people the user matched with before who are going (count only)
};

export type User = {
  id: string;
  name: string;
  age?: number; // not collected by the live backend yet
  gender?: 'f' | 'm';
  affiliation: string; // «Соціологія, 3 курс»
  talkAbout: string; // «Говори зі мною про…»
  tags: InterestId[];
  gradient: GradientId;
  photoUri?: string; // signed URL from the private bucket (live) — only for people the user may see
  sharedEvents: number; // «Були разом на N подіях» with the current user
};

export type Attendance = {
  eventId: string;
  userId: string;
  solo: boolean; // «Йде сама/сам»
  inSoloGroup?: boolean; // member of the «Самі на …» group chat
  // Mock-only behaviour of the other side:
  likesYou?: boolean; // already pressed «Піти разом» on the current user
  replies?: string[]; // what they answer in the DM, one per message the user sends
  leavesContact?: string; // contact they leave after the event («@yulia_l»)
};

export type MessageAuthor = 'me' | 'system' | string; // string = user id

export type Message = {
  id: string;
  from: MessageAuthor;
  text: string;
  at: string; // ISO
};

export type Photo = {
  id: string;
  eventId: string;
  authorId: 'me' | string;
  gradient: GradientId;
  emoji: string;
  uri?: string; // real photo picked by the user
  at: string;
};

export type ReportReason = 'messages' | 'dating' | 'fake' | 'unsafe' | 'other';

export type Survey = {
  talked: 'many' | 'one' | 'none' | null;
  cameWith: 'match' | 'solo' | 'friends' | null;
};
