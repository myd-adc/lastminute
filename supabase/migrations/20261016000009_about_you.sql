-- M04b "A little about you": the year of birth gates 18+ events, and the spoken languages show on the person card.
-- Only the year is stored, so the age shown to others is always approximate.

alter table public.profiles
  add column birth_year smallint check (birth_year between 1900 and 2100),
  add column languages text[] not null default '{}';

-- Other people's languages travel with the rest of the public profile; the birth year never leaves the owner.
