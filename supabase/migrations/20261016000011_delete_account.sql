-- "Delete account": the signed-in user removes their own auth row. Everything keyed to it cascades (profiles,
-- attendances, decisions, matches, messages, blocks, reports, memberships); community events keep running with
-- created_by set to null, while personal events go with their author.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from public.events where personal and created_by = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
