-- Class Management App: initial schema and row-level security
-- Apply only to the dedicated class-management-app Supabase project.
-- All sensitive tables have RLS enabled. Review policies before production launch.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'teacher', 'student');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
create type public.assignment_status as enum ('draft', 'published', 'closed');
create type public.submission_status as enum ('submitted', 'needs_revision', 'graded');
create type public.material_kind as enum ('book', 'notes', 'pdf', 'other');
create type public.notification_kind as enum ('announcement', 'assignment', 'grade', 'attendance', 'timetable', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  roll_number text unique,
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_settings (
  id uuid primary key default gen_random_uuid(),
  class_name text not null default 'My Class',
  academic_year text,
  timezone text not null default 'Asia/Karachi',
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.teacher_subjects (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, subject_id)
);

create table public.cr_permissions (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  can_post_announcements boolean not null default false,
  can_manage_timetable boolean not null default false,
  can_manage_attendance boolean not null default false,
  can_manage_assignments boolean not null default false,
  granted_by uuid not null references public.profiles(id),
  granted_at timestamptz not null default now()
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id),
  session_date date not null,
  starts_at time,
  ends_at time,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (subject_id, session_date, starts_at)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.attendance_status not null,
  note text,
  marked_by uuid not null references public.profiles(id),
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id),
  teacher_id uuid not null references public.profiles(id),
  title text not null,
  instructions text,
  attachment_path text,
  due_at timestamptz,
  total_marks numeric(8,2),
  status public.assignment_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  file_path text,
  answer_text text,
  status public.submission_status not null default 'submitted',
  marks numeric(8,2),
  feedback text,
  graded_by uuid references public.profiles(id),
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id),
  constraint marks_nonnegative check (marks is null or marks >= 0)
);

create table public.submission_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_path text,
  answer_text text,
  submitted_at timestamptz not null default now(),
  submitted_by uuid not null references public.profiles(id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  author_id uuid not null references public.profiles(id),
  is_published boolean not null default false,
  is_pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id),
  teacher_id uuid not null references public.profiles(id),
  title text not null,
  description text,
  kind public.material_kind not null default 'pdf',
  storage_path text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id),
  teacher_id uuid not null references public.profiles(id),
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  room text,
  valid_from date not null default current_date,
  valid_until date,
  is_cancelled boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint valid_slot check (ends_at > starts_at),
  constraint valid_date_range check (valid_until is null or valid_until >= valid_from)
);

create table public.timetable_changes (
  id uuid primary key default gen_random_uuid(),
  timetable_entry_id uuid references public.timetable_entries(id) on delete set null,
  change_type text not null check (change_type in ('created', 'rescheduled', 'cancelled')),
  old_details jsonb,
  new_details jsonb,
  changed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind public.notification_kind not null default 'system',
  title text not null,
  body text,
  target_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index attendance_records_student_idx on public.attendance_records(student_id);
create index attendance_sessions_date_idx on public.attendance_sessions(session_date desc);
create index assignments_subject_status_idx on public.assignments(subject_id, status);
create index submissions_student_idx on public.submissions(student_id);
create index announcements_published_idx on public.announcements(is_published, published_at desc);
create index notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);
create index timetable_weekday_idx on public.timetable_entries(weekday, starts_at);

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin'::public.app_role, false)
$$;

create or replace function public.is_assigned_teacher(p_subject_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_subjects ts
    where ts.teacher_id = auth.uid() and ts.subject_id = p_subject_id
  )
$$;

create or replace function public.has_cr_permission(p_permission text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cr_permissions cp
    where cp.student_id = auth.uid()
      and case p_permission
        when 'announcements' then cp.can_post_announcements
        when 'timetable' then cp.can_manage_timetable
        when 'attendance' then cp.can_manage_attendance
        when 'assignments' then cp.can_manage_assignments
        else false
      end
  )
$$;

alter table public.profiles enable row level security;
alter table public.class_settings enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.cr_permissions enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_history enable row level security;
alter table public.announcements enable row level security;
alter table public.materials enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.timetable_changes enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Profile directory is restricted: students can read only their own profile.
-- Admins manage all profiles; teachers may read assigned class student names for teaching workflows.
create policy "profiles_select_self_admin_or_assigned_teacher" on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or (
    public.current_app_role() = 'teacher'::public.app_role
    and role = 'student'::public.app_role
    and exists (select 1 from public.teacher_subjects ts where ts.teacher_id = auth.uid())
  )
);

create policy "profiles_admin_manage" on public.profiles
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "class_settings_authenticated_read" on public.class_settings
for select to authenticated using (true);
create policy "class_settings_admin_manage" on public.class_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subjects_authenticated_read" on public.subjects
for select to authenticated using (true);
create policy "subjects_admin_manage" on public.subjects
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "teacher_subjects_read_own_or_admin" on public.teacher_subjects
for select to authenticated using (teacher_id = auth.uid() or public.is_admin());
create policy "teacher_subjects_admin_manage" on public.teacher_subjects
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "cr_permissions_read_self_admin" on public.cr_permissions
for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "cr_permissions_admin_manage" on public.cr_permissions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "attendance_sessions_read_class" on public.attendance_sessions
for select to authenticated using (
  public.is_admin()
  or public.is_assigned_teacher(subject_id)
  or exists (select 1 from public.attendance_records ar where ar.session_id = id and ar.student_id = auth.uid())
);
create policy "attendance_sessions_manage_authorized" on public.attendance_sessions
for all to authenticated using (
  public.is_admin()
  or public.is_assigned_teacher(subject_id)
  or public.has_cr_permission('attendance')
) with check (
  public.is_admin()
  or public.is_assigned_teacher(subject_id)
  or public.has_cr_permission('attendance')
);

create policy "attendance_records_read_own_or_authorized" on public.attendance_records
for select to authenticated using (
  student_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.attendance_sessions s
    where s.id = session_id and public.is_assigned_teacher(s.subject_id)
  )
  or public.has_cr_permission('attendance')
);
create policy "attendance_records_manage_authorized" on public.attendance_records
for all to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.attendance_sessions s
    where s.id = session_id and public.is_assigned_teacher(s.subject_id)
  )
  or public.has_cr_permission('attendance')
) with check (
  public.is_admin()
  or exists (
    select 1 from public.attendance_sessions s
    where s.id = session_id and public.is_assigned_teacher(s.subject_id)
  )
  or public.has_cr_permission('attendance')
);

create policy "assignments_read_published_or_owner" on public.assignments
for select to authenticated using (
  public.is_admin()
  or teacher_id = auth.uid()
  or public.is_assigned_teacher(subject_id)
  or (status = 'published'::public.assignment_status and public.current_app_role() = 'student'::public.app_role)
);
create policy "assignments_manage_teacher_admin_cr" on public.assignments
for all to authenticated using (
  public.is_admin() or teacher_id = auth.uid()
  or (public.current_app_role() = 'teacher'::public.app_role and public.is_assigned_teacher(subject_id))
  or public.has_cr_permission('assignments')
) with check (
  public.is_admin() or teacher_id = auth.uid()
  or (public.current_app_role() = 'teacher'::public.app_role and public.is_assigned_teacher(subject_id))
  or public.has_cr_permission('assignments')
);

create policy "submissions_read_own_or_assigned_teacher" on public.submissions
for select to authenticated using (
  student_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.assignments a where a.id = assignment_id and (a.teacher_id = auth.uid() or public.is_assigned_teacher(a.subject_id)))
);
create policy "submissions_student_insert_own" on public.submissions
for insert to authenticated with check (student_id = auth.uid());
create policy "submissions_student_update_own_ungraded" on public.submissions
for update to authenticated using (
  student_id = auth.uid() and status <> 'graded'::public.submission_status
) with check (student_id = auth.uid() and status <> 'graded'::public.submission_status);
create policy "submissions_teacher_grade_admin" on public.submissions
for update to authenticated using (
  public.is_admin()
  or exists (select 1 from public.assignments a where a.id = assignment_id and (a.teacher_id = auth.uid() or public.is_assigned_teacher(a.subject_id)))
) with check (
  public.is_admin()
  or exists (select 1 from public.assignments a where a.id = assignment_id and (a.teacher_id = auth.uid() or public.is_assigned_teacher(a.subject_id)))
);

create policy "submission_history_read_own_or_teacher" on public.submission_history
for select to authenticated using (
  submitted_by = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
    where s.id = submission_id and (a.teacher_id = auth.uid() or public.is_assigned_teacher(a.subject_id))
  )
);
create policy "submission_history_insert_own" on public.submission_history
for insert to authenticated with check (submitted_by = auth.uid());

create policy "announcements_read_published" on public.announcements
for select to authenticated using (is_published or author_id = auth.uid() or public.is_admin());
create policy "announcements_manage_admin_teacher_cr" on public.announcements
for all to authenticated using (
  public.is_admin()
  or author_id = auth.uid()
  or (public.current_app_role() = 'teacher'::public.app_role)
  or public.has_cr_permission('announcements')
) with check (
  public.is_admin()
  or author_id = auth.uid()
  or (public.current_app_role() = 'teacher'::public.app_role)
  or public.has_cr_permission('announcements')
);

create policy "materials_read_published_or_owner" on public.materials
for select to authenticated using (
  is_published or teacher_id = auth.uid() or public.is_admin()
  or public.is_assigned_teacher(subject_id)
);
create policy "materials_manage_teacher_admin" on public.materials
for all to authenticated using (
  public.is_admin() or teacher_id = auth.uid()
  or (public.current_app_role() = 'teacher'::public.app_role and public.is_assigned_teacher(subject_id))
) with check (
  public.is_admin() or teacher_id = auth.uid()
  or (public.current_app_role() = 'teacher'::public.app_role and public.is_assigned_teacher(subject_id))
);

create policy "timetable_read_class" on public.timetable_entries
for select to authenticated using (not is_cancelled or public.is_admin() or teacher_id = auth.uid());
create policy "timetable_manage_admin_teacher_cr" on public.timetable_entries
for all to authenticated using (
  public.is_admin() or teacher_id = auth.uid()
  or public.has_cr_permission('timetable')
) with check (
  public.is_admin() or teacher_id = auth.uid()
  or public.has_cr_permission('timetable')
);

create policy "timetable_changes_read_authenticated" on public.timetable_changes
for select to authenticated using (true);
create policy "timetable_changes_insert_authorized" on public.timetable_changes
for insert to authenticated with check (
  public.is_admin() or changed_by = auth.uid() or public.has_cr_permission('timetable')
);

create policy "notifications_read_own" on public.notifications
for select to authenticated using (recipient_id = auth.uid() or public.is_admin());
create policy "notifications_update_own" on public.notifications
for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "notifications_admin_insert" on public.notifications
for insert to authenticated with check (public.is_admin());

create policy "audit_logs_admin_read" on public.audit_logs
for select to authenticated using (public.is_admin());
create policy "audit_logs_actor_insert" on public.audit_logs
for insert to authenticated with check (actor_id = auth.uid() or public.is_admin());

-- Admins should provision users through a trusted server-side route using the Supabase
-- service-role key only on the server. Do not enable public self-registration.
-- Never ship the service-role key to the browser.
