import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentPanel from "./student-panel";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function StudentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,role,is_active,roll_number")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect("/");
  if (profile.role !== "student") redirect("/");

  const [
    { data: assignmentRows },
    { data: submissionRows },
    { data: attendanceRows },
    { data: materialRows },
    { data: announcementRows },
    { data: timetableRows },
    { data: notificationRows }
  ] = await Promise.all([
    supabase.from("assignments")
      .select("id,title,instructions,subject_id,due_at,total_marks,status,published_at,subjects(name)")
      .eq("status", "published").order("due_at", { ascending: true }).limit(200),
    supabase.from("submissions")
      .select("id,assignment_id,student_id,answer_text,status,marks,feedback,submitted_at,updated_at,assignments(title,total_marks,subject_id,subjects(name))")
      .eq("student_id", user.id).order("submitted_at", { ascending: false }).limit(200),
    supabase.from("attendance_records")
      .select("id,status,session_id,attendance_sessions(session_date,starts_at,subject_id,subjects(name))")
      .eq("student_id", user.id).order("marked_at", { ascending: false }).limit(300),
    supabase.from("materials")
      .select("id,title,description,kind,storage_path,subject_id,created_at,subjects(name)")
      .eq("is_published", true).order("created_at", { ascending: false }).limit(200),
    supabase.from("announcements")
      .select("id,title,body,subject_id,is_pinned,published_at,created_at")
      .eq("is_published", true).order("is_pinned", { ascending: false }).order("published_at", { ascending: false }).limit(100),
    supabase.from("timetable_entries")
      .select("id,weekday,starts_at,ends_at,room,subject_id,subjects(name)")
      .gte("weekday", 1).lte("weekday", 5)
      .eq("is_cancelled", false).order("weekday").order("starts_at").limit(100),
    supabase.from("notifications")
      .select("id,title,body,kind,read_at,created_at,target_path")
      .eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(100)
  ]);

  const assignments = (assignmentRows || []).map((a: Row) => ({ ...a, subjects: relation(a.subjects) }));
  const submissions = (submissionRows || []).map((s: Row) => ({
    ...s, assignments: relation(s.assignments)
      ? { ...relation(s.assignments), subjects: relation(relation(s.assignments)?.subjects) }
      : null
  }));
  const attendance = (attendanceRows || []).map((a: Row) => ({
    ...a, attendance_sessions: relation(a.attendance_sessions)
      ? { ...relation(a.attendance_sessions), subjects: relation(relation(a.attendance_sessions)?.subjects) }
      : null
  }));
  const materials = (materialRows || []).map((m: Row) => ({ ...m, subjects: relation(m.subjects) }));
  const announcements = announcementRows || [];
  const timetable = (timetableRows || []).map((t: Row) => ({ ...t, subjects: relation(t.subjects) }));

  return <StudentPanel
    studentId={user.id}
    studentName={profile.full_name || "Student"}
    rollNumber={profile.roll_number}
    assignments={assignments}
    submissions={submissions}
    attendance={attendance}
    materials={materials}
    announcements={announcements}
    timetable={timetable}
    notifications={notificationRows || []}
  />;
}
