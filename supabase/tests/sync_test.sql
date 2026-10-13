-- Communities: domain-only joining, who sees closed events, who adds events, «Met» as a count; bulk counters.
begin;
create extension if not exists pgtap with schema extensions;
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(14);

insert into auth.users (id, email) values
  ('33333333-3333-4333-8333-333333333333', 'carol@test.local'),
  ('44444444-4444-4444-8444-444444444444', 'dan@test.local');
insert into public.profiles (id, name) values
  ('33333333-3333-4333-8333-333333333333', 'Carol'),
  ('44444444-4444-4444-8444-444444444444', 'Dan');

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
end;
$$;

-- UCU is domain-only: its events are hidden from non-members, and going needs a membership.
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
select is((select count(*)::int from public.events where id = '00000000-0000-4000-8000-000000000001'), 0, 'closed community events are hidden from non-members');
select is((select count(*)::int from public.events where id = '00000000-0000-4000-8000-000000000004'), 1, 'open community events are visible to everyone');
select throws_ok($$ select public.join_community('00000000-0000-4000-9000-000000000001') $$, '22023', null, 'domain-only community needs a confirmed e-mail');

reset role;
update auth.users set email = 'carol@gmail.com', email_confirmed_at = now() where id = '33333333-3333-4333-8333-333333333333';
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
select throws_ok($$ select public.join_community('00000000-0000-4000-9000-000000000001') $$, '22023', null, 'other domains are rejected');

reset role;
update auth.users set email = 'Carol@UCU.edu.ua', email_confirmed_at = now() where id = '33333333-3333-4333-8333-333333333333';
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
select lives_ok($$ select public.join_community('00000000-0000-4000-9000-000000000001') $$, 'the campus domain is accepted');
select is((select verified_email from public.community_members where community_id = '00000000-0000-4000-9000-000000000001'), 'carol@ucu.edu.ua', 'membership keeps the confirmed address');
select is((select count(*)::int from public.events where id = '00000000-0000-4000-8000-000000000001'), 1, 'members see closed community events');
insert into public.attendances (event_id, user_id) values ('00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333');
select is((select going from public.events_stats(array['00000000-0000-4000-8000-000000000001'::uuid])), 1, 'bulk counters include the new attendee');

-- Anyone can start a community and becomes its first member; only the creator adds events.
insert into public.communities (id, name, email_domain, created_by)
  values ('55555555-5555-4555-8555-555555555555', 'Carol club', null, '33333333-3333-4333-8333-333333333333');
select is((select count(*)::int from public.community_members where community_id = '55555555-5555-4555-8555-555555555555'), 1, 'the creator is a member');
select lives_ok($$ insert into public.events (community_id, created_by, title_uk, title_en, venue, starts_at, ends_at, category)
  values ('55555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333333', 'Гра', 'Game', 'Kabinet', now() + interval '1 day', now() + interval '1 day 2 hours', 'boardgames') $$, 'the creator adds an event');

select pg_temp.as_user('44444444-4444-4444-8444-444444444444');
select lives_ok($$ insert into public.community_members (community_id, user_id) values ('55555555-5555-4555-8555-555555555555', '44444444-4444-4444-8444-444444444444') $$, 'open communities are joined directly');
select throws_ok($$ insert into public.events (community_id, created_by, title_uk, title_en, venue, starts_at, ends_at, category)
  values ('55555555-5555-4555-8555-555555555555', '44444444-4444-4444-8444-444444444444', 'Х', 'X', 'Y', now() + interval '1 day', now() + interval '1 day 1 hour', 'parties') $$, '42501', null, 'members cannot add events');
select throws_ok($$ insert into public.community_members (community_id, user_id) values ('00000000-0000-4000-9000-000000000001', '44444444-4444-4444-8444-444444444444') $$, '42501', null, 'domain-only communities cannot be joined directly');

-- «Met»: Dan matched Carol before, so Carol's event shows as one friend going, without saying who.
reset role;
insert into public.matches (event_id, user_a, user_b) values ('00000000-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444');
insert into public.attendances (event_id, user_id) values ('00000000-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333');
select pg_temp.as_user('44444444-4444-4444-8444-444444444444');
select is((select met from public.met_events() where event_id = '00000000-0000-4000-8000-000000000004'), 1, 'met counts friends going, without names');

select * from finish();
rollback;
