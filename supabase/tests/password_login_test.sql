-- login_email(): the address only for the right password, nothing for a wrong one, and a lock after 10 misses.
begin;
create extension if not exists pgtap with schema extensions;
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(5);

insert into auth.users (id, email, encrypted_password) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'oksana@test.local', extensions.crypt('right-password', extensions.gen_salt('bf')));
insert into public.profiles (id, name, username) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Oksana', 'oksana.v');

select set_config('role', 'anon', true);
select is(public.login_email('Oksana.V', 'right-password'), 'oksana@test.local', 'the right password gives the address, any case');
select is(public.login_email('oksana.v', 'wrong'), null, 'a wrong password gives nothing');
select is(public.login_email('nobody.here', 'right-password'), null, 'an unknown username gives nothing');

reset role;
insert into public.login_attempts (login) select 'oksana.v' from generate_series(1, 10);
select set_config('role', 'anon', true);
select throws_ok($$ select public.login_email('oksana.v', 'right-password') $$, 'P0001', null, 'ten misses lock the username for 15 minutes');
select is((select count(*)::int from public.login_attempts), 0, 'clients cannot read the attempts');
reset role;

select * from finish();
rollback;
