-- Unique @username next to the name: tells two «Олі» apart and is what people pass on after a match.
-- Visible exactly like the rest of the profile (profiles_read), so symmetry is unchanged.
-- 3–20 chars: lower-case latin letters, digits, «_» and «.», no dot at either end or twice in a row.

alter table public.profiles add column username text;

-- A row without one (existing accounts, older clients) gets a placeholder the user can change in «Змінити профіль».
create or replace function public.default_username()
returns trigger language plpgsql set search_path = public as $$
begin
  new.username := coalesce(lower(new.username), 'user' || substr(replace(new.id::text, '-', ''), 1, 8));
  return new;
end;
$$;
create trigger profiles_default_username before insert or update of username on public.profiles
  for each row execute function public.default_username();

update public.profiles set username = null where username is null; -- fires the trigger for existing rows

alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format check (
    username ~ '^[a-z0-9_](?:[a-z0-9_]|\.(?!\.))*[a-z0-9_]$' and char_length(username) between 3 and 20
  );
create unique index profiles_username_key on public.profiles (username);

-- Whether a username can be taken, without revealing whose it is. The caller's own name counts as free.
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(p_username) and id <> auth.uid());
$$;

revoke execute on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;
