-- Community covers: only the creator writes into communities/<id>/ in the «covers» bucket.
begin;
create extension if not exists pgtap with schema extensions;
select set_config('search_path', 'public, extensions, ' || (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgtap'), false);
select plan(5);

insert into auth.users (id, email) values
  ('55555555-5555-4555-8555-555555555555', 'erin@test.local'),
  ('66666666-6666-4666-8666-666666666666', 'finn@test.local');
insert into public.communities (id, name, created_by) values
  ('00000000-0000-4000-9000-0000000000aa', 'Erin club', '55555555-5555-4555-8555-555555555555');

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
end;
$$;

select is(public.cover_community('communities/not-a-uuid/x.jpg'), null, 'malformed paths map to no community');

select pg_temp.as_user('66666666-6666-4666-8666-666666666666');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('covers', 'communities/00000000-0000-4000-9000-0000000000aa/x.jpg') $$,
  '42501', null, 'others cannot upload a cover');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('covers', 'elsewhere/x.jpg') $$,
  '42501', null, 'nothing outside communities/<id>/');

select pg_temp.as_user('55555555-5555-4555-8555-555555555555');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('covers', 'communities/00000000-0000-4000-9000-0000000000aa/x.jpg') $$,
  'the creator uploads a cover');

-- Deletes go through the Storage API (direct SQL deletes are blocked); the same owner check guards updates.
create or replace function pg_temp.touch_cover() returns int language plpgsql as $$
declare n int;
begin
  update storage.objects set metadata = '{}' where bucket_id = 'covers' and name = 'communities/00000000-0000-4000-9000-0000000000aa/x.jpg';
  get diagnostics n = row_count;
  return n;
end;
$$;
select pg_temp.as_user('66666666-6666-4666-8666-666666666666');
select is(pg_temp.touch_cover(), 0, 'others cannot change it');

select * from finish();
rollback;
