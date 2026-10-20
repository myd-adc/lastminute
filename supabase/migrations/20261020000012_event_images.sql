-- A poster photo for an event. Without one the app draws the generated poster (words, emoji, gradient).
alter table public.events add column if not exists image_url text;
