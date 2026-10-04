import { avatarColors } from '@/theme';

import type { Attendance, Event, Scene, SceneId, User } from './types';

export const scenes: Scene[] = [
  { id: 'ucu', name: 'УКУ' },
  { id: 'polytech', name: 'Політехніка' },
  { id: 'picasso', name: 'Picasso' },
];

export const events: Event[] = [
  {
    id: 'standup',
    sceneId: 'polytech',
    title: 'Стендап: відкритий мікрофон',
    venue: 'Під Клепсидрою',
    address: 'Вірменська 35',
    startsAt: '2026-10-10T19:00:00+03:00',
    goingCount: 14,
  },
  {
    id: 'architecture',
    sceneId: 'ucu',
    title: 'Як читати архітектуру Львова',
    venue: 'УКУ, ауд. 302',
    address: 'Козельницька 2а',
    startsAt: '2026-10-06T18:30:00+03:00',
    goingCount: 21,
  },
  {
    id: 'boardgames',
    sceneId: 'ucu',
    title: 'Вечір настолок',
    venue: 'Кабінет',
    address: 'Шептицьких 24',
    startsAt: '2026-10-07T20:00:00+03:00',
    goingCount: 11,
  },
  {
    id: 'last-commit',
    sceneId: 'polytech',
    title: 'Хакатон-вечірка «Last Commit»',
    venue: 'Політехніка, 1-й корпус',
    address: 'Бандери 12',
    startsAt: '2026-10-08T17:00:00+03:00',
    goingCount: 32,
  },
  {
    id: 'jazz',
    sceneId: 'picasso',
    title: 'Jazz jam session',
    venue: 'Picasso',
    address: 'Зелена 88',
    startsAt: '2026-10-09T21:00:00+03:00',
    goingCount: 28,
  },
];

const u = (
  id: string,
  name: string,
  sceneId: SceneId,
  affiliation: string,
  bio: string,
  tags: string[],
  colorIndex: number,
): User => ({ id, name, sceneId, affiliation, bio, tags, color: avatarColors[colorIndex] });

export const users: User[] = [
  u('sofia', 'Софія', 'polytech', 'ПЗ-32, Політехніка', 'Люблю живі виступи й довгі розмови після.', ['стендап', 'настолки', 'кава'], 0),
  u('ostap', 'Остап', 'polytech', 'КН-31, Політехніка', 'Шукаю, де у Львові грають живу музику.', ['музика', 'бар', 'велосипед'], 1),
  u('marta', 'Марта', 'ucu', 'УКУ, журналістика', 'Пишу про локальну культуру.', ['подкасти', 'фото', 'книги'], 2),
  u('danylo', 'Данило', 'polytech', 'ПЗ-33, Політехніка', 'Бекенд, гітара, гори.', ['IT', 'гітара', 'гори'], 3),
  u('olya', 'Оля', 'ucu', 'УКУ, історія', 'Вперше на таких подіях, шукаю компанію.', ['архітектура', 'кіно'], 4),
  u('khrystia', 'Христя', 'ucu', 'УКУ, психологія', 'Настолки — моя терапія.', ['настолки', 'чай'], 0),
  u('yulia', 'Юля', 'picasso', 'ЛНУ, музикознавство', 'Граю на саксофоні, приходжу на джеми.', ['джаз', 'вініл'], 1),
  u('andriy', 'Андрій', 'polytech', 'КН-22, Політехніка', 'Фронтенд, піца і демо за 5 хвилин.', ['IT', 'хакатони'], 2),
];

export const attendances: Attendance[] = [
  { eventId: 'standup', userId: 'sofia', note: 'Прийду сама, вперше на відкритому мікрофоні — страшно.' },
  { eventId: 'standup', userId: 'ostap', note: 'Можна спитати, де у Львові ще грають живу музику по буднях.' },
  {
    eventId: 'standup',
    userId: 'marta',
    note: 'Збираю матеріал про локальний стендап. Поговоримо?',
    wantsToGoWithYou: { opener: 'Привіт! Бачу, ти теж ідеш сама — зустрінемось біля входу?' },
  },
  { eventId: 'standup', userId: 'danylo', note: 'Йду з другом, але ми відкриті до компанії.' },

  {
    eventId: 'architecture',
    userId: 'olya',
    note: 'Хочу потім пройтися Личаківською і подивитися фасади.',
    wantsToGoWithYou: { opener: 'Привіт! Підемо разом на лекцію? Можу зайняти місця.' },
  },
  { eventId: 'architecture', userId: 'marta', note: 'Запишу пару цитат для статті.' },
  { eventId: 'architecture', userId: 'khrystia' },

  { eventId: 'boardgames', userId: 'khrystia', note: 'Принесу «Каркасон», шукаю ще двох гравців.' },
  { eventId: 'boardgames', userId: 'olya' },
  { eventId: 'boardgames', userId: 'sofia', note: 'Вмію в «Мафію», не вмію в «Кодові імена».' },

  { eventId: 'last-commit', userId: 'andriy', note: 'Покажу пет-проєкт, шукаю, з ким піти на піцу.' },
  { eventId: 'last-commit', userId: 'danylo' },
  { eventId: 'last-commit', userId: 'ostap' },

  {
    eventId: 'jazz',
    userId: 'yulia',
    note: 'Граю на джемі о 22:00, приходь послухати.',
    wantsToGoWithYou: { opener: 'Привіт! Я граю о 22:00 — займу тобі місце біля сцени?' },
  },
  { eventId: 'jazz', userId: 'ostap' },
];

export const getScene = (id: SceneId) => scenes.find((s) => s.id === id)!;
export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getUser = (id: string) => users.find((x) => x.id === id);
export const attendeesOf = (eventId: string) => attendances.filter((a) => a.eventId === eventId);
export const attendanceOf = (eventId: string, userId: string) =>
  attendances.find((a) => a.eventId === eventId && a.userId === userId);
