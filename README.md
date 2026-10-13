# Class Management App

A dedicated single-class workspace for admins, teachers, class representatives (CRs), and students.

## Stack
- Next.js App Router + React + TypeScript
- Tailwind CSS v4
- Supabase Auth, PostgreSQL, Row Level Security and Realtime-ready notifications
- Vercel deployment

## Current implementation
- Secure email/password sign-in and sign-out.
- Live, role-aware dashboard backed by Supabase queries.
- Admins can add subjects and provision student/teacher accounts.
- Teachers/admins can create assignments and announcements.
- Students see published class content and only their own attendance records.
- Server-side account provisioning checks the signed-in user's active admin profile.
- Student submission RLS policies prevent students from grading themselves or submitting to unpublished assignments.

## Required Vercel environment variables
Set these in Project Settings → Environment Variables, then redeploy:
- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable key (or legacy anon key).
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service-role key. Never prefix this with `NEXT_PUBLIC_`, never put it in browser code, and never commit it to GitHub. It is used only by the admin account-provisioning API route.

## First administrator setup
Before the dashboard can be used, create the first auth user in Supabase Authentication, then create its profile with role `admin` using the Supabase SQL Editor. Use the auth user's actual UUID and email; do not share passwords or service-role keys in chat. After that, sign in at the deployed website. The admin can provision all other student and teacher accounts from Workspace actions. Public registration is intentionally disabled.

Example profile insert (replace the placeholders with the actual auth user UUID, full name and email):
```sql
insert into public.profiles (id, full_name, email, role, is_active)
values ('AUTH_USER_UUID', 'Admin Full Name', 'admin@example.com', 'admin', true);
```

## Local development
1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add the Supabase URL and publishable/anon key.
5. Run `npm run dev` and open http://localhost:3000.

## Database
The schema migrations are in `supabase/migrations/`. They include role/profile, subject mapping, attendance, assignment/submission, announcement, materials, timetable, notification and audit tables with RLS. Apply any new migration to the dedicated class-management Supabase project before using the corresponding feature.

## Still to build before production
- Full attendance marking workflow and reports.
- Assignment submission upload, grading and feedback UI.
- Admin timetable editor with conflict checks.
- Materials/PDF upload, private storage and signed download URLs.
- Explicit CR permission-management UI.
- Persistent read/unread notification actions and Realtime subscription.
- Automated build, typecheck and role-isolation tests.

## Privacy principles
Students must only access their own attendance, grades and submissions. Student-to-student access is not part of this app. CR permissions are explicit and must never grant teacher impersonation or grade editing by default. Enforce access in PostgreSQL RLS, not only by hiding buttons.
