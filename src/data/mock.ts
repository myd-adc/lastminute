// In-memory demo data in Ukrainian and English. Dates are relative to app start so «Сьогодні · 20:00» stays true.
// Text fields are written as { uk, en } pairs and resolved by `setDataLanguage` (called by the store provider);
// the exported arrays are live bindings, so always read them at use time (not into module-level constants).
import type { Lang } from '@/i18n/core';
import { at } from '@/lib/time';

import type { Attendance, Event, Interest, Message, Photo, Scene, SceneId, User } from './types';

const BASE = Date.now();

type L = { uk: string; en: string };
const l = (uk: string, en: string): L => ({ uk, en });
type Localized<T, K extends keyof T> = Omit<T, K> & { [P in K]: L };

// ── Raw bilingual data ───────────────────────────────────────────────────────

const rawInterests: Localized<Interest, 'label'>[] = [
  { id: 'concerts', label: l('Концерти', 'Concerts'), emoji: '🎸' },
  { id: 'parties', label: l('Вечірки', 'Parties'), emoji: '🎧' },
  { id: 'standup', label: l('Стендап', 'Stand-up'), emoji: '🎤' },
  { id: 'cinema', label: l('Кінопокази', 'Screenings'), emoji: '🎬' },
  { id: 'lectures', label: l('Лекції', 'Talks'), emoji: '🧠' },
  { id: 'boardgames', label: l('Настолки', 'Board games'), emoji: '🎲' },
  { id: 'exhibitions', label: l('Виставки', 'Exhibitions'), emoji: '🎨' },
  { id: 'dance', label: l('Танці', 'Dancing'), emoji: '💃' },
  { id: 'books', label: l('Книжкові клуби', 'Book clubs'), emoji: '📚' },
  { id: 'indie', label: l('Інді', 'Indie'), emoji: '🎸' },
];

const rawVibes = [
  { id: 'chamber', label: l('Камерно', 'Cosy'), emoji: '🕯️' },
  { id: 'party', label: l('Тусово', 'Lively'), emoji: '🔥' },
  { id: 'any', label: l('Як піде', 'Whatever happens'), emoji: '🤷' },
] as const;

const rawGoesWith = [
  { id: 'solo', label: l('Сам(а)', 'Alone'), emoji: '🙋' },
  { id: 'pair', label: l('Удвох', 'As a pair'), emoji: '👯' },
  { id: 'company', label: l('Компанією', 'With friends'), emoji: '🎉' },
] as const;

const rawScenes: Localized<Scene, 'name' | 'description'>[] = [
  {
    id: 'ucu',
    name: l('УКУ', 'UCU'),
    kind: 'campus',
    gradient: 'ocean',
    people: 142,
    description: l('Студентська пошта підтверджена', 'Student email verified'),
    requiresStudentEmail: true,
  },
  {
    id: 'kulbaba',
    name: l('Бар «Кульбаба»', 'Kulbaba bar'),
    kind: 'venue',
    gradient: 'candy',
    people: 38,
    description: l('Майданчик · постійна публіка', 'Venue · regular crowd'),
    requiresStudentEmail: false,
  },
  {
    id: 'guest',
    name: l('Гість Львова', 'Visiting Lviv'),
    kind: 'guest',
    emoji: '🧳',
    gradient: 'lime',
    people: 61,
    description: l(
      'Гостьовий режим · події, відкриті для всіх, хто в місті кілька днів',
      'Guest mode · events open to anyone in town for a few days',
    ),
    requiresStudentEmail: false,
  },
];

type RawEvent = Localized<Omit<Event, 'startsAt' | 'endsAt' | 'walk' | 'priceNote'>, 'title' | 'venue' | 'address' | 'description'> & {
  walk?: L;
  priceNote?: L;
  day: number;
  start: [number, number];
  hours: number;
};

const rawEvents: RawEvent[] = [
  {
    id: 'open-mic',
    sceneId: 'ucu',
    title: l('Open mic: стендап для своїх', 'Open mic: stand-up among friends'),
    poster: { lines: ['OPEN', 'MIC'], emoji: '🎤', gradient: 'sunset' },
    day: 0,
    start: [20, 0],
    hours: 3,
    venue: l('Бар «Кульбаба»', 'Kulbaba bar'),
    address: l('вул. Вигадана, 12', '12 Vyhadana St'),
    walk: l('7 хв пішки від УКУ', '7 min walk from UCU'),
    price: 150,
    priceNote: l('Оплата на вході або на сайті організатора', 'Pay at the door or on the organiser’s site'),
    category: 'standup',
    ageLimit: 18,
    description: l(
      'Шість новачків, по пʼять хвилин. Після — вільний мікрофон для сміливих. Почнемо вчасно, двері о 19:30.',
      'Six newcomers, five minutes each. Then an open mic for the brave. We start on time, doors at 19:30.',
    ),
    partner: true,
    goingCount: 14,
    soloCount: 5,
  },
  {
    id: 'arch-walk',
    sceneId: 'ucu',
    title: l('Як читати архітектуру Львова', 'How to read Lviv’s architecture'),
    poster: { lines: ['АРХІ', 'ТЕКТУРА'], emoji: '🏛️', gradient: 'violet' },
    day: 1,
    start: [18, 30],
    hours: 2,
    venue: l('УКУ, ауд. 302', 'UCU, room 302'),
    address: l('вул. Козельницька, 2а', '2a Kozelnytska St'),
    walk: l('У кампусі', 'On campus'),
    price: null,
    category: 'lectures',
    description: l(
      'Лекція-прогулянка: як за пʼять хвилин відрізнити сецесію від модерну. Після — пройдемося Личаківською.',
      'A walking talk: tell Secession from Modernism in five minutes. Afterwards we stroll down Lychakivska St.',
    ),
    partner: false,
    goingCount: 21,
    soloCount: 7,
  },
  {
    id: 'salsa',
    sceneId: 'ucu',
    title: l('Сальса для новачків', 'Salsa for beginners'),
    poster: { lines: ['SALSA'], emoji: '💃', gradient: 'candy' },
    day: 2,
    start: [19, 0],
    hours: 2,
    venue: l('Студія «Ритм»', 'Rytm studio'),
    address: l('вул. Городоцька, 40', '40 Horodotska St'),
    walk: l('15 хв трамваєм', '15 min by tram'),
    price: 100,
    category: 'dance',
    description: l(
      'Перше заняття для тих, хто ніколи не танцював. Пара не потрібна — міняємося кожні пʼять хвилин.',
      'A first class for people who have never danced. No partner needed — we switch every five minutes.',
    ),
    partner: true,
    goingCount: 12,
    soloCount: 6,
  },
  {
    id: 'jazz',
    sceneId: 'ucu',
    title: l('Jazz jam session', 'Jazz jam session'),
    poster: { lines: ['JAZZ', 'JAM'], emoji: '🎷', gradient: 'ocean' },
    day: 3,
    start: [21, 0],
    hours: 3,
    venue: l('Picasso', 'Picasso'),
    address: l('вул. Зелена, 88', '88 Zelena St'),
    price: 120,
    category: 'concerts',
    description: l(
      'Хаус-бенд грає першу годину, далі — сцена відкрита. Можна просто слухати.',
      'The house band plays the first hour, then the stage is open. You can just listen.',
    ),
    partner: false,
    goingCount: 28,
    soloCount: 5,
  },
  {
    id: 'indie-jam',
    sceneId: 'ucu',
    title: l('Інді-джем у підвалі', 'Basement indie jam'),
    poster: { lines: ['INDIE', 'JAM'], emoji: '🎸', gradient: 'aurora' },
    day: 4,
    start: [21, 0],
    hours: 3,
    venue: l('Підвал «Дзиґа»', 'Dzyga basement'),
    address: l('вул. Вірменська, 35', '35 Virmenska St'),
    price: 80,
    category: 'indie',
    description: l('Три локальні гурти й вільна сцена після опівночі.', 'Three local bands and an open stage after midnight.'),
    partner: true,
    goingCount: 9,
    soloCount: 3,
  },
  {
    id: 'carcassonne',
    sceneId: 'ucu',
    title: l('Настолки: «Каркасон» турнір', 'Board games: Carcassonne tournament'),
    poster: { lines: ['КАРКА', 'СОН'], emoji: '🎲', gradient: 'lime' },
    day: 5,
    start: [18, 0],
    hours: 4,
    venue: l('Антикафе «Кабінет»', 'Kabinet anticafe'),
    address: l('вул. Шептицьких, 24', '24 Sheptytskykh St'),
    price: 60,
    category: 'boardgames',
    description: l(
      'Турнір на вибування, правила пояснюємо на місці. Команди збираємо з тих, хто прийшов сам.',
      'A knockout tournament, rules explained on the spot. Teams are formed from people who came alone.',
    ),
    partner: false,
    goingCount: 6,
    soloCount: 4,
  },
  {
    id: 'rooftop-cinema',
    sceneId: 'ucu',
    title: l('Кіно на даху', 'Rooftop cinema'),
    poster: { lines: ['КІНО', 'НА ДАХУ'], emoji: '🎬', gradient: 'dusk' },
    day: 6,
    start: [19, 30],
    hours: 3,
    venue: l('Дах «Фабрики»', 'Fabryka rooftop'),
    address: l('вул. Промислова, 50', '50 Promyslova St'),
    price: null,
    category: 'cinema',
    description: l(
      'Показ під відкритим небом. Пледи дають на вході, чай — за донат.',
      'An open-air screening. Blankets at the entrance, tea for a donation.',
    ),
    partner: false,
    goingCount: 21,
    soloCount: 8,
  },

  // Other scenes — shown only under «Усе місто».
  {
    id: 'kulbaba-quiz',
    sceneId: 'kulbaba',
    title: l('Квіз про 2000-ні', 'Quiz: the 2000s'),
    poster: { lines: ['QUIZ', '2000'], emoji: '🧠', gradient: 'ember' },
    day: 1,
    start: [20, 0],
    hours: 2,
    venue: l('Бар «Кульбаба»', 'Kulbaba bar'),
    address: l('вул. Вигадана, 12', '12 Vyhadana St'),
    price: 50,
    category: 'parties',
    description: l(
      'Команди до шести людей. Немає команди — збираємо з тих, хто прийшов сам.',
      'Teams of up to six. No team? We put one together from people who came alone.',
    ),
    partner: true,
    goingCount: 24,
    soloCount: 9,
  },
  {
    id: 'guest-roofs',
    sceneId: 'guest',
    title: l('Львів дахами: вечірня прогулянка', 'Lviv rooftops: an evening walk'),
    poster: { lines: ['ДАХИ', 'ЛЬВОВА'], emoji: '🌇', gradient: 'sunset' },
    day: 2,
    start: [18, 0],
    hours: 2,
    venue: l('Площа Ринок', 'Market Square'),
    address: l('біля фонтану «Нептун»', 'by the Neptune fountain'),
    price: 200,
    category: 'exhibitions',
    description: l(
      'Пройдемо трьома дахами центру. Для тих, хто в місті кілька днів.',
      'We’ll cross three rooftops in the centre. For people in town for a few days.',
    ),
    partner: false,
    goingCount: 17,
    soloCount: 10,
  },

  // Past events the demo user already attended (seeded into their history on onboarding).
  {
    id: 'past-indie',
    sceneId: 'ucu',
    title: l('Інді-джем', 'Indie jam'),
    poster: { lines: ['INDIE'], emoji: '🎸', gradient: 'aurora' },
    day: -1,
    start: [21, 0],
    hours: 3,
    venue: l('Підвал «Дзиґа»', 'Dzyga basement'),
    address: l('вул. Вірменська, 35', '35 Virmenska St'),
    price: 80,
    category: 'indie',
    description: l('Три локальні гурти.', 'Three local bands.'),
    partner: true,
    goingCount: 11,
    soloCount: 4,
  },
  {
    id: 'past-film',
    sceneId: 'ucu',
    title: l('Кіноклуб: «Тіні забутих предків»', 'Film club: Shadows of Forgotten Ancestors'),
    poster: { lines: ['КІНО', 'КЛУБ'], emoji: '🎞️', gradient: 'dusk' },
    day: -3,
    start: [18, 30],
    hours: 2,
    venue: l('УКУ, ауд. 101', 'UCU, room 101'),
    address: l('вул. Козельницька, 2а', '2a Kozelnytska St'),
    price: null,
    category: 'cinema',
    description: l('Перегляд і обговорення.', 'Screening and discussion.'),
    partner: false,
    goingCount: 16,
    soloCount: 5,
  },
];

export const PAST_EVENT_IDS = ['past-indie', 'past-film'];

const rawUsers: Localized<User, 'name' | 'affiliation' | 'talkAbout'>[] = [
  { id: 'darynka', name: l('Даринка', 'Darynka'), age: 20, gender: 'f', sceneId: 'ucu', affiliation: l('Соціологія, 3 курс', 'Sociology, 3rd year'), talkAbout: l('чому всі фільми A24 однакові, але я все одно дивлюсь кожен', 'why all A24 films are the same and I still watch every one'), tags: ['indie', 'standup', 'boardgames'], gradient: 'aurora', sharedEvents: 2 },
  { id: 'ostap', name: l('Остап', 'Ostap'), age: 21, gender: 'm', sceneId: 'ucu', affiliation: l('Історія, 4 курс', 'History, 4th year'), talkAbout: l('де у Львові ще грають живу музику по буднях', 'where else in Lviv there’s live music on weekdays'), tags: ['concerts', 'standup'], gradient: 'candy', sharedEvents: 0 },
  { id: 'yulia', name: l('Юля', 'Yulia'), age: 19, gender: 'f', sceneId: 'ucu', affiliation: l('Журналістика, 2 курс', 'Journalism, 2nd year'), talkAbout: l('подкасти, які ніхто не слухає, крім мене', 'podcasts nobody listens to except me'), tags: ['books', 'cinema', 'indie'], gradient: 'lime', sharedEvents: 1 },
  { id: 'marko', name: l('Марко', 'Marko'), age: 22, gender: 'm', sceneId: 'ucu', affiliation: l('Компʼютерні науки, 4 курс', 'Computer science, 4th year'), talkAbout: l('чому настолки кращі за відеоігри', 'why board games beat video games'), tags: ['boardgames', 'indie'], gradient: 'violet', sharedEvents: 1 },
  { id: 'katya', name: l('Катя', 'Katya'), age: 20, gender: 'f', sceneId: 'ucu', affiliation: l('Психологія, 3 курс', 'Psychology, 3rd year'), talkAbout: l('сни, які я записую вже три роки', 'the dreams I’ve been writing down for three years'), tags: ['lectures', 'books'], gradient: 'ember', sharedEvents: 0 },
  { id: 'andriy', name: l('Андрій', 'Andriy'), age: 23, gender: 'm', sceneId: 'ucu', affiliation: l('Магістратура, право', 'Master’s, law'), talkAbout: l('стендап-комікі, яких ти ще не знаєш', 'stand-up comedians you don’t know yet'), tags: ['standup', 'parties'], gradient: 'ocean', sharedEvents: 0 },
  { id: 'sofia', name: l('Софія', 'Sofia'), age: 19, gender: 'f', sceneId: 'ucu', affiliation: l('Філологія, 1 курс', 'Philology, 1st year'), talkAbout: l('вірші, які соромно читати вголос', 'poems too embarrassing to read out loud'), tags: ['books', 'standup'], gradient: 'sunset', sharedEvents: 0 },
  { id: 'nazar', name: l('Назар', 'Nazar'), age: 21, gender: 'm', sceneId: 'ucu', affiliation: l('Архітектура, 3 курс', 'Architecture, 3rd year'), talkAbout: l('найгірші будівлі Львова (у мене є список)', 'the ugliest buildings in Lviv (I have a list)'), tags: ['exhibitions', 'lectures'], gradient: 'dusk', sharedEvents: 0 },
  { id: 'iryna', name: l('Ірина', 'Iryna'), age: 20, gender: 'f', sceneId: 'ucu', affiliation: l('Економіка, 2 курс', 'Economics, 2nd year'), talkAbout: l('як я вчу італійську через опери', 'how I learn Italian through opera'), tags: ['concerts', 'dance'], gradient: 'candy', sharedEvents: 0 },
];

type RawAttendance = Omit<Attendance, 'replies'> & { replies?: L[] };

const rawAttendances: RawAttendance[] = [
  {
    eventId: 'open-mic',
    userId: 'darynka',
    solo: true,
    likesYou: true,
    replies: [
      l('Давай! Я буду в жовтій куртці 🟡', 'Sure! I’ll be in a yellow jacket 🟡'),
      l('Ахах, домовились 🙌', 'Haha, deal 🙌'),
      l('До зустрічі!', 'See you there!'),
    ],
    leavesContact: '@darynka.k',
  },
  { eventId: 'open-mic', userId: 'ostap', solo: true, inSoloGroup: true },
  { eventId: 'open-mic', userId: 'yulia', solo: true, inSoloGroup: true, likesYou: true, replies: [l('О, привіт ще раз! 😄', 'Oh, hi again! 😄')] },
  { eventId: 'open-mic', userId: 'marko', solo: true, inSoloGroup: true },
  { eventId: 'open-mic', userId: 'katya', solo: true, inSoloGroup: true },
  { eventId: 'open-mic', userId: 'andriy', solo: false },
  { eventId: 'open-mic', userId: 'sofia', solo: false, likesYou: true, replies: [l('Привіт! Я з подругою, але приєднуйся 🙂', 'Hi! I’m with a friend, but join us 🙂')] },
  { eventId: 'open-mic', userId: 'nazar', solo: false },
  { eventId: 'open-mic', userId: 'iryna', solo: false },

  { eventId: 'arch-walk', userId: 'nazar', solo: true, likesYou: true, replies: [l('Привіт! Покажу тобі свій список 😅', 'Hi! I’ll show you my list 😅')] },
  { eventId: 'arch-walk', userId: 'katya', solo: true },
  { eventId: 'arch-walk', userId: 'sofia', solo: false },
  { eventId: 'salsa', userId: 'iryna', solo: true, likesYou: true, replies: [l('Ура, буде з ким стати в пару!', 'Yay, I’ll have someone to pair up with!')] },
  { eventId: 'salsa', userId: 'andriy', solo: true },
  { eventId: 'jazz', userId: 'ostap', solo: true },
  { eventId: 'jazz', userId: 'yulia', solo: false },
  { eventId: 'indie-jam', userId: 'darynka', solo: true },
  { eventId: 'indie-jam', userId: 'marko', solo: true },
  { eventId: 'carcassonne', userId: 'marko', solo: true, likesYou: true, replies: [l('Візьму свою колоду 😎', 'I’ll bring my own deck 😎')] },
  { eventId: 'rooftop-cinema', userId: 'yulia', solo: true },
  { eventId: 'rooftop-cinema', userId: 'darynka', solo: false },

  { eventId: 'past-indie', userId: 'yulia', solo: true, likesYou: true, leavesContact: '@yulia_l' },
  { eventId: 'past-film', userId: 'marko', solo: true, likesYou: true },
];

type RawMessage = Omit<Message, 'text'> & { text: L };
const msg = (id: string, from: string, text: L, atIso: string): RawMessage => ({ id, from, text, at: atIso });

type RawGroup = { meetPlace: L; meetTime: string; confirmed: string[]; opensAt: string; messages: RawMessage[] };

const rawSoloGroups: Record<string, RawGroup> = {
  'open-mic': {
    meetPlace: l('Біля бару', 'By the bar'),
    meetTime: '19:45',
    confirmed: ['ostap', 'yulia', 'marko', 'katya'],
    opensAt: '17:00',
    messages: [
      msg('g1', 'ostap', l('Хто вже був у «Кульбабі»? Там є де сісти?', 'Has anyone been to Kulbaba? Are there seats?'), at(BASE, 0, 18, 20)),
      msg('g2', 'yulia', l('Була. Займайте диван біля сцени 🛋️', 'I have. Grab the sofa by the stage 🛋️'), at(BASE, 0, 18, 22)),
      msg('g3', 'me', l('Тоді біля бару о 19:45 і заходимо разом?', 'So, by the bar at 19:45 and we go in together?'), at(BASE, 0, 18, 23)),
      msg('g4', 'marko', l('Я +, буду в чорній кепці 🧢', 'I’m in, I’ll be in a black cap 🧢'), at(BASE, 0, 18, 25)),
    ],
  },
};

type RawPastChat = { eventId: string; userId: string; messages: RawMessage[]; myContact?: string };

const rawPastChats: RawPastChat[] = [
  {
    eventId: 'past-indie',
    userId: 'yulia',
    myContact: '@me',
    messages: [
      msg('h1', 'yulia', l('Дякую за компанію! Кінопоказ у четвер — йдеш?', 'Thanks for the company! Screening on Thursday — coming?'), at(BASE, -1, 23, 40)),
      msg('h2', 'me', l('Йду! Залишаю контакт 🙂', 'Yes! Leaving my contact 🙂'), at(BASE, -1, 23, 42)),
    ],
  },
  {
    eventId: 'past-film',
    userId: 'marko',
    messages: [
      msg('h3', 'marko', l('Наступного разу візьмемо попкорн', 'Next time we bring popcorn'), at(BASE, -3, 21, 0)),
      msg('h4', 'me', l('Домовились 🍿', 'Deal 🍿'), at(BASE, -3, 21, 5)),
    ],
  },
];

// Album photos other attendees already posted (no text, so not localized).
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

// ── Localized views (live bindings) ──────────────────────────────────────────

const pickL = (v: L, lang: Lang) => v[lang];
const msgIn = (m: RawMessage, lang: Lang): Message => ({ ...m, text: pickL(m.text, lang) });

function build(lang: Lang) {
  return {
    interests: rawInterests.map((i) => ({ ...i, label: pickL(i.label, lang) })) as Interest[],
    vibes: rawVibes.map((v) => ({ ...v, label: pickL(v.label, lang) })),
    goesWithOptions: rawGoesWith.map((g) => ({ ...g, label: pickL(g.label, lang) })),
    scenes: rawScenes.map((s) => ({ ...s, name: pickL(s.name, lang), description: pickL(s.description, lang) })) as Scene[],
    events: rawEvents.map(({ day, start, hours, ...e }) => {
      const startsAt = at(BASE, day, start[0], start[1]);
      return {
        ...e,
        title: pickL(e.title, lang),
        venue: pickL(e.venue, lang),
        address: pickL(e.address, lang),
        description: pickL(e.description, lang),
        walk: e.walk && pickL(e.walk, lang),
        priceNote: e.priceNote && pickL(e.priceNote, lang),
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + hours * 3600000).toISOString(),
      };
    }) as Event[],
    users: rawUsers.map((u) => ({ ...u, name: pickL(u.name, lang), affiliation: pickL(u.affiliation, lang), talkAbout: pickL(u.talkAbout, lang) })) as User[],
    attendances: rawAttendances.map((a) => ({ ...a, replies: a.replies?.map((r) => pickL(r, lang)) })) as Attendance[],
    soloGroups: Object.fromEntries(
      Object.entries(rawSoloGroups).map(([id, g]) => [
        id,
        { ...g, meetPlace: pickL(g.meetPlace, lang), messages: g.messages.map((m) => msgIn(m, lang)) },
      ]),
    ) as Record<string, { meetPlace: string; meetTime: string; confirmed: string[]; opensAt: string; messages: Message[] }>,
    pastChats: rawPastChats.map((c) => ({ ...c, messages: c.messages.map((m) => msgIn(m, lang)) })),
  };
}

const cache: Partial<Record<Lang, ReturnType<typeof build>>> = {};
let dataLang: Lang | null = null;

export let interests: Interest[] = [];
export let vibes: ReturnType<typeof build>['vibes'] = [];
export let goesWithOptions: ReturnType<typeof build>['goesWithOptions'] = [];
export let scenes: Scene[] = [];
export let events: Event[] = [];
export let users: User[] = [];
export let attendances: Attendance[] = [];
export let soloGroups: ReturnType<typeof build>['soloGroups'] = {};
export let pastChats: ReturnType<typeof build>['pastChats'] = [];

export function setDataLanguage(lang: Lang) {
  if (dataLang === lang) return;
  dataLang = lang;
  const d = (cache[lang] ??= build(lang));
  ({ interests, vibes, goesWithOptions, scenes, events, users, attendances, soloGroups, pastChats } = d);
}
setDataLanguage('uk');

export const getScene = (id: SceneId) => scenes.find((s) => s.id === id)!;
export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getUser = (id: string) => users.find((u) => u.id === id);
export const getInterest = (id: string) => interests.find((i) => i.id === id);
export const attendeesOf = (eventId: string) => attendances.filter((a) => a.eventId === eventId);
export const attendanceOf = (eventId: string, userId: string) =>
  attendances.find((a) => a.eventId === eventId && a.userId === userId);
