// Mirrors the planned backend entities: user, event, attendance, interest, match, message, photo.

export type SceneId = 'ucu' | 'polytech' | 'picasso';

export type Scene = {
  id: SceneId;
  name: string;
};

export type Event = {
  id: string;
  sceneId: SceneId;
  title: string;
  venue: string;
  address?: string;
  startsAt: string; // ISO
  // Total "Я йду" count, including people who hide themselves (only visible profiles are listed).
  goingCount: number;
};

export type User = {
  id: string;
  name: string;
  sceneId: SceneId;
  affiliation: string; // e.g. "ПЗ-32, Політехніка"
  bio: string;
  tags: string[];
  color: string;
};

export type Attendance = {
  eventId: string;
  userId: string;
  note?: string; // why/how they are going to this event
  // Mock-only: this attendee has already sent the current user an interest request,
  // and this is the first message they write once the match opens.
  wantsToGoWithYou?: { opener: string };
};

export type Message = {
  id: string;
  fromMe: boolean;
  text: string;
  sentAt: string;
};
