-- SIAP SMKN 2 PADANG - Supabase/PostgreSQL schema
-- Run this file in Supabase SQL Editor before running the seed generator.

create extension if not exists pgcrypto;

create type public.user_role as enum ('SUPER_ADMIN','WALI_KELAS','GURU','SCANNER','SISWA','ORANG_TUA');
create type public.gender as enum ('L','P');
create type public.attendance_status as enum ('HADIR','TERLAMBAT','IZIN','SAKIT','DISPENSASI','ALFA');
create type public.permission_type as enum ('IZIN','SAKIT','DISPENSASI');
create type public.permission_status as enum ('PENDING','APPROVED','REJECTED');
create type public.violation_status as enum ('REPORTED','REVIEWED','RESOLVED');
create type public.email_status as enum ('PENDING','SENT','FAILED');
create type public.activity_action as enum ('LOGIN','LOGOUT','CREATE','UPDATE','DELETE','SCAN_ATTENDANCE','APPROVE_PERMISSION','REJECT_PERMISSION','CREATE_VIOLATION','EXPORT_REPORT');

create table public.users (
  id text primary key,
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  role public.user_role not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teachers (
  id text primary key,
  user_id text not null unique references public.users(id) on delete cascade,
  nip text unique,
  full_name text not null,
  phone text,
  is_homeroom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parents (
  id text primary key,
  user_id text unique references public.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.majors (
  id text primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id text primary key,
  name text not null,
  grade integer not null check (grade between 10 and 12),
  major_id text not null references public.majors(id),
  homeroom_teacher_id text unique references public.teachers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, major_id)
);

create table public.academic_years (
  id text primary key,
  name text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.semesters (
  id text primary key,
  academic_year_id text not null references public.academic_years(id),
  name text not null,
  "order" integer not null check ("order" in (1, 2)),
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (academic_year_id, "order")
);

create table public.students (
  id text primary key,
  user_id text unique references public.users(id),
  nis text not null unique,
  nisn text not null unique,
  full_name text not null,
  gender public.gender not null,
  birth_date timestamptz not null,
  address text,
  major_id text not null references public.majors(id),
  class_id text not null references public.classes(id),
  parent_id text references public.parents(id),
  parent_full_name text,
  parent_email text,
  parent_phone text,
  parent_address text,
  qr_token text not null unique,
  is_active boolean not null default true,
  email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tampilan siswa per kelas, setara dengan students/{class-id}.json di repository lama.
create or replace view public.students_by_class as
select
  s.*,
  c.name as class_name,
  c.grade as class_grade,
  m.code as major_code,
  m.name as major_name
from public.students s
join public.classes c on c.id = s.class_id
join public.majors m on m.id = s.major_id;

create table public.student_class_histories (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  class_id text not null references public.classes(id),
  semester_id text not null references public.semesters(id),
  note text,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  type public.permission_type not null,
  reason text not null,
  date date not null,
  attachment text,
  status public.permission_status not null default 'PENDING',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  semester_id text not null references public.semesters(id),
  date date not null,
  check_in_time timestamptz,
  status public.attendance_status not null,
  permission_id text unique references public.permissions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, date, semester_id)
);

create table public.attendance_logs (
  id text primary key,
  attendance_id text not null references public.attendance(id) on delete cascade,
  action text not null,
  performed_by text,
  ip_address text,
  note text,
  created_at timestamptz not null default now()
);

create table public.violation_categories (
  id text primary key,
  name text not null unique,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.violations (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  teacher_id text not null references public.teachers(id),
  category_id text not null references public.violation_categories(id),
  description text,
  date date not null,
  points integer not null,
  status public.violation_status not null default 'REPORTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.email_logs (
  id text primary key,
  to_email text not null,
  subject text not null,
  body text not null,
  status public.email_status not null default 'PENDING',
  error_message text,
  related_type text,
  related_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id text primary key,
  user_id text references public.users(id),
  action public.activity_action not null,
  entity text not null,
  entity_id text,
  ip_address text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.school_settings (
  id text primary key,
  key text not null unique,
  value text not null,
  updated_at timestamptz not null default now()
);

create index users_role_idx on public.users(role);
create index classes_major_id_idx on public.classes(major_id);
create index semesters_academic_year_id_idx on public.semesters(academic_year_id);
create index students_class_id_idx on public.students(class_id);
create index students_major_id_idx on public.students(major_id);
create index students_parent_id_idx on public.students(parent_id);
create index student_class_histories_student_id_idx on public.student_class_histories(student_id);
create index student_class_histories_semester_id_idx on public.student_class_histories(semester_id);
create index attendance_date_idx on public.attendance(date);
create index attendance_status_idx on public.attendance(status);
create index attendance_logs_attendance_id_idx on public.attendance_logs(attendance_id);
create index permissions_student_id_idx on public.permissions(student_id);
create index permissions_status_idx on public.permissions(status);
create index violations_student_id_idx on public.violations(student_id);
create index violations_date_idx on public.violations(date);
create index notifications_user_id_idx on public.notifications(user_id);
create index email_logs_status_idx on public.email_logs(status);
create index activity_logs_user_id_idx on public.activity_logs(user_id);
create index activity_logs_action_idx on public.activity_logs(action);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger teachers_set_updated_at before update on public.teachers for each row execute function public.set_updated_at();
create trigger parents_set_updated_at before update on public.parents for each row execute function public.set_updated_at();
create trigger majors_set_updated_at before update on public.majors for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger permissions_set_updated_at before update on public.permissions for each row execute function public.set_updated_at();
create trigger attendance_set_updated_at before update on public.attendance for each row execute function public.set_updated_at();
create trigger violations_set_updated_at before update on public.violations for each row execute function public.set_updated_at();
create trigger school_settings_set_updated_at before update on public.school_settings for each row execute function public.set_updated_at();

-- Server-side API uses the service role, so tables remain private to PostgREST clients.
-- Add explicit RLS policies only if the browser will access Supabase directly.
