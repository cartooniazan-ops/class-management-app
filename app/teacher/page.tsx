import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TeacherPanel from "./teacher-panel";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function TeacherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect("/");
  if (profile.role !== "teacher" && profile.role !== "admin") redirect("/");

  const [
    { data: subjectRows },
    { data: assignmentRows },
    { data: timetableRows },
    { data: submissionRows },
    { data: studentRows }
  ] = await Promise.all([
    supabase.from("teacher_subjects")
      .select("subject_id,subjects(id,name,description)")
      .eq("teacher_id", user.id),
    supabase.from("assignments")
      .select("id,title,instructions,subject_id,status,due_at,total_marks,created_at,subjects(name)")
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("timetable_entries")
      .select("id,weekday,starts_at,ends_at,room,subject_id,subjects(name)")
      .gte("weekday", 1).lte("weekday", 5)
      .eq("teacher_id", user.id).eq("is_cancelled", false)
      .order("weekday").order("starts_at").limit(100),
    supabase.from("submissions")
      .select("id,assignment_id,student_id,answer_text,file_path,status,marks,feedback,submitted_at,profiles:student_id(full_name,roll_number),assignments(title,total_marks,subject_id,subjects(name))")
      .order("submitted_at", { ascending: false }).limit(200),
    supabase.from("profiles")
      .select("id,full_name,roll_number")
      .eq("role", "student").eq("is_active", true)
      .order("full_name").limit(500)
  ]);

  const subjects = (subjectRows || []).map((row: Row) => relation(row.subjects)).filter(Boolean);
  const assignedIds = new Set(subjects.map((subject: Row) => subject.id));
  const assignments = (assignmentRows || [])
    .filter((a: Row) => a.teacher_id === user.id || assignedIds.has(a.subject_id))
    .map((a: Row) => ({ ...a, subjects: relation(a.subjects) }));
  const submissions = (submissionRows || [])
    .map((s: Row) => ({ ...s, profiles: relation(s.profiles), assignments: relation(s.assignments) }))
    .filter((s: Row) => s.assignments && assignedIds.has(s.assignments.subject_id));
  const timetable = (timetableRows || []).map((t: Row) => ({ ...t, subjects: relation(t.subjects) }));

  return <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><GraduationCap size={22}/></span><div><p className="text-xs text-slate-400">Class workspace</p><h1 className="font-extrabold">Teacher panel</h1></div></div>
      <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><ArrowLeft size={15} className="mr-1 inline"/> Dashboard</Link>
    </header>
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <TeacherPanel
        teacherId={user.id}
        teacherName={profile.full_name || "Teacher"}
        subjects={subjects as any[]}
        assignments={assignments as any[]}
        timetable={timetable as any[]}
        submissions={submissions as any[]}
        students={(studentRows || []) as any[]}
      />
    </div>
  </main>;
}
