-- Pilot data: communities and a week of events relative to the seeding date, in Lviv time. Safe to re-run (upserts by id).

insert into public.communities (id, name, description, gradient, email_domain) values
  ('00000000-0000-4000-9000-000000000001', 'УКУ', 'Студенти й викладачі Українського католицького університету. Події в кампусі й поруч.', 'ocean', 'ucu.edu.ua'),
  ('00000000-0000-4000-9000-000000000002', 'Бар «Кульбаба»', 'Майданчик із постійною публікою: стендап, квізи, концерти.', 'candy', null),
  ('00000000-0000-4000-9000-000000000003', 'Настолки Львів', 'Щотижневі ігри, новачкам раді. Команди збираємо з тих, хто прийшов сам.', 'lime', null),
  ('00000000-0000-4000-9000-000000000004', 'ЛНУ ім. Франка', 'Студенти й викладачі Львівського університету. Події на факультетах і поруч.', 'violet', 'lnu.edu.ua'),
  ('00000000-0000-4000-9000-000000000005', 'Львівська політехніка', 'Студенти й викладачі Політехніки. Події в корпусах і довкола.', 'ember', 'lpnu.ua'),
  ('00000000-0000-4000-9000-000000000006', 'Медуніверситет', 'Студенти й викладачі Львівського медичного університету імені Данила Галицького.', 'aurora', 'meduniv.lviv.ua'),
  ('00000000-0000-4000-9000-000000000007', 'Лісотехнічний', 'Студенти й викладачі Національного лісотехнічного університету України.', 'lime', 'nltu.edu.ua'),
  ('00000000-0000-4000-9000-000000000008', 'Академія мистецтв', 'Студенти й викладачі Львівської національної академії мистецтв.', 'sunset', 'lnam.edu.ua')
on conflict (id) do update set
  name = excluded.name, description = excluded.description, gradient = excluded.gradient, email_domain = excluded.email_domain;

-- Fixed ids so re-seeding updates instead of duplicating.
insert into public.events (id, community_id, title_uk, title_en, description_uk, description_en, venue, address, walk, starts_at, ends_at, price, price_note, category, age_limit, poster, partner) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-9000-000000000001', 'Open mic: стендап для своїх', 'Open mic: stand-up among friends',
   'Шість новачків, по пʼять хвилин. Після — вільний мікрофон для сміливих. Почнемо вчасно, двері о 19:30.',
   'Six newcomers, five minutes each. Then an open mic for the brave. We start on time, doors at 19:30.',
   'Бар «Кульбаба»', 'вул. Вигадана, 12', '7 хв пішки від УКУ',
   (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '1 day 20 hours') at time zone 'Europe/Kyiv', (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '1 day 23 hours') at time zone 'Europe/Kyiv',
   150, 'Оплата на вході або на сайті організатора', 'standup', 18,
   '{"lines":["OPEN","MIC"],"emoji":"🎤","gradient":"sunset"}', true),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-9000-000000000001', 'Як читати архітектуру Львова', 'How to read Lviv’s architecture',
   'Лекція-прогулянка: як за пʼять хвилин відрізнити сецесію від модерну. Після — пройдемося Личаківською.',
   'A walking talk: tell Secession from Modernism in five minutes. Afterwards we stroll down Lychakivska St.',
   'УКУ, ауд. 302', 'вул. Козельницька, 2а', 'У кампусі',
   (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '2 days 18 hours 30 minutes') at time zone 'Europe/Kyiv', (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '2 days 20 hours 30 minutes') at time zone 'Europe/Kyiv',
   null, null, 'lectures', null, '{"lines":["АРХІ","ТЕКТУРА"],"emoji":"🏛️","gradient":"violet"}', false),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-9000-000000000003', 'Настолки: «Каркасон» турнір', 'Board games: Carcassonne tournament',
   'Турнір на вибування, правила пояснюємо на місці. Команди збираємо з тих, хто прийшов сам.',
   'A knockout tournament, rules explained on the spot. Teams are formed from people who came alone.',
   'Антикафе «Кабінет»', 'вул. Шептицьких, 24', null,
   (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '4 days 18 hours') at time zone 'Europe/Kyiv', (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '4 days 22 hours') at time zone 'Europe/Kyiv',
   60, null, 'boardgames', null, '{"lines":["КАРКА","СОН"],"emoji":"🎲","gradient":"lime"}', false),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-9000-000000000002', 'Квіз про 2000-ні', 'Quiz: the 2000s',
   'Команди до шести людей. Немає команди — збираємо з тих, хто прийшов сам.',
   'Teams of up to six. No team? We put one together from people who came alone.',
   'Бар «Кульбаба»', 'вул. Вигадана, 12', null,
   (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '3 days 20 hours') at time zone 'Europe/Kyiv', (date_trunc('day', now() at time zone 'Europe/Kyiv') + interval '3 days 22 hours') at time zone 'Europe/Kyiv',
   50, null, 'parties', null, '{"lines":["QUIZ","2000"],"emoji":"🧠","gradient":"ember"}', true)
on conflict (id) do update set
  community_id = excluded.community_id, title_uk = excluded.title_uk, title_en = excluded.title_en,
  description_uk = excluded.description_uk, description_en = excluded.description_en,
  venue = excluded.venue, address = excluded.address, walk = excluded.walk,
  starts_at = excluded.starts_at, ends_at = excluded.ends_at, price = excluded.price, price_note = excluded.price_note,
  category = excluded.category, age_limit = excluded.age_limit, poster = excluded.poster, partner = excluded.partner;
