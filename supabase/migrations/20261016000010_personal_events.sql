-- Personal events: anyone can post one without starting a community first. A city-wide event has no community
-- either, so a flag is what tells the two apart in the feed.

alter table public.events add column personal boolean not null default false;

-- Anyone signed in may create a personal event under their own name; community events stay with the creator.
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to authenticated with check (
  created_by = auth.uid()
  and (
    (personal and community_id is null)
    or exists (select 1 from public.communities c where c.id = community_id and c.created_by = auth.uid())
  )
);

-- Only the author edits or cancels a personal event.
drop policy if exists events_update_own on public.events;
create policy events_update_own on public.events for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists events_delete_own on public.events;
create policy events_delete_own on public.events for delete to authenticated using (created_by = auth.uid());
