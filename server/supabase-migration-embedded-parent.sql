-- Run this when public.students already exists.
-- It embeds the parent contact data directly in each student row.
alter table public.students
  add column if not exists parent_full_name text,
  add column if not exists parent_email text,
  add column if not exists parent_phone text,
  add column if not exists parent_address text;

update public.students s
set
  parent_full_name = coalesce(s.parent_full_name, p.full_name),
  parent_email = coalesce(s.parent_email, p.email),
  parent_phone = coalesce(s.parent_phone, p.phone),
  parent_address = coalesce(s.parent_address, p.address)
from public.parents p
where s.parent_id = p.id;
