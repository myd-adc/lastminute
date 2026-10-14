-- Sign in with @username + password. Supabase Auth signs in by e-mail, so the app first trades the username and
-- password for the address. The address is returned only when the password matches, so usernames never reveal
-- e-mails; failed attempts per login are throttled because this check sits outside Auth's own rate limits.

create table public.login_attempts (
  login text not null,
  at timestamptz not null default now()
);
create index login_attempts_login_at_idx on public.login_attempts (login, at);
alter table public.login_attempts enable row level security; -- no policies: only login_email() touches it

create or replace function public.login_email(p_login text, p_password text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_login text := lower(trim(p_login));
  v_email text;
  v_hash text;
begin
  if (select count(*) from login_attempts where login = v_login and at > now() - interval '15 minutes') >= 10 then
    raise exception 'too many attempts' using errcode = 'P0001', hint = 'too_many';
  end if;
  select u.email, u.encrypted_password into v_email, v_hash
  from profiles p join auth.users u on u.id = p.id
  where p.username = v_login;
  if v_hash is not null and v_hash <> '' and crypt(p_password, v_hash) = v_hash then
    delete from login_attempts where login = v_login;
    return v_email;
  end if;
  insert into login_attempts (login) values (v_login);
  return null;
end;
$$;

revoke execute on function public.login_email(text, text) from public;
grant execute on function public.login_email(text, text) to anon, authenticated;
