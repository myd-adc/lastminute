// In-memory demo data. Dates are generated relative to app start so «Сьогодні · 20:00» stays true.
import { at } from '@/lib/time';

import type { Attendance, Event, Interest, Message, Photo, Scene, SceneId, User } from './types';

const BASE = Date.now();

export const interests: Interest[] = [
  { id: 'concerts', label: 'Концерти', emoji: '🎸' },
  { id: 'parties', label: 'Вечірки', emoji: '🎧' },
  { id: 'standup', label: 'Стендап', emoji: '🎤' },
  { id: 'cinema', label: 'Кінопокази', emoji: '🎬' },
  { id: 'lectures', label: 'Лекції', emoji: '🧠' },
  { id: 'boardgames', label: 'Настолки', emoji: '🎲' },
  { id: 'exhibitions', label: 'Виставки', emoji: '🎨' },
  { id: 'dance', label: 'Танці', emoji: '💃' },
  { id: 'books', label: 'Книжкові клуби', emoji: '📚' },
  { id: 'indie', label: 'Інді', emoji: '🎸' },
];

export const vibes = [
  { id: 'chamber', label: 'Камерно', emoji: '🕯️' },
  { id: 'party', label: 'Тусово', emoji: '🔥' },
  { id: 'any', label: 'Як піде', emoji: '🤷' },
] as const;

export const goesWithOptions = [
  { id: 'solo', label: 'Сам(а)', emoji: '🙋' },
  { id: 'pair', label: 'Удвох', emoji: '👯' },
  { id: 'company', label: 'Компанією', emoji: '🎉' },
] as const;

export const scenes: Scene[] = [
  {
    id: 'ucu',
    name: 'УКУ',
    kind: 'campus',
    gradient: 'ocean',
    people: 142,
    description: 'Студентська пошта підтверджена',
    requiresStudentEmail: true,
  },
  {
    id: 'kulbaba',
    name: 'Бар «Кульбаба»',
    kind: 'venue',
    gradient: 'candy',
    people: 38,
    description: 'Майданчик · постійна публіка',
    requiresStudentEmail: false,
  },
  {
    id: 'guest',
    name: 'Гість Львова',
    kind: 'guest',
    emoji: '🧳',
    gradient: 'lime',
    people: 61,
    description: 'Гостьовий режим · події, відкриті для всіх, хто в місті кілька днів',
    requiresStudentEmail: false,
  },
];

const ev = (e: Omit<Event, 'startsAt' | 'endsAt'> & { day: number; start: [number, number]; hours: number }): Event => {
  const { day, start, hours, ...rest } = e;
  const startsAt = at(BASE, day, start[0], start[1]);
  return { ...rest, startsAt, endsAt: new Date(Date.parse(startsAt) + hours * 3600000).toISOString() };
};

export const events: Event[] = [
  ev({
    id: 'open-mic',
    sceneId: 'ucu',
    title: 'Open mic: стендап для своїх',
    poster: { lines: ['OPEN', 'MIC'], emoji: '🎤', gradient: 'sunset' },
    day: 0,
    start: [20, 0],
    hours: 3,
    venue: 'Бар «Кульбаба»',
    address: 'вул. Вигадана, 12',
    walk: '7 хв пішки від УКУ',
    price: 150,
    priceNote: 'Оплата на вході або на сайті організатора',
    category: 'standup',
    ageLimit: 18,
    description:
      'Шість новачків, по пʼять хвилин. Після — вільний мікрофон для сміливих. Почнемо вчасно, двері о 19:30.',
    partner: true,
    goingCount: 14,
    soloCount: 5,
  }),
  ev({
    id: 'arch-walk',
    sceneId: 'ucu',
    title: 'Як читати архітектуру Львова',
    poster: { lines: ['АРХІ', 'ТЕКТУРА'], emoji: '🏛️', gradient: 'violet' },
    day: 1,
    start: [18, 30],
    hours: 2,
    venue: 'УКУ, ауд. 302',
    address: 'вул. Козельницька, 2а',
    walk: 'У кампусі',
    price: null,
    category: 'lectures',
    description: 'Лекція-прогулянка: як за пʼять хвилин відрізнити сецесію від модерну. Після — пройдемося Личаківською.',
    partner: false,
    goingCount: 21,
    soloCount: 7,
  }),
  ev({
    id: 'salsa',
    sceneId: 'ucu',
    title: 'Сальса для новачків',
    poster: { lines: ['SALSA'], emoji: '💃', gradient: 'candy' },
    day: 2,
    start: [19, 0],
    hours: 2,
    venue: 'Студія «Ритм»',
    address: 'вул. Городоцька, 40',
    walk: '15 хв трамваєм',
    price: 100,
    category: 'dance',
    description: 'Перше заняття для тих, хто ніколи не танцював. Пара не потрібна — міняємося кожні пʼять хвилин.',
    partner: true,
    goingCount: 12,
    soloCount: 6,
  }),
  ev({
    id: 'jazz',
    sceneId: 'ucu',
    title: 'Jazz jam session',
    poster: { lines: ['JAZZ', 'JAM'], emoji: '🎷', gradient: 'ocean' },
    day: 3,
    start: [21, 0],
    hours: 3,
    venue: 'Picasso',
    address: 'вул. Зелена, 88',
    price: 120,
    category: 'concerts',
    description: 'Хаус-бенд грає першу годину, далі — сцена відкрита. Можна просто слухати.',
    partner: false,
    goingCount: 28,
    soloCount: 5,
  }),
  ev({
    id: 'indie-jam',
    sceneId: 'ucu',
    title: 'Інді-джем у підвалі',
    poster: { lines: ['INDIE', 'JAM'], emoji: '🎸', gradient: 'aurora' },
    day: 4,
    start: [21, 0],
    hours: 3,
    venue: 'Підвал «Дзиґа»',
    address: 'вул. Вірменська, 35',
    price: 80,
    category: 'indie',
    description: 'Три локальні гурти й вільна сцена після опівночі.',
    partner: true,
    goingCount: 9,
    soloCount: 3,
  }),
  ev({
    id: 'carcassonne',
    sceneId: 'ucu',
    title: 'Настолки: «Каркасон» турнір',
    poster: { lines: ['КАРКА', 'СОН'], emoji: '🎲', gradient: 'lime' },
    day: 5,
    start: [18, 0],
    hours: 4,
    venue: 'Антикафе «Кабінет»',
    address: 'вул. Шептицьких, 24',
    price: 60,
    category: 'boardgames',
    description: 'Турнір на вибування, правила пояснюємо на місці. Команди збираємо з тих, хто прийшов сам.',
    partner: false,
    goingCount: 6,
    soloCount: 4,
  }),
  ev({
    id: 'rooftop-cinema',
    sceneId: 'ucu',
    title: 'Кіно на даху',
    poster: { lines: ['КІНО', 'НА ДАХУ'], emoji: '🎬', gradient: 'dusk' },
    day: 6,
    start: [19, 30],
    hours: 3,
    venue: 'Дах «Фабрики»',
    address: 'вул. Промислова, 50',
    price: null,
    category: 'cinema',
    description: 'Показ під відкритим небом. Пледи дають на вході, чай — за донат.',
    partner: false,
    goingCount: 21,
    soloCount: 8,
  }),

  // Other scenes — shown only under «Усе місто».
  ev({
    id: 'kulbaba-quiz',
    sceneId: 'kulbaba',
    title: 'Квіз про 2000-ні',
    poster: { lines: ['QUIZ', '2000'], emoji: '🧠', gradient: 'ember' },
    day: 1,
    start: [20, 0],
    hours: 2,
    venue: 'Бар «Кульбаба»',
    address: 'вул. Вигадана, 12',
    price: 50,
    category: 'parties',
    description: 'Команди до шести людей. Немає команди — збираємо з тих, хто прийшов сам.',
    partner: true,
    goingCount: 24,
    soloCount: 9,
  }),
  ev({
    id: 'guest-roofs',
    sceneId: 'guest',
    title: 'Львів дахами: вечірня прогулянка',
    poster: { lines: ['ДАХИ', 'ЛЬВОВА'], emoji: '🌇', gradient: 'sunset' },
    day: 2,
    start: [18, 0],
    hours: 2,
    venue: 'Площа Ринок',
    address: 'біля фонтану «Нептун»',
    price: 200,
    category: 'exhibitions',
    description: 'Пройдемо трьома дахами центру. Для тих, хто в місті кілька днів.',
    partner: false,
    goingCount: 17,
    soloCount: 10,
  }),

  // Past events the demo user already attended (seeded into their history on onboarding).
  ev({
    id: 'past-indie',
    sceneId: 'ucu',
    title: 'Інді-джем',
    poster: { lines: ['INDIE'], emoji: '🎸', gradient: 'aurora' },
    day: -1,
    start: [21, 0],
    hours: 3,
    venue: 'Підвал «Дзиґа»',
    address: 'вул. Вірменська, 35',
    price: 80,
    category: 'indie',
    description: 'Три локальні гурти.',
    partner: true,
    goingCount: 11,
    soloCount: 4,
  }),
  ev({
    id: 'past-film',
    sceneId: 'ucu',
    title: 'Кіноклуб: «Тіні забутих предків»',
    poster: { lines: ['КІНО', 'КЛУБ'], emoji: '🎞️', gradient: 'dusk' },
    day: -3,
    start: [18, 30],
    hours: 2,
    venue: 'УКУ, ауд. 101',
    address: 'вул. Козельницька, 2а',
    price: null,
    category: 'cinema',
    description: 'Перегляд і обговорення.',
    partner: false,
    goingCount: 16,
    soloCount: 5,
  }),
];

export const PAST_EVENT_IDS = ['past-indie', 'past-film'];

export const users: User[] = [
  { id: 'darynka', name: 'Даринка', age: 20, gender: 'f', sceneId: 'ucu', affiliation: 'Соціологія, 3 курс', talkAbout: 'чому всі фільми A24 однакові, але я все одно дивлюсь кожен', tags: ['indie', 'standup', 'boardgames'], gradient: 'aurora', sharedEvents: 2 },
  { id: 'ostap', name: 'Остап', age: 21, gender: 'm', sceneId: 'ucu', affiliation: 'Історія, 4 курс', talkAbout: 'де у Львові ще грають живу музику по буднях', tags: ['concerts', 'standup'], gradient: 'candy', sharedEvents: 0 },
  { id: 'yulia', name: 'Юля', age: 19, gender: 'f', sceneId: 'ucu', affiliation: 'Журналістика, 2 курс', talkAbout: 'подкасти, які ніхто не слухає, крім мене', tags: ['books', 'cinema', 'indie'], gradient: 'lime', sharedEvents: 1 },
  { id: 'marko', name: 'Марко', age: 22, gender: 'm', sceneId: 'ucu', affiliation: 'Компʼютерні науки, 4 курс', talkAbout: 'чому настолки кращі за відеоігри', tags: ['boardgames', 'indie'], gradient: 'violet', sharedEvents: 1 },
  { id: 'katya', name: 'Катя', age: 20, gender: 'f', sceneId: 'ucu', affiliation: 'Психологія, 3 курс', talkAbout: 'сни, які я записую вже три роки', tags: ['lectures', 'books'], gradient: 'ember', sharedEvents: 0 },
  { id: 'andriy', name: 'Андрій', age: 23, gender: 'm', sceneId: 'ucu', affiliation: 'Магістратура, право', talkAbout: 'стендап-комікі, яких ти ще не знаєш', tags: ['standup', 'parties'], gradient: 'ocean', sharedEvents: 0 },
  { id: 'sofia', name: 'Софія', age: 19, gender: 'f', sceneId: 'ucu', affiliation: 'Філологія, 1 курс', talkAbout: 'вірші, які соромно читати вголос', tags: ['books', 'standup'], gradient: 'sunset', sharedEvents: 0 },
  { id: 'nazar', name: 'Назар', age: 21, gender: 'm', sceneId: 'ucu', affiliation: 'Архітектура, 3 курс', talkAbout: 'найгірші будівлі Львова (у мене є список)', tags: ['exhibitions', 'lectures'], gradient: 'dusk', sharedEvents: 0 },
  { id: 'iryna', name: 'Ірина', age: 20, gender: 'f', sceneId: 'ucu', affiliation: 'Економіка, 2 курс', talkAbout: 'як я вчу італійську через опери', tags: ['concerts', 'dance'], gradient: 'candy', sharedEvents: 0 },
];

export const attendances: Attendance[] = [
  {
    eventId: 'open-mic',
    userId: 'darynka',
    solo: true,
    likesYou: true,
    replies: ['Давай! Я буду в жовтій куртці 🟡', 'Ахах, домовились 🙌', 'До зустрічі!'],
    leavesContact: '@darynka.k',
  },
  { eventId: 'open-mic', userId: 'ostap', solo: true, inSoloGroup: true },
  { eventId: 'open-mic', userId: 'yulia', solo: true, inSoloGroup: true, likesYou: true, replies: ['О, привіт ще раз! 😄'] },
  { eventId: 'open-mic', userId: 'marko', solo: true, inSoloGroup: true },
  { eventId: 'open-mic', userId: 'katya', solo: true, inSoloGroup: true },
  { eventId: 'open-mic', userId: 'andriy', solo: false },
  { eventId: 'open-mic', userId: 'sofia', solo: false, likesYou: true, replies: ['Привіт! Я з подругою, але приєднуйся 🙂'] },
  { eventId: 'open-mic', userId: 'nazar', solo: false },
  { eventId: 'open-mic', userId: 'iryna', solo: false },

  { eventId: 'arch-walk', userId: 'nazar', solo: true, likesYou: true, replies: ['Привіт! Покажу тобі свій список 😅'] },
  { eventId: 'arch-walk', userId: 'katya', solo: true },
  { eventId: 'arch-walk', userId: 'sofia', solo: false },
  { eventId: 'salsa', userId: 'iryna', solo: true, likesYou: true, replies: ['Ура, буде з ким стати в пару!'] },
  { eventId: 'salsa', userId: 'andriy', solo: true },
  { eventId: 'jazz', userId: 'ostap', solo: true },
  { eventId: 'jazz', userId: 'yulia', solo: false },
  { eventId: 'indie-jam', userId: 'darynka', solo: true },
  { eventId: 'indie-jam', userId: 'marko', solo: true },
  { eventId: 'carcassonne', userId: 'marko', solo: true, likesYou: true, replies: ['Візьму свою колоду 😎'] },
  { eventId: 'rooftop-cinema', userId: 'yulia', solo: true },
  { eventId: 'rooftop-cinema', userId: 'darynka', solo: false },

  { eventId: 'past-indie', userId: 'yulia', solo: true, likesYou: true, leavesContact: '@yulia_l' },
  { eventId: 'past-film', userId: 'marko', solo: true, likesYou: true },
];

// Group chat «Самі на …» for solo-goers, keyed by event id.
export const soloGroups: Record<string, { meetPlace: string; meetTime: string; confirmed: string[]; opensAt: string; messages: Message[] }> = {
  'open-mic': {
    meetPlace: 'Біля бару',
    meetTime: '19:45',
    confirmed: ['ostap', 'yulia', 'marko', 'katya'],
    opensAt: '17:00',
    messages: [
      { id: 'g1', from: 'ostap', text: 'Хто вже був у «Кульбабі»? Там є де сісти?', at: at(BASE, 0, 18, 20) },
      { id: 'g2', from: 'yulia', text: 'Була. Займайте диван біля сцени 🛋️', at: at(BASE, 0, 18, 22) },
      { id: 'g3', from: 'me', text: 'Тоді біля бару о 19:45 і заходимо разом?', at: at(BASE, 0, 18, 23) },
      { id: 'g4', from: 'marko', text: 'Я +, буду в чорній кепці 🧢', at: at(BASE, 0, 18, 25) },
    ],
  },
};

// Album photos other attendees already posted, keyed by event id.
const tile = (eventId: string, i: number, authorId: string, emoji: string, gradient: Photo['gradient']): Photo => ({
  id: `${eventId}-p${i}`,
  eventId,
  authorId,
  emoji,
  gradient,
  at: at(BASE, 0, 20, 5 + i * 4),
});

export const albumPhotos: Photo[] = [
  tile('open-mic', 1, 'darynka', '🎤', 'sunset'),
  tile('open-mic', 2, 'ostap', '😂', 'violet'),
  tile('open-mic', 3, 'yulia', '🍻', 'lime'),
  tile('open-mic', 4, 'marko', '🎤', 'candy'),
  tile('open-mic', 5, 'andriy', '📸', 'ocean'),
  tile('open-mic', 6, 'katya', '🙌', 'ember'),
  tile('open-mic', 7, 'sofia', '😂', 'aurora'),
  tile('open-mic', 8, 'nazar', '🎤', 'candy'),
  tile('open-mic', 9, 'darynka', '✨', 'ocean'),
  tile('open-mic', 10, 'iryna', '👏', 'sunset'),
  tile('open-mic', 11, 'ostap', '🎉', 'violet'),
];

// Seeded DM history for the demo user's past events (added on onboarding completion).
export const pastChats: { eventId: string; userId: string; messages: Message[]; myContact?: string }[] = [
  {
    eventId: 'past-indie',
    userId: 'yulia',
    myContact: '@me',
    messages: [
      { id: 'h1', from: 'yulia', text: 'Дякую за компанію! Кінопоказ у четвер — йдеш?', at: at(BASE, -1, 23, 40) },
      { id: 'h2', from: 'me', text: 'Йду! Залишаю контакт 🙂', at: at(BASE, -1, 23, 42) },
    ],
  },
  {
    eventId: 'past-film',
    userId: 'marko',
    messages: [
      { id: 'h3', from: 'marko', text: 'Наступного разу візьмемо попкорн', at: at(BASE, -3, 21, 0) },
      { id: 'h4', from: 'me', text: 'Домовились 🍿', at: at(BASE, -3, 21, 5) },
    ],
  },
];

export const getScene = (id: SceneId) => scenes.find((s) => s.id === id)!;
export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getUser = (id: string) => users.find((u) => u.id === id);
export const getInterest = (id: string) => interests.find((i) => i.id === id);
export const attendeesOf = (eventId: string) => attendances.filter((a) => a.eventId === eventId);
export const attendanceOf = (eventId: string, userId: string) =>
  attendances.find((a) => a.eventId === eventId && a.userId === userId);
