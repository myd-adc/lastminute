-- Campus scenes now trust only the e-mail Supabase Auth has confirmed with a code (auth.users.email_confirmed_at),
-- not an address sent by the client. Replaces the sandbox join_scene(p_scene, p_email).

drop function if exists public.join_scene(text, text);

create or replace function public.join_scene(p_scene text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_domain text;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select email_domain into v_domain from scenes where id = p_scene;
  if not found then
    raise exception 'unknown scene %', p_scene using errcode = '22023';
  end if;
  if v_domain is null then
    insert into scene_members (user_id, scene_id) values (auth.uid(), p_scene) on conflict do nothing;
    return;
  end if;
  select lower(email) into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null or v_email !~ ('^[^@\s]+@' || replace(v_domain, '.', '\.') || '$') then
    raise exception 'confirmed e-mail on % required', v_domain using errcode = '22023';
  end if;
  insert into scene_members (user_id, scene_id, verified_email, verified_at)
  values (auth.uid(), p_scene, v_email, now())
  on conflict (user_id, scene_id) do update set verified_email = excluded.verified_email, verified_at = excluded.verified_at;
end;
$$;

revoke execute on function public.join_scene(text) from public, anon;
grant execute on function public.join_scene(text) to authenticated;
