-- This class meets Monday through Friday only.
-- Remove any existing weekend timetable slots and prevent future weekend entries.
delete from public.timetable_entries
where weekday < 1 or weekday > 5;

alter table public.timetable_entries
  drop constraint if exists timetable_entries_weekday_check;

alter table public.timetable_entries
  add constraint timetable_entries_weekday_check
  check (weekday between 1 and 5);
