-- Poster photos for events: anyone signed in uploads into the public «covers» bucket under events/<their id>/,
-- and only into their own folder. The event row then points at the public URL (events.image_url).
create policy covers_event_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = 'events' and (storage.foldername(name))[2] = auth.uid()::text);
create policy covers_event_delete on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = 'events' and (storage.foldername(name))[2] = auth.uid()::text);
