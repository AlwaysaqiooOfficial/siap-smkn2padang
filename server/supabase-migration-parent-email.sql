-- Run this only if the Supabase schema was already created before parents.email was added.
alter table public.parents
  add column if not exists email text;
