-- Sync helpers: joining a campus scene needs a confirmed e-mail on its domain; bulk counters expose counts only.
begin;
create extension if not exists pgtap with schema extensions;
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(7);

insert into auth.users (id, email) values ('33333333-3333-4333-8333-333333333333', 'carol@test.local');
insert into public.profiles (id, name) values ('33333333-3333-4333-8333-333333333333', 'Carol');

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
end;
$$;

select pg_temp.as_user('33333333-3333-4333-8333-333333333333');

select throws_ok($$ select public.join_scene('ucu') $$, '22023', null, 'campus scene needs a confirmed e-mail');
select throws_ok(
  $$ insert into public.attendances (event_id, user_id) values ('00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'cannot go to a campus event before joining');

-- Auth confirms the address (done by the e-mail code flow); first a foreign domain, then the campus one.
reset role;
update auth.users set email = 'carol@gmail.com', email_confirmed_at = now() where id = '33333333-3333-4333-8333-333333333333';
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
select throws_ok($$ select public.join_scene('ucu') $$, '22023', null, 'campus scene rejects other domains');

reset role;
update auth.users set email = 'Carol@UCU.edu.ua', email_confirmed_at = now() where id = '33333333-3333-4333-8333-333333333333';
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
select lives_ok($$ select public.join_scene('ucu') $$, 'campus scene accepts its domain');
select is((select verified_email from public.scene_members where scene_id = 'ucu'), 'carol@ucu.edu.ua', 'membership is verified with the normalized address');

insert into public.attendances (event_id, user_id) values ('00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333');
select is(
  (select going from public.events_stats(array['00000000-0000-4000-8000-000000000001'::uuid])),
  1, 'bulk counters include the new attendee');

select lives_ok($$ select public.join_scene('kulbaba') $$, 'open scenes need no e-mail');

select * from finish();
rollback;
