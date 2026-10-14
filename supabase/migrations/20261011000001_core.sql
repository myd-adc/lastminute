-- Stage 1 core: scenes, profiles, events, attendance ("I'm going"), room decisions, matches, messages, blocks, reports.
-- Product rules are enforced here (RLS + security definer functions), never only in the client:
--   symmetry  — attendees are visible only to people going to the same event;
--   consent   — nobody sees who chose them; a match exists only when both chose «go»;
--   24 h      — chat is writable until the event ends + 24 h, then messages are purged;
--   block     — a block in either direction hides people from each other everywhere.

create extension if not exists pg_cron;

-- ── Types ──────────────────────────────────────────────────────────────────

create type public.scene_kind as enum ('campus', 'venue', 'guest');
create type public.going_with as enum ('solo', 'friends');
create type public.decision as enum ('go', 'skip');
create type public.report_reason as enum ('messages', 'dating', 'fake', 'unsafe', 'other');

-- ── Tables ─────────────────────────────────────────────────────────────────

create table public.scenes (
  id text primary key,
  name_uk text not null,
  name_en text not null,
  description_uk text not null default '',
  description_en text not null default '',
  kind public.scene_kind not null,
  gradient text not null default 'aurora',
  email_domain text, -- set for campus scenes: membership requires a verified e-mail on this domain
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  affiliation text not null default '' check (char_length(affiliation) <= 60),
  talk_about text not null default '' check (char_length(talk_about) <= 80),
  photo_path text,
  gradient text not null default 'aurora',
  gender text check (gender in ('f', 'm')),
  interests text[] not null default '{}',
  vibe text,
  goes_with text,
  scene_id text references public.scenes (id),
  show_solo boolean not null default true,
  show_shared boolean not null default true,
  language text not null default 'uk' check (language in ('uk', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scene_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  scene_id text not null references public.scenes (id) on delete cascade,
  verified_email text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, scene_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  scene_id text not null references public.scenes (id),
  title_uk text not null,
  title_en text not null,
  description_uk text not null default '',
  description_en text not null default '',
  venue text not null,
  address text not null default '',
  walk text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price integer check (price is null or price >= 0), -- UAH, null = free
  price_note text,
  ticket_url text,
  category text not null,
  age_limit smallint,
  poster jsonb not null default '{}'::jsonb, -- { lines: string[], emoji: string, gradient: string }
  partner boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index events_scene_starts_idx on public.events (scene_id, starts_at);

create table public.attendances (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  going_with public.going_with not null default 'solo',
  join_solo_group boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index attendances_user_idx on public.attendances (user_id);

create table public.decisions (
  event_id uuid not null references public.events (id) on delete cascade,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  choice public.decision not null,
  created_at timestamptz not null default now(),
  primary key (event_id, from_user, to_user),
  check (from_user <> to_user)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  closed_by uuid references auth.users (id), -- "Close chat now"
  unique (event_id, user_a, user_b),
  check (user_a < user_b)
);
create index matches_user_a_idx on public.matches (user_a);
create index matches_user_b_idx on public.matches (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_match_created_idx on public.messages (match_id, created_at);

create table public.blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references auth.users (id) on delete cascade,
  reported uuid not null references auth.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  reason public.report_reason not null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

-- ── Helper functions (security definer: they read rows RLS would hide, but return only booleans/counts) ──

create or replace function public.is_going(p_event uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from attendances where event_id = p_event and user_id = p_user);
$$;

create or replace function public.is_blocked(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks where (blocker = p_a and blocked = p_b) or (blocker = p_b and blocked = p_a)
  );
$$;

-- Campus scenes admit only members with a verified e-mail; other scenes are open.
create or replace function public.can_enter_scene(p_scene text, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when (select email_domain from scenes where id = p_scene) is null then true
    else exists (select 1 from scene_members where scene_id = p_scene and user_id = p_user and verified_at is not null)
  end;
$$;

-- Two users share an event both are going to (and are not blocked): the condition for seeing each other's profile.
create or replace function public.shares_event(p_other uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select not public.is_blocked(p_user, p_other) and exists (
    select 1 from attendances a join attendances b on a.event_id = b.event_id
    where a.user_id = p_user and b.user_id = p_other
  );
$$;

create or replace function public.is_match_member(p_match uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches where id = p_match and p_user in (user_a, user_b));
$$;

-- Chat is open until the event ends + 24 h, unless someone closed it or a block exists.
create or replace function public.chat_open(p_match uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches m join events e on e.id = m.event_id
    where m.id = p_match
      and m.closed_by is null
      and now() < e.ends_at + interval '24 hours'
      and not public.is_blocked(m.user_a, m.user_b)
  );
$$;

-- Counters shown before "I'm going" (no identities): how many are going, how many alone, how many you've met before.
create or replace function public.event_stats(p_event uuid)
returns table (going integer, solo integer)
language sql stable security definer set search_path = public as $$
  select count(*)::int,
         count(*) filter (where a.going_with = 'solo' and p.show_solo)::int
  from attendances a join profiles p on p.id = a.user_id
  where a.event_id = p_event;
$$;

-- ── Triggers ───────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Mutual «go» creates the match; the other side never learns about a one-sided «go».
create or replace function public.create_match_on_mutual_go()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.choice = 'go' and exists (
    select 1 from decisions
    where event_id = new.event_id and from_user = new.to_user and to_user = new.from_user and choice = 'go'
  ) then
    insert into matches (event_id, user_a, user_b)
    values (new.event_id, least(new.from_user, new.to_user), greatest(new.from_user, new.to_user))
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger decisions_match after insert or update of choice on public.decisions
  for each row execute function public.create_match_on_mutual_go();

-- ── Row Level Security ─────────────────────────────────────────────────────

alter table public.scenes enable row level security;
alter table public.profiles enable row level security;
alter table public.scene_members enable row level security;
alter table public.events enable row level security;
alter table public.attendances enable row level security;
alter table public.decisions enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- Scenes and events are public to signed-in users (the feed and "The whole city").
create policy scenes_read on public.scenes for select to authenticated using (true);
create policy events_read on public.events for select to authenticated using (true);

-- Profiles: yourself, people going to the same event (symmetry), and your matches.
create policy profiles_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.shares_event(id)
    or exists (select 1 from matches m where auth.uid() in (m.user_a, m.user_b) and id in (m.user_a, m.user_b))
  );
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Scene membership: own rows only. Verification fields are set by the e-mail Edge Function (service role).
create policy scene_members_read on public.scene_members for select to authenticated using (user_id = auth.uid());
create policy scene_members_insert on public.scene_members for insert to authenticated
  with check (user_id = auth.uid() and verified_at is null and verified_email is null);
create policy scene_members_delete on public.scene_members for delete to authenticated using (user_id = auth.uid());

-- "I'm going": you see your own rows, and other attendees only of events you're going to yourself.
create policy attendances_read on public.attendances for select to authenticated
  using (
    user_id = auth.uid()
    or (public.is_going(event_id) and not public.is_blocked(auth.uid(), user_id))
  );
create policy attendances_insert on public.attendances for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_enter_scene((select scene_id from public.events e where e.id = event_id))
    and (select ends_at from public.events e where e.id = event_id) > now()
  );
create policy attendances_update on public.attendances for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy attendances_delete on public.attendances for delete to authenticated using (user_id = auth.uid());

-- Room decisions: write and read only your own; both sides must be going to the event.
create policy decisions_read on public.decisions for select to authenticated using (from_user = auth.uid());
create policy decisions_insert on public.decisions for insert to authenticated
  with check (
    from_user = auth.uid()
    and public.is_going(event_id)
    and public.is_going(event_id, to_user)
    and not public.is_blocked(from_user, to_user)
  );
create policy decisions_update on public.decisions for update to authenticated
  using (from_user = auth.uid()) with check (from_user = auth.uid());

-- Matches: participants only; a participant may close the chat (set closed_by to themselves).
create policy matches_read on public.matches for select to authenticated
  using (auth.uid() in (user_a, user_b) and not public.is_blocked(user_a, user_b));
create policy matches_close on public.matches for update to authenticated
  using (auth.uid() in (user_a, user_b)) with check (closed_by = auth.uid());

-- Messages: participants read; send only while the chat is open.
create policy messages_read on public.messages for select to authenticated
  using (public.is_match_member(match_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_match_member(match_id) and public.chat_open(match_id));

-- Blocks and reports: own rows only; reports are write-only for users.
create policy blocks_read on public.blocks for select to authenticated using (blocker = auth.uid());
create policy blocks_insert on public.blocks for insert to authenticated with check (blocker = auth.uid());
create policy blocks_delete on public.blocks for delete to authenticated using (blocker = auth.uid());
create policy reports_insert on public.reports for insert to authenticated with check (reporter = auth.uid());

-- ── Grants (new tables are not exposed automatically in this project) ─────────

grant usage on schema public to authenticated;
grant select on public.scenes, public.events to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.scene_members to authenticated;
grant select, insert, update, delete on public.attendances to authenticated;
grant select, insert, update on public.decisions to authenticated;
grant select, update (closed_by) on public.matches to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant insert on public.reports to authenticated;
grant execute on function public.event_stats(uuid), public.is_going(uuid, uuid), public.chat_open(uuid) to authenticated;

-- ── Realtime: chat messages and new matches are pushed to clients (RLS still applies) ──

alter publication supabase_realtime add table public.messages, public.matches;

-- ── 24 h purge: messages of matches whose event ended more than 24 h ago ──

select cron.schedule(
  'purge-expired-chats',
  '7 * * * *',
  $$
    delete from public.messages msg
    using public.matches m, public.events e
    where msg.match_id = m.id and m.event_id = e.id and e.ends_at + interval '24 hours' < now();
  $$
);
