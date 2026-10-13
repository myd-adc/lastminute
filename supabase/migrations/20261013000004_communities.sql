-- Scenes become communities: anyone can start one, open to everyone or only to a confirmed e-mail domain,
-- and its creator adds its events. City-wide events (community_id null) still come from us via Studio.
--   For you      — events of open communities and city events;
--   Communities  — events of the communities you are in (closed ones are visible to members only);
--   Met          — events where people you matched with are going, shown as a count only (symmetry).

-- ── Tables ─────────────────────────────────────────────────────────────────

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  description text not null default '' check (char_length(description) <= 200),
  gradient text not null default 'aurora',
  email_domain text check (email_domain is null or email_domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_email text, -- the confirmed address that let the user into a domain-only community
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members (user_id);

-- ── Move scenes over (fixed ids so the seed and existing data line up) ──────

insert into public.communities (id, name, description, gradient, email_domain)
select case s.id when 'ucu' then '00000000-0000-4000-9000-000000000001'::uuid
                 when 'kulbaba' then '00000000-0000-4000-9000-000000000002'::uuid
                 else gen_random_uuid() end,
       s.name_en, s.description_en, s.gradient, s.email_domain
from public.scenes s
where s.kind <> 'guest';

create temporary table scene_map on commit drop as
select s.id as scene_id, c.id as community_id
from public.scenes s join public.communities c on c.name = s.name_en;

insert into public.community_members (community_id, user_id, verified_email, joined_at)
select m.community_id, sm.user_id, sm.verified_email, sm.created_at
from public.scene_members sm join scene_map m on m.scene_id = sm.scene_id
where sm.verified_at is not null or (select email_domain from public.scenes where id = sm.scene_id) is null
on conflict do nothing;

alter table public.events add column community_id uuid references public.communities (id) on delete cascade;
alter table public.events add column created_by uuid references auth.users (id) on delete set null;
update public.events e set community_id = m.community_id from scene_map m where m.scene_id = e.scene_id;
create index events_community_starts_idx on public.events (community_id, starts_at);

-- ── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.is_community_member(p_community uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from community_members where community_id = p_community and user_id = p_user);
$$;

create or replace function public.is_community_owner(p_community uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from communities where id = p_community and created_by = p_user);
$$;

-- City events and open communities are for everyone; a domain-only community is for its members.
create or replace function public.can_enter_community(p_community uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select p_community is null
      or (select email_domain from communities where id = p_community) is null
      or public.is_community_member(p_community, p_user);
$$;

-- The creator is the first member.
create or replace function public.add_creator_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into community_members (community_id, user_id) values (new.id, new.created_by) on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger communities_creator_member after insert on public.communities
  for each row execute function public.add_creator_as_member();

-- Joins a community; a domain-only one checks the address Supabase Auth has confirmed with a code.
create or replace function public.join_community(p_community uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_domain text;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select email_domain into v_domain from communities where id = p_community;
  if not found then
    raise exception 'unknown community' using errcode = '22023';
  end if;
  if v_domain is not null then
    select lower(email) into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
    if v_email is null or v_email !~ ('^[^@\s]+@' || replace(v_domain, '.', '\.') || '$') then
      raise exception 'confirmed e-mail on % required', v_domain using errcode = '22023';
    end if;
  end if;
  insert into community_members (community_id, user_id, verified_email)
  values (p_community, auth.uid(), v_email)
  on conflict (community_id, user_id) do update set verified_email = coalesce(excluded.verified_email, community_members.verified_email);
end;
$$;

-- «142 members · 6 events this week» without exposing who the members are.
create or replace function public.community_stats()
returns table (community_id uuid, members integer, events_this_week integer)
language sql stable security definer set search_path = public as $$
  select c.id,
         (select count(*) from community_members m where m.community_id = c.id)::int,
         (select count(*) from events e where e.community_id = c.id and e.ends_at > now() and e.starts_at < now() + interval '7 days')::int
  from communities c;
$$;

-- «Met»: how many people you matched with before are going to each event. A count, never who (symmetry).
create or replace function public.met_events()
returns table (event_id uuid, met integer)
language sql stable security definer set search_path = public as $$
  with friends as (
    select distinct case when m.user_a = auth.uid() then m.user_b else m.user_a end as uid
    from matches m
    where auth.uid() in (m.user_a, m.user_b) and not public.is_blocked(m.user_a, m.user_b)
  )
  select a.event_id, count(distinct a.user_id)::int
  from attendances a join friends f on f.uid = a.user_id join events e on e.id = a.event_id
  where e.ends_at > now() and public.can_enter_community(e.community_id)
  group by a.event_id;
$$;

-- ── Policies: replace everything that referenced scenes ─────────────────────

drop policy attendances_insert on public.attendances;
create policy attendances_insert on public.attendances for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_enter_community((select community_id from public.events e where e.id = event_id))
    and (select ends_at from public.events e where e.id = event_id) > now()
  );

drop policy events_read on public.events;
create policy events_read on public.events for select to authenticated using (public.can_enter_community(community_id));
create policy events_insert on public.events for insert to authenticated
  with check (created_by = auth.uid() and community_id is not null and public.is_community_owner(community_id));
create policy events_update on public.events for update to authenticated
  using (public.is_community_owner(community_id)) with check (public.is_community_owner(community_id));
create policy events_delete on public.events for delete to authenticated using (public.is_community_owner(community_id));

alter table public.communities enable row level security;
alter table public.community_members enable row level security;

create policy communities_read on public.communities for select to authenticated using (true);
create policy communities_insert on public.communities for insert to authenticated with check (created_by = auth.uid());
create policy communities_update on public.communities for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy communities_delete on public.communities for delete to authenticated using (created_by = auth.uid());

-- Own memberships; domain-only communities are joined through join_community().
create policy community_members_read on public.community_members for select to authenticated using (user_id = auth.uid());
create policy community_members_insert on public.community_members for insert to authenticated
  with check (user_id = auth.uid() and verified_email is null
              and (select email_domain from public.communities c where c.id = community_id) is null);
create policy community_members_delete on public.community_members for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.communities to authenticated;
grant select, insert, delete on public.community_members to authenticated;
grant insert, update, delete on public.events to authenticated;
revoke execute on function public.join_community(uuid), public.community_stats(), public.met_events() from public, anon;
grant execute on function public.join_community(uuid), public.community_stats(), public.met_events() to authenticated;

-- ── Drop the scene model ───────────────────────────────────────────────────

alter table public.events drop column scene_id;
alter table public.profiles drop column scene_id;
drop function if exists public.join_scene(text);
drop function if exists public.scene_stats();
drop function if exists public.can_enter_scene(text, uuid);
drop table public.scene_members;
drop table public.scenes;
drop type public.scene_kind;

alter publication supabase_realtime add table public.community_members;
