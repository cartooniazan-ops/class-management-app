# Class Management App

A dedicated single-class workspace for admins, teachers, class representatives (CRs), and students.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4
- Supabase Auth, PostgreSQL, Storage and Realtime
- Vercel deployment

## Current state

The first commit provides a responsive dashboard preview, environment template, Supabase client helper, and the initial database/security migration. Dashboard figures and timetable entries are **sample presentation content**, not live class records. Authentication and role-specific data workflows must be connected before production use.

## Local setup

1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase project URL and public anon/publishable key.
5. Run `npm run dev` and open http://localhost:3000.

Never put a Supabase service-role key in browser code or commit secrets to GitHub.

## Database

Apply `supabase/migrations/202610130001_initial_schema.sql` to the new Supabase project using the SQL Editor or Supabase CLI. The migration creates role/profile, subject mapping, attendance, assignment/submission, announcement, materials, timetable, notification and audit tables, with Row Level Security policies. Review the policies against your institution's rules before production deployment.

## Required next implementation steps

- Add admin-provisioned account creation and role-aware login/logout.
- Build server-side authorization for admin, teacher, CR and student routes.
- Connect dashboards to RLS-protected data queries.
- Add private Storage buckets and signed URLs for PDFs/submissions.
- Add realtime notification subscriptions and persistent read/unread state.
- Add automated typecheck/build checks and end-to-end role-isolation tests.

## Privacy principles

Students must only access their own attendance, grades and submissions. Student-to-student access is not part of this app. CR permissions are explicit and should never grant teacher impersonation or grade editing by default. Keep student roster visibility restricted to authorized teachers/admins and enforce access in PostgreSQL RLS, not only in the UI.
