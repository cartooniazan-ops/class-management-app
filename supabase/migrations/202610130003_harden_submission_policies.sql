-- Applied in the dedicated Supabase project as migration harden_submission_policies.
-- Students can submit only to published assignments and cannot set grading fields.
drop policy if exists "submissions_student_update_own_ungraded" on public.submissions;
create policy "submissions_student_update_own_ungraded" on public.submissions
for update to authenticated
using (student_id = auth.uid() and status in ('submitted'::public.submission_status, 'needs_revision'::public.submission_status))
with check (student_id = auth.uid() and status in ('submitted'::public.submission_status, 'needs_revision'::public.submission_status) and marks is null and feedback is null and graded_by is null and graded_at is null);
drop policy if exists "submissions_student_insert_own" on public.submissions;
create policy "submissions_student_insert_own" on public.submissions
for insert to authenticated with check (student_id = auth.uid() and status = 'submitted'::public.submission_status and marks is null and feedback is null and graded_by is null and graded_at is null and exists (select 1 from public.assignments a where a.id = assignment_id and a.status = 'published'::public.assignment_status));
