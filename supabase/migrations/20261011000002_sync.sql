-- Client sync helpers: bulk counters for the feed, scene sizes, joining a scene, realtime for attendance.

-- Counters for many events at once (the feed), same rules as event_stats: counts only, no identities.
create or replace function public.events_stats(p_events uuid[])
returns table (event_id uuid, going integer, solo integer)
language sql stable security definer set search_path = public as $$
  select a.event_id,
         count(*)::int,
         count(*) filter (where a.going_with = 'solo' and p.show_solo)::int
  from attendances a join profiles p on p.id = a.user_id
  where a.event_id = any (p_events)
  group by a.event_id;
$$;

-- "142 people" on the scene picker: verified members of campus scenes, all members elsewhere.
create or replace function public.scene_stats()
returns table (scene_id text, members integer)
language sql stable security definer set search_path = public as $$
  select s.id, count(m.user_id)::int
  from scenes s
  left join scene_members m on m.scene_id = s.id and (s.email_domain is null or m.verified_at is not null)
  group by s.id;
$$;

-- Joins a scene; campus scenes need an address on their domain.
-- Sandbox: the address is trusted without an e-mail code. The code flow (Edge Function) replaces this before the pilot.
create or replace function public.join_scene(p_scene text, p_email text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_domain text;
  v_email text := lower(trim(p_email));
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
  if v_email is null or v_email !~ ('^[^@\s]+@' || replace(v_domain, '.', '\.') || '$') then
    raise exception 'email must be on %', v_domain using errcode = '22023';
  end if;
  insert into scene_members (user_id, scene_id, verified_email, verified_at)
  values (auth.uid(), p_scene, v_email, now())
  on conflict (user_id, scene_id) do update set verified_email = excluded.verified_email, verified_at = excluded.verified_at;
end;
$$;

revoke execute on function public.events_stats(uuid[]), public.scene_stats(), public.join_scene(text, text) from public, anon;
grant execute on function public.events_stats(uuid[]), public.scene_stats(), public.join_scene(text, text) to authenticated;

-- New people in a room show up without a refresh (RLS still decides who receives which row).
alter publication supabase_realtime add table public.attendances;
