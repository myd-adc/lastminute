-- Product rules enforced by RLS: symmetry, consent, match creation, chat window, blocks.
-- Runs in a transaction and rolls back; uses two throwaway users and the seeded open-mic event.
begin;
create extension if not exists pgtap with schema extensions;
-- pgTAP may live in a different schema on hosted projects; put it on the path wherever it is.
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(13);

-- Fixtures (as the test owner, bypassing RLS).
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'bob@test.local');
insert into public.profiles (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'Alice'),
  ('22222222-2222-4222-8222-222222222222', 'Bob');
-- Open mic belongs to the UCU community (domain-only): both need a membership to go.
insert into public.community_members (community_id, user_id, verified_email) values
  ('00000000-0000-4000-9000-000000000001', '11111111-1111-4111-8111-111111111111', 'alice@ucu.edu.ua'),
  ('00000000-0000-4000-9000-000000000001', '22222222-2222-4222-8222-222222222222', 'bob@ucu.edu.ua');
-- Bob is already going.
insert into public.attendances (event_id, user_id) values
  ('00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222');

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
end;
$$;

-- Symmetry: before «Я йду» Alice sees counts but neither Bob's attendance nor his profile.
select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
select is((select going from public.event_stats('00000000-0000-4000-8000-000000000001')), 1, 'counts are visible before going');
select is((select count(*)::int from public.attendances where user_id = '22222222-2222-4222-8222-222222222222'), 0, 'attendees hidden before going');
select is((select count(*)::int from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 0, 'profiles hidden before going');
select throws_ok(
  $$ insert into public.decisions (event_id, from_user, to_user, choice)
     values ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'go') $$,
  '42501', null, 'cannot swipe people before going');

-- After «Я йду» Alice sees Bob.
insert into public.attendances (event_id, user_id) values
  ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111');
select is((select count(*)::int from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 1, 'profiles visible after going');

-- Consent: Alice chooses Bob; Bob cannot see that, and no match exists yet.
insert into public.decisions (event_id, from_user, to_user, choice)
  values ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'go');
select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.decisions where to_user = '22222222-2222-4222-8222-222222222222'), 0, 'nobody sees who chose them');
select is((select count(*)::int from public.matches), 0, 'one-sided go is not a match');

-- Mutual go creates the match for both.
insert into public.decisions (event_id, from_user, to_user, choice)
  values ('00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'go');
select is((select count(*)::int from public.matches), 1, 'mutual go creates a match');
select set_config('test.match', (select id::text from public.matches limit 1), true);

-- Chat: a participant can write while the chat is open.
insert into public.messages (match_id, sender_id, text)
  select id, '22222222-2222-4222-8222-222222222222', 'Привіт!' from public.matches limit 1;
select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
select is((select count(*)::int from public.messages), 1, 'match members read messages');

-- Cannot send as someone else.
select throws_ok(
  $$ insert into public.messages (match_id, sender_id, text)
     select id, '22222222-2222-4222-8222-222222222222', 'impersonation' from public.matches limit 1 $$,
  '42501', null, 'cannot send as another user');

-- Block: Alice blocks Bob → his profile and the match disappear for her, and he cannot write.
insert into public.blocks (blocker, blocked) values ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.matches), 0, 'block hides the match');
select is((select count(*)::int from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 0, 'block hides the profile');
select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
select throws_ok(
  $$ insert into public.messages (match_id, sender_id, text)
     values (current_setting('test.match')::uuid, '22222222-2222-4222-8222-222222222222', 'still there?') $$,
  '42501', null, 'blocked side cannot keep writing');

select * from finish();
rollback;
