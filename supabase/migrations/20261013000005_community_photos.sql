-- Community cover photos. Files live in the public «covers» bucket at communities/<community id>/<file>;
-- anyone can view them, only the community's creator can upload, replace or remove them.

alter table public.communities add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- The community id from an object path, or null when the path isn't communities/<uuid>/… (so the cast can't fail).
create or replace function public.cover_community(p_name text)
returns uuid language sql immutable set search_path = public as $$
  select case
    when (storage.foldername(p_name))[1] = 'communities'
     and (storage.foldername(p_name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (storage.foldername(p_name))[2]::uuid
  end;
$$;

-- The bucket is public for viewing; the Storage API still needs a select policy to find files it removes.
create policy covers_read on storage.objects for select to authenticated using (bucket_id = 'covers');
create policy covers_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and public.is_community_owner(public.cover_community(name)));
create policy covers_update on storage.objects for update to authenticated
  using (bucket_id = 'covers' and public.is_community_owner(public.cover_community(name)))
  with check (bucket_id = 'covers' and public.is_community_owner(public.cover_community(name)));
create policy covers_delete on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and public.is_community_owner(public.cover_community(name)));
