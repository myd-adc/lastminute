-- Profile photos in the private «avatars» bucket at <user id>/<file>. Same symmetry as the profile itself: a photo
-- is readable by its owner, people going to the same event and matches; the app fetches short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Mirrors profiles_read, so a photo is never visible to someone who can't see the profile.
create or replace function public.can_see_profile(p_other uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select p_other = p_user
      or public.shares_event(p_other, p_user)
      or exists (select 1 from matches m where p_user in (m.user_a, m.user_b) and p_other in (m.user_a, m.user_b));
$$;

-- The owner from an object path, or null when the path isn't <uuid>/… (so the cast can't fail).
create or replace function public.avatar_owner(p_name text)
returns uuid language sql immutable set search_path = public as $$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (storage.foldername(p_name))[1]::uuid
  end;
$$;

create policy avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.can_see_profile(public.avatar_owner(name)));
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.avatar_owner(name) = auth.uid());
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.avatar_owner(name) = auth.uid())
  with check (bucket_id = 'avatars' and public.avatar_owner(name) = auth.uid());
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.avatar_owner(name) = auth.uid());
