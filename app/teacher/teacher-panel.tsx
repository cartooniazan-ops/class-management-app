"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, BookOpen, CalendarDays, ClipboardCheck, FileText, Megaphone, Save } from "lucide-react";

type Subject = { id: string; name: string; description: string | null };
type Assignment = { id: string; title: string; instructions: string | null; subject_id: string; status: string; due_at: string | null; total_marks: number | null; created_at: string; subjects?: { name: string } | null };
type Slot = { id: string; weekday: number; starts_at: string; ends_at: string; room: string | null; subject_id: string; subjects?: { name: string } | null };
type Submission = { id: string; assignment_id: string; student_id: string; answer_text: string | null; file_path: string | null; status: string; marks: number | null; feedback: string | null; submitted_at: string; profiles?: { full_name: string; roll_number: string | null } | null; assignments?: { title: string; total_marks: number | null; subject_id: string; subjects?: { name: string } | null } | null };
type Student = { id: string; full_name: string; roll_number: string | null };
type Props = { teacherId: string; teacherName: string; subjects: Subject[]; assignments: Assignment[]; timetable: Slot[]; submissions: Submission[]; students: Student[] };

const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50";

export default function TeacherPanel({ teacherId, teacherName, subjects, assignments: initialAssignments, timetable, submissions: initialSubmissions, students }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState("overview");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { marks: string; feedback: string; status: string }>>(() => Object.fromEntries(initialSubmissions.map(s => [s.id, { marks: s.marks == null ? "" : String(s.marks), feedback: s.feedback || "", status: s.status === "graded" ? "graded" : "needs_revision" }])));

  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage(""); setError("");
    try { await action(); setMessage("Saved successfully."); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    await run(async () => {
      const subject_id = String(fd.get("subject_id") || "");
      const title = String(fd.get("title") || "").trim();
      if (!subjects.some(s => s.id === subject_id)) throw new Error("Choose a subject assigned to you.");
      if (!title) throw new Error("Assignment title is required.");
      const publish = fd.get("publish") === "on";
      const { data, error } = await supabase.from("assignments").insert({
        teacher_id: teacherId, subject_id, title,
        instructions: String(fd.get("instructions") || "").trim() || null,
        due_at: fd.get("due_at") ? new Date(String(fd.get("due_at"))).toISOString() : null,
        total_marks: fd.get("total_marks") ? Number(fd.get("total_marks")) : null,
        status: publish ? "published" : "draft",
        published_at: publish ? new Date().toISOString() : null
      }).select("id,title,instructions,subject_id,status,due_at,total_marks,created_at").single();
      if (error) throw error;
      setAssignments(old => [{ ...data, subjects: { name: subjects.find(s => s.id === subject_id)?.name || "Subject" } }, ...old]);
      form.reset();
    });
  }

  async function postNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    await run(async () => {
      const title = String(fd.get("title") || "").trim();
      const body = String(fd.get("body") || "").trim();
      if (!title || !body) throw new Error("Enter both a title and notice.");
      const publish = fd.get("publish") === "on";
      const { error } = await supabase.from("announcements").insert({
        title, body, subject_id: String(fd.get("subject_id") || "") || null,
        author_id: teacherId, is_published: publish,
        is_pinned: fd.get("pinned") === "on", published_at: publish ? new Date().toISOString() : null
      });
      if (error) throw error;
      form.reset();
    });
  }

  async function saveGrade(s: Submission) {
    const draft = gradeDrafts[s.id];
    await run(async () => {
      const marks = draft?.marks.trim() ? Number(draft.marks) : null;
      const max = s.assignments?.total_marks;
      if (marks !== null && (!Number.isFinite(marks) || marks < 0 || (max != null && marks > max))) throw new Error(max == null ? "Marks must be zero or higher." : `Marks must be between 0 and ${max}.`);
      const status = draft?.status === "graded" ? "graded" : "needs_revision";
      const { data, error } = await supabase.from("submissions").update({
        marks, feedback: draft?.feedback.trim() || null, status,
        graded_by: status === "graded" ? teacherId : null,
        graded_at: status === "graded" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }).eq("id", s.id).select("id,marks,feedback,status,graded_by,graded_at,updated_at").single();
      if (error) throw error;
      setSubmissions(old => old.map(x => x.id === s.id ? { ...x, ...data } : x));
    });
  }

  async function markAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    await run(async () => {
      const subjectId = String(fd.get("subject_id") || "");
      const sessionDate = String(fd.get("session_date") || "");
      if (!subjects.some(s => s.id === subjectId)) throw new Error("Choose one of your assigned subjects.");
      if (!sessionDate) throw new Error("Choose the attendance date.");
      const { data: session, error: sessionError } = await supabase.from("attendance_sessions").upsert({
        subject_id: subjectId, session_date: sessionDate, starts_at: String(fd.get("starts_at") || "09:00"),
        created_by: teacherId
      }, { onConflict: "subject_id,session_date,starts_at" }).select("id").single();
      if (sessionError) throw sessionError;
      const records = students.map(student => ({
        session_id: session.id, student_id: student.id,
        status: String(fd.get("student_" + student.id) || "present"),
        marked_by: teacherId, marked_at: new Date().toISOString()
      }));
      if (records.length) {
        const { error } = await supabase.from("attendance_records").upsert(records, { onConflict: "session_id,student_id" });
        if (error) throw error;
      }
      form.reset();
    });
  }

  const activeSubmissions = submissions.filter(s => s.status !== "graded");
  const tabs = [
    ["overview", "Overview"], ["assignments", "Assignments"], ["submissions", "Submissions"],
    ["attendance", "Attendance"], ["timetable", "Timetable"], ["notices", "Notices"]
  ];
  return <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><BookOpen size={21}/></span><div><p className="text-xs text-slate-400">Class workspace</p><h1 className="font-extrabold">Teacher panel</h1></div></div>
      <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><ArrowLeft size={15} className="mr-1 inline"/> Dashboard</Link>
    </header>
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Teacher workspace</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome, {teacherName}</h2><p className="mt-2 text-sm text-slate-500">Manage your assigned subjects, assignments, submissions, attendance and class notices.</p></div>
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">{tabs.map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${tab===key?"bg-blue-700 text-white":"text-slate-600 hover:bg-slate-100"}`}>{label}</button>)}</div>
      {tab === "overview" && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[{label:"Assigned subjects",value:subjects.length,icon:BookOpen},{label:"Assignments",value:assignments.length,icon:FileText},{label:"Pending submissions",value:activeSubmissions.length,icon:ClipboardCheck},{label:"Timetable classes",value:timetable.length,icon:CalendarDays}].map(({label,value,icon:Icon})=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="text-blue-700" size={21}/><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-extrabold">{value}</p></div>)}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-3 font-extrabold">My subjects</h3>{subjects.length ? <div className="space-y-2">{subjects.map(s=><div key={s.id} className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{s.name}</p><p className="mt-1 text-xs text-slate-500">{s.description || "No description added."}</p></div>)}</div> : <p className="text-sm text-slate-500">No subjects assigned yet. Ask the admin to assign your subjects.</p>}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-3 font-extrabold">Upcoming timetable</h3>{timetable.length ? <div className="space-y-2">{timetable.slice(0,6).map(t=><div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-bold">{t.subjects?.name || "Class"}</p><p className="text-xs text-slate-500">{days[t.weekday]} · {t.starts_at.slice(0,5)}–{t.ends_at.slice(0,5)}</p></div><span className="text-xs text-slate-500">{t.room || ""}</span></div>)}</div> : <p className="text-sm text-slate-500">No timetable entries yet.</p>}</section>
        </div>
      </>}
      {tab === "assignments" && <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">Assignments</h3>{assignments.length ? <div className="space-y-3">{assignments.map(a=><article key={a.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-bold">{a.title}</h4><p className="mt-1 text-xs text-slate-500">{a.subjects?.name || "Subject"}{a.due_at ? " · Due " + new Date(a.due_at).toLocaleString("en-PK",{dateStyle:"medium",timeStyle:"short"}) : ""}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">{a.status}</span></div>{a.instructions&&<p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{a.instructions}</p>}<p className="mt-2 text-xs text-slate-500">Total marks: {a.total_marks ?? "Not set"}</p></article>)}</div> : <p className="text-sm text-slate-500">No assignments yet.</p>}</div>
        <form onSubmit={createAssignment} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Create assignment</h3><input required name="title" placeholder="Assignment title" className={inputClass}/><select required name="subject_id" className={inputClass} defaultValue=""><option value="" disabled>Choose assigned subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><textarea name="instructions" placeholder="Instructions" className={inputClass+" min-h-24"}/><label className="block text-xs text-slate-500">Deadline<input type="datetime-local" name="due_at" className={inputClass+" mt-1"}/></label><input type="number" min="0" step="0.5" name="total_marks" placeholder="Total marks (optional)" className={inputClass}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish"/> Publish immediately</label><button className={buttonClass} disabled={busy}><Save size={15}/> Save assignment</button></form>
      </section>}
      {tab === "submissions" && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h3 className="font-extrabold">Student submissions</h3><p className="mt-1 text-xs text-slate-500">Review answers, add feedback and mark submissions as graded.</p></div>{submissions.length ? submissions.map(s=><article key={s.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap justify-between gap-2"><div><h4 className="font-bold">{s.profiles?.full_name || "Student"} {s.profiles?.roll_number ? "· "+s.profiles.roll_number : ""}</h4><p className="mt-1 text-xs text-slate-500">{s.assignments?.title || "Assignment"} · {s.assignments?.subjects?.name || "Subject"} · {new Date(s.submitted_at).toLocaleString("en-PK",{dateStyle:"medium",timeStyle:"short"})}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize">{s.status.replace("_"," ")}</span></div>{s.answer_text&&<p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{s.answer_text}</p>}{s.file_path&&<p className="mt-2 break-all text-xs text-blue-700">Attachment path: {s.file_path}</p>}<div className="mt-3 grid gap-3 sm:grid-cols-3"><input type="number" min="0" max={s.assignments?.total_marks ?? undefined} step="0.5" placeholder={s.assignments?.total_marks == null ? "Marks" : "Marks / "+s.assignments.total_marks} className={inputClass} value={gradeDrafts[s.id]?.marks ?? ""} onChange={e=>setGradeDrafts(old=>({...old,[s.id]:{...old[s.id],marks:e.target.value}}))}/><input placeholder="Feedback for student" className={inputClass+" sm:col-span-1"} value={gradeDrafts[s.id]?.feedback ?? ""} onChange={e=>setGradeDrafts(old=>({...old,[s.id]:{...old[s.id],feedback:e.target.value}}))}/><select className={inputClass} value={gradeDrafts[s.id]?.status ?? "needs_revision"} onChange={e=>setGradeDrafts(old=>({...old,[s.id]:{...old[s.id],status:e.target.value}}))}><option value="graded">Mark graded</option><option value="needs_revision">Needs revision</option></select></div><button className={buttonClass+" mt-3"} disabled={busy} onClick={()=>saveGrade(s)}><Save size={15}/> Save feedback / grade</button></article>) : <p className="text-sm text-slate-500">No submissions for your assigned subjects yet.</p>}</section>}
      {tab === "attendance" && <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Attendance workflow</h3><p className="mt-2 text-sm leading-6 text-slate-500">Choose a subject and date, then mark each active student. The session and records are saved to the class database.</p><p className="mt-3 text-xs text-slate-500">Student roster available to this account: {students.length}</p></div><form onSubmit={markAttendance} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Mark attendance</h3><select required name="subject_id" className={inputClass} defaultValue=""><option value="" disabled>Choose assigned subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input required type="date" name="session_date" defaultValue={new Date().toLocaleDateString("en-CA")} className={inputClass}/><label className="block text-xs text-slate-500">Class start time<input type="time" name="starts_at" defaultValue="09:00" className={inputClass+" mt-1"}/></label><div className="max-h-80 space-y-2 overflow-auto">{students.map(s=><label key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span>{s.full_name}{s.roll_number ? " · "+s.roll_number : ""}</span><select name={"student_"+s.id} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select></label>)}</div>{students.length ? <button className={buttonClass} disabled={busy}><ClipboardCheck size={15}/> Save attendance</button> : <p className="text-xs text-amber-700">No student roster is available. Ensure the admin has assigned at least one subject to you.</p>}</form></section>}
      {tab === "timetable" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">My timetable</h3>{timetable.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{timetable.map(t=><article key={t.id} className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{days[t.weekday]}</p><h4 className="mt-2 font-bold">{t.subjects?.name || "Class"}</h4><p className="mt-1 text-sm text-slate-600">{t.starts_at.slice(0,5)}–{t.ends_at.slice(0,5)}</p><p className="mt-1 text-xs text-slate-500">{t.room || "Room not set"}</p></article>)}</div> : <p className="text-sm text-slate-500">No timetable entries assigned.</p>}</section>}
      {tab === "notices" && <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Publish a class notice</h3><p className="mt-2 text-sm leading-6 text-slate-500">Notices can be linked to a subject or sent to the whole class.</p></div><form onSubmit={postNotice} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">New notice</h3><input required name="title" placeholder="Notice title" className={inputClass}/><select name="subject_id" className={inputClass} defaultValue=""><option value="">Whole class</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><textarea required name="body" placeholder="Write the notice…" className={inputClass+" min-h-28"}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" defaultChecked/> Publish now</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned"/> Pin notice</label><button className={buttonClass} disabled={busy}><Megaphone size={15}/> Save notice</button></form></section>}
      <footer className="border-t border-slate-200 py-5 text-xs text-slate-400">Classroom · Teacher tools are scoped to assigned subjects and Supabase permissions.</footer>
    </div>
  </main>;
}
