import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id,full_name,role,is_active").eq("id", user.id).maybeSingle();
  if (!profile || !profile.is_active) redirect("/");
  if (profile.role !== "admin") redirect("/");

  const [
    { data: profiles }, { data: subjects }, { data: teachers },
    { data: timetable }, { data: crPermissions }, { data: settings }, { data: teacherAssignments }
  ] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,role,is_active,roll_number,created_at").order("role").order("full_name").limit(500),
    supabase.from("subjects").select("id,name,description").order("name"),
    supabase.from("profiles").select("id,full_name,email").eq("role","teacher").eq("is_active",true).order("full_name"),
    supabase.from("timetable_entries").select("id,subject_id,teacher_id,weekday,starts_at,ends_at,room,valid_from,valid_until,is_cancelled,subjects(name),profiles:teacher_id(full_name)").order("weekday").order("starts_at").limit(300),
    supabase.from("cr_permissions").select("student_id,can_post_announcements,can_manage_timetable,can_manage_attendance,can_manage_assignments,granted_by,granted_at"),
    supabase.from("class_settings").select("id,class_name,academic_year,timezone").order("updated_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("teacher_subjects").select("teacher_id,subject_id,profiles:teacher_id(full_name),subjects(name)")
  ]);

  const normalizedTimetable = (timetable || []).map((slot) => ({
    ...slot,
    subjects: Array.isArray(slot.subjects) ? (slot.subjects[0] ?? null) : slot.subjects,
    profiles: Array.isArray(slot.profiles) ? (slot.profiles[0] ?? null) : slot.profiles,
  }));

  return <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><GraduationCap size={22}/></span><div><p className="text-xs text-slate-400">Class workspace</p><h1 className="font-extrabold">Admin control panel</h1></div></div>
      <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><ArrowLeft size={15} className="mr-1 inline"/> Dashboard</Link>
    </header>
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Administrator</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Manage your class</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Manage accounts, subjects, teacher assignments, timetable publishing, CR permissions and class settings from one place.</p></div>
      <AdminPanel
        adminId={user.id}
        initialProfiles={profiles || []}
        initialSubjects={subjects || []}
        initialTeacherAssignments={(teacherAssignments || []).map((a) => ({ ...a, profiles: Array.isArray(a.profiles) ? (a.profiles[0] ?? null) : a.profiles, subjects: Array.isArray(a.subjects) ? (a.subjects[0] ?? null) : a.subjects }))}
        initialTeachers={teachers || []}
        initialTimetable={normalizedTimetable}
        initialCrPermissions={crPermissions || []}
        initialSettings={settings || null}
      />
      <footer className="border-t border-slate-200 py-5 text-xs text-slate-400">Classroom · Admin tools are protected by account role and Supabase RLS.</footer>
    </div>
  </main>;
}
