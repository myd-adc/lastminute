-- @usernames: a placeholder when none is given, the format rule, uniqueness, and the availability check.
begin;
create extension if not exists pgtap with schema extensions;
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(7);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'yana@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'zenyk@test.local');
insert into public.profiles (id, name) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Yana');

select is((select username from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 'useraaaaaaaa', 'a profile without one gets a placeholder');

update public.profiles set username = 'Yana.K' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select is((select username from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 'yana.k', 'usernames are stored lower-case');

select throws_ok($$ update public.profiles set username = 'ya..na' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$, '23514', null, 'double dots are rejected');
select throws_ok($$ update public.profiles set username = 'юля' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$, '23514', null, 'only latin letters, digits, _ and .');
select throws_ok(
  $$ insert into public.profiles (id, name, username) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Zenyk', 'YANA.K') $$,
  '23505', null, 'usernames are unique regardless of case');

select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', json_build_object('sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'role', 'authenticated')::text, true);
select is(public.username_available('Yana.K'), false, 'someone else''s username is not available');
select set_config('request.jwt.claims', json_build_object('sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);
select is(public.username_available('yana.k'), true, 'your own username counts as available');

select * from finish();
rollback;
