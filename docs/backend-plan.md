# LastMinute — бекенд на Supabase (етап 1)

Мета етапу: справжні люди на одній сцені проходять ядро продукту — вхід, профіль, подія, «Я йду», кімната, метч, чат. Альбом, група «Самі», «Як пройшло?» і контакти — етап 2.

## Рішення

- **Supabase**: Postgres + Auth + Realtime + Storage + Edge Functions + pg_cron.
- **Правила продукту живуть у базі** (RLS-політики і security-definer функції), а не в UI. Клієнт ніколи не отримує дані, яких не має бачити.
- **Вхід**: телефон + SMS-код через Supabase Phone Auth. Студентські сцени додатково вимагають пошту закладу (код на пошту).
- **Події** вносимо самі: таблиця `events` у Supabase Studio або проста адмінка пізніше.
- **Демо-режим лишається**: веб-демо за QR працює на моках без входу, реальна апка — на Supabase. Перемикається змінною середовища.

## Схема

| Таблиця | Що зберігає | Ключові поля |
|---|---|---|
| `scenes` | сцени | `id`, `name_uk`, `name_en`, `kind`, `email_domain` (напр. `ucu.edu.ua`) |
| `profiles` | профіль = `auth.users.id` | `name`, `affiliation`, `talk_about`, `photo_path`, `gradient`, `interests[]`, `vibe`, `goes_with`, `scene_id`, `show_solo`, `show_shared`, `language` |
| `scene_members` | хто на якій сцені | `user_id`, `scene_id`, `verified_email`, `verified_at` |
| `events` | події | `scene_id`, `title_uk/en`, `description_uk/en`, `starts_at`, `ends_at`, `venue`, `address`, `price`, `category`, `age_limit`, `poster` (jsonb), `partner` |
| `attendances` | «Я йду» | PK `(event_id, user_id)`, `with` (`solo`/`friends`), `join_solo_group` |
| `decisions` | свайп у кімнаті | PK `(event_id, from_user, to_user)`, `choice` (`go`/`skip`) |
| `matches` | взаємне «Піти разом» | `event_id`, `user_a < user_b`, `created_at`; створюється тригером |
| `messages` | повідомлення в метчі | `match_id`, `sender_id`, `text`, `created_at` |
| `blocks` | блокування | PK `(blocker, blocked)` |
| `reports` | скарги | `reporter`, `reported`, `event_id`, `reason`, `note` |

## Як сервер забезпечує правила

- **Симетрія.** Профілі й рядки `attendances` інших людей видно лише тому, хто сам має `attendance` на цю подію. До «Я йду» клієнт отримує тільки лічильники з функції `event_stats(event_id)` (скільки йде, скільки без компанії), без імен.
- **Згода.** `decisions` кожен бачить лише свої вихідні. Хто натиснув «Піти разом» на тебе, не видно, доки не буде взаємності. Тригер на `decisions` створює `matches`, коли обидва `go`.
- **Чат.** Писати в `messages` можна лише учаснику метчу, якщо немає блоку і `now() < events.ends_at + 24h`. Realtime-підписка на `messages` за `match_id`.
- **24 години.** Щогодинна задача `pg_cron` видаляє повідомлення метчів, у яких подія закінчилась понад 24 год тому.
- **Блок.** Будь-який блок в обидва боки ховає людину з кімнати, профілів і чатів (умова в усіх політиках).
- **Сцена.** Події видно всім залогіненим (вкладка «Усе місто»), але кімнату події студентської сцени — лише підтвердженим членам цієї сцени.

## Клієнт

- `@supabase/supabase-js` + `@tanstack/react-query` для кешу й оновлень. Сесія в `expo-secure-store` (на вебі — localStorage).
- Шар `src/api/` з функціями (`getFeed`, `markGoing`, `getRoomQueue`, `decide`, `sendMessage`…), які повертають ті самі типи, що зараз `src/data/types.ts`. Екрани переходять з `useStore()`/моків на хуки поверх `src/api`, верстка не змінюється.
- Локальний стор лишається для UI-налаштувань (тема, мова) і демо-режиму.

## Порядок робіт

1. Проєкт Supabase (хмарний) + локальна база в Docker для розробки, міграції в `supabase/migrations/`.
2. Схема, RLS, тригер метчів, `event_stats`, pg_cron. Тести політик (SQL), що чужий клієнт не бачить зайвого.
3. Auth: телефон + SMS-провайдер (Twilio або TurboSMS через Send SMS Hook), код на студентську пошту (Edge Function + Resend).
4. Клієнтський шар `src/api` + react-query, перемикач демо/реальний режим.
5. Переведення екранів: онбординг → стрічка → подія/«Я йду» → кімната/метч → чати.
6. Сид-дані для пілотної сцени, тест на двох реальних телефонах, деплой (EAS build для iOS/Android, веб на Pages).

## Що потрібно від тебе

- Акаунт Supabase і проєкт (регіон Frankfurt `eu-central-1` — найближчий): URL проєкту і anon key; service-role key — тільки в локальний `.env`, не в репо.
- Запустити Docker Desktop (для локальної бази).
- Пізніше: SMS-провайдер (акаунт Twilio або TurboSMS) і домен/відправник для листів.
