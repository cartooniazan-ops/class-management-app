"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, ClipboardCheck, FileText, Megaphone, Bell, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Row = Record<string, any>;
type Props = {
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  assignments: Row[];
  submissions: Row[];
  attendance: Row[];
  materials: Row[];
  announcements: Row[];
  timetable: Row[];
  notifications: Row[];
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50";
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentPanel(props: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(props.submissions.map((s: Row) => [s.assignment_id, s.answer_text || ""]))
  );
  const [submissions, setSubmissions] = useState<Row[]>(props.submissions);
  const [notifications, setNotifications] = useState<Row[]>(props.notifications);

  async function submitAssignment(event: FormEvent<HTMLFormElement>, assignment: Row) {
    event.preventDefault();
    const answer = (answers[assignment.id] || "").trim();
    if (!answer) {
      setError("Please write your answer before submitting.");
      setMessage("");
      return;
    }
    setBusy(assignment.id);
    setError("");
    setMessage("");
    try {
      const existing = submissions.find((s) => s.assignment_id === assignment.id);
      const payload = {
        assignment_id: assignment.id,
        student_id: props.studentId,
        answer_text: answer,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const result = existing
        ? await supabase.from("submissions").update(payload).eq("id", existing.id).select("id,assignment_id,student_id,answer_text,status,marks,feedback,submitted_at").single()
        : await supabase.from("submissions").insert(payload).select("id,assignment_id,student_id,answer_text,status,marks,feedback,submitted_at").single();
      if (result.error) throw result.error;
      setSubmissions((old) => {
        const without = old.filter((s) => s.assignment_id !== assignment.id);
        return [{ ...result.data, assignments: assignment }, ...without];
      });
      setMessage("Assignment answer submitted successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the assignment. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function markRead(id: string) {
    setBusy(id);
    setError("");
    try {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setNotifications((old) => old.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update notification.");
    } finally {
      setBusy(null);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;
  const tabs = [
    ["overview", "Overview"], ["assignments", "Assignments"], ["grades", "My grades"],
    ["attendance", "Attendance"], ["materials", "Study materials"], ["timetable", "Timetable"],
    ["notices", "Notices"], ["notifications", "Notifications"]
  ];

  return <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><BookOpen size={21}/></span><div><p className="text-xs text-slate-400">Class workspace</p><h1 className="font-extrabold">Student panel</h1></div></div>
      <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><ArrowLeft size={15} className="mr-1 inline"/> Dashboard</Link>
    </header>
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Student workspace</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome, {props.studentName}</h2><p className="mt-2 text-sm text-slate-500">Your assignments, grades, attendance and class updates in one place.</p>{props.rollNumber && <p className="mt-2 text-xs font-semibold text-slate-500">Roll number: {props.rollNumber}</p>}</div>
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="break-words rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">{tabs.map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${tab === key ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}{key === "notifications" && unreadCount > 0 ? ` · ${unreadCount}` : ""}</button>)}</div>
      {tab === "overview" && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[{label:"Available assignments",value:props.assignments.length,icon:FileText},{label:"Submitted work",value:submissions.length,icon:Send},{label:"Graded assignments",value:gradedCount,icon:ClipboardCheck},{label:"Unread notifications",value:unreadCount,icon:Bell}].map(({label,value,icon:Icon})=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="text-blue-700" size={21}/><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-extrabold">{value}</p></div>)}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-3 font-extrabold">Upcoming assignments</h3>{props.assignments.length ? <div className="space-y-2">{props.assignments.slice(0,5).map((a: Row)=><div key={a.id} className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{a.title}</p><p className="mt-1 text-xs text-slate-500">{a.subjects?.name || "Class"}{a.due_at ? " · Due " + new Date(a.due_at).toLocaleString("en-PK",{dateStyle:"medium",timeStyle:"short"}) : ""}</p></div>)}</div> : <p className="text-sm text-slate-500">No published assignments right now.</p>}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-3 font-extrabold">Latest notices</h3>{props.announcements.length ? <div className="space-y-3">{props.announcements.slice(0,4).map((n: Row)=><article key={n.id} className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{n.title}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{n.body}</p></article>)}</div> : <p className="text-sm text-slate-500">No published notices yet.</p>}</section>
        </div>
      </>}
      {tab === "assignments" && <section className="space-y-4">{props.assignments.length ? props.assignments.map((a: Row)=>{const sub = submissions.find((s) => s.assignment_id === a.id); const locked = sub?.status === "graded"; return <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold">{a.title}</h3><p className="mt-1 text-xs text-slate-500">{a.subjects?.name || "Class"}{a.due_at ? " · Due " + new Date(a.due_at).toLocaleString("en-PK",{dateStyle:"medium",timeStyle:"short"}) : ""}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{locked ? "Graded" : sub ? "Submitted" : "Not submitted"}</span></div>{a.instructions && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{a.instructions}</p>}<form onSubmit={(e)=>submitAssignment(e,a)} className="mt-4 space-y-3"><textarea value={answers[a.id] || ""} onChange={(e)=>setAnswers(old=>({...old,[a.id]:e.target.value}))} disabled={locked || busy === a.id} placeholder="Write your answer here…" className={inputClass+" min-h-28"} /><button disabled={locked || busy === a.id} className={buttonClass}><Send size={15}/>{busy === a.id ? "Submitting…" : sub ? "Update submission" : "Submit answer"}</button>{locked && <p className="text-xs text-slate-500">This submission has been graded. Contact your teacher if you need a correction.</p>}</form></article>}) : <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No published assignments are available yet.</section>}</section>}
      {tab === "grades" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">My grades and feedback</h3>{submissions.length ? <div className="space-y-3">{submissions.map((s: Row)=><article key={s.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-bold">{s.assignments?.title || "Assignment"}</h4><p className="mt-1 text-xs text-slate-500">{s.assignments?.subjects?.name || "Class"} · Submitted {new Date(s.submitted_at).toLocaleDateString("en-PK")}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{String(s.status).replace("_"," ")}</span></div>{s.status === "graded" ? <><p className="mt-3 text-2xl font-extrabold text-blue-700">{s.marks ?? "—"} <span className="text-sm font-semibold text-slate-500">/ {s.assignments?.total_marks ?? "marks"}</span></p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{s.feedback || "No written feedback."}</p></> : <p className="mt-3 text-sm text-slate-500">Your teacher has not graded this submission yet.</p>}</article>)}</div> : <p className="text-sm text-slate-500">Your submissions and grades will appear here.</p>}</section>}
      {tab === "attendance" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">My attendance records</h3>{props.attendance.length ? <div className="space-y-2">{props.attendance.map((a: Row)=><article key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold">{a.subjects?.name || "Class session"}</p><p className="mt-1 text-xs text-slate-500">{a.attendance_sessions?.session_date || "Date not available"}{a.attendance_sessions?.starts_at ? " · " + String(a.attendance_sessions.starts_at).slice(0,5) : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${a.status === "present" ? "bg-emerald-50 text-emerald-700" : a.status === "absent" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{a.status}</span></article>)}</div> : <p className="text-sm text-slate-500">No attendance records have been saved for you yet.</p>}</section>}
      {tab === "materials" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">Study materials</h3>{props.materials.length ? <div className="grid gap-3 sm:grid-cols-2">{props.materials.map((m: Row)=><article key={m.id} className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{m.kind}</p><h4 className="mt-2 font-bold">{m.title}</h4><p className="mt-1 text-xs text-slate-500">{m.subjects?.name || "Subject"}</p>{m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}<p className="mt-3 break-all text-xs text-slate-400">File access is available once the secure download link is configured.</p></article>)}</div> : <p className="text-sm text-slate-500">Published PDFs, notes and books will appear here when teachers share them.</p>}</section>}
      {tab === "timetable" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">Class timetable</h3>{props.timetable.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{props.timetable.map((t: Row)=><article key={t.id} className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{dayNames[t.weekday]}</p><h4 className="mt-2 font-bold">{t.subjects?.name || "Class"}</h4><p className="mt-1 text-sm text-slate-600">{String(t.starts_at).slice(0,5)}–{String(t.ends_at).slice(0,5)}</p><p className="mt-1 text-xs text-slate-500">{t.room || "Room not set"}</p></article>)}</div> : <p className="text-sm text-slate-500">No timetable entries yet.</p>}</section>}
      {tab === "notices" && <section className="space-y-3">{props.announcements.length ? props.announcements.map((n: Row)=><article key={n.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-extrabold">{n.title}</h3>{n.is_pinned && <span className="text-xs font-bold text-blue-700">PINNED</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{n.body}</p><p className="mt-3 text-xs text-slate-400">{n.published_at ? new Date(n.published_at).toLocaleString("en-PK") : ""}</p></article>) : <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No published notices yet.</p>}</section>}
      {tab === "notifications" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-extrabold">Notifications</h3>{notifications.length ? <div className="space-y-2">{notifications.map((n: Row)=><article key={n.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-xl p-4 ${n.read_at ? "bg-slate-50" : "bg-blue-50"}`}><div><h4 className="font-bold">{n.title}</h4><p className="mt-1 text-sm text-slate-600">{n.body}</p><p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString("en-PK")}</p></div>{!n.read_at && <button disabled={busy === n.id} onClick={()=>markRead(n.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold">Mark read</button>}</article>)}</div> : <p className="text-sm text-slate-500">No notifications yet.</p>}</section>}
      <footer className="border-t border-slate-200 py-5 text-xs text-slate-400">Classroom · Your personal student workspace</footer>
    </div>
  </main>;
}
