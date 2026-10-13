-- Profile photos follow the profile's symmetry: owner, people at the same event and matches; nobody else.
begin;
create extension if not exists pgtap with schema extensions;
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(6);

insert into auth.users (id, email) values
  ('77777777-7777-4777-8777-777777777777', 'gala@test.local'),
  ('88888888-8888-4888-8888-888888888888', 'hryts@test.local'),
  ('99999999-9999-4999-8999-999999999999', 'ira@test.local');
insert into public.profiles (id, name) values
  ('77777777-7777-4777-8777-777777777777', 'Gala'),
  ('88888888-8888-4888-8888-888888888888', 'Hryts'),
  ('99999999-9999-4999-8999-999999999999', 'Ira');
-- Gala and Hryts go to the same open event; Ira goes nowhere.
insert into public.attendances (event_id, user_id) values
  ('00000000-0000-4000-8000-000000000004', '77777777-7777-4777-8777-777777777777'),
  ('00000000-0000-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888');

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
end;
$$;
create or replace function pg_temp.visible() returns int language sql as $$
  select count(*)::int from storage.objects where bucket_id = 'avatars' and name = '77777777-7777-4777-8777-777777777777/a.jpg';
$$;

select pg_temp.as_user('99999999-9999-4999-8999-999999999999');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '77777777-7777-4777-8777-777777777777/a.jpg') $$,
  '42501', null, 'nobody uploads into someone else''s folder');

select pg_temp.as_user('77777777-7777-4777-8777-777777777777');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '77777777-7777-4777-8777-777777777777/a.jpg') $$,
  'the owner uploads a photo');
select is(pg_temp.visible(), 1, 'the owner sees it');

select pg_temp.as_user('88888888-8888-4888-8888-888888888888');
select is(pg_temp.visible(), 1, 'someone going to the same event sees it');

select pg_temp.as_user('99999999-9999-4999-8999-999999999999');
select is(pg_temp.visible(), 0, 'a stranger does not');

reset role;
insert into public.blocks (blocker, blocked) values ('77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888');
select pg_temp.as_user('88888888-8888-4888-8888-888888888888');
select is(pg_temp.visible(), 0, 'a blocked person does not');

select * from finish();
rollback;
