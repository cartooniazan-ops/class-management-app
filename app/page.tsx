import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BookOpen, CalendarDays, ClipboardCheck, FileText, GraduationCap, Megaphone, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardTools from "./dashboard-tools";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function Panel({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: any }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800"><Icon size={17} className="text-blue-700"/>{title}</h2>{children}</section>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">{children}</p>;
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id,full_name,email,role,is_active,roll_number").eq("id", user.id).maybeSingle();

  if (!profile || !profile.is_active) {
    return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mt-16 max-w-xl rounded-2xl border bg-white p-8"><GraduationCap className="mb-4 text-blue-700" size={32}/><h1 className="text-2xl font-extrabold">Your class account is not ready</h1><p className="mt-3 text-sm leading-6 text-slate-600">You are signed in, but an administrator has not activated your class profile yet. Ask your class administrator to provision your account. Public sign-up is disabled.</p><form action="/auth/signout" method="post" className="mt-6"><button className="rounded-xl border px-4 py-2 text-sm font-semibold">Sign out</button></form></div></main>;
  }

  const role = profile.role as string;
  const [{ data: subjects }, { data: assignments }, { data: announcements }, { data: timetable }, { data: notifications }, { data: attendance }] = await Promise.all([
    supabase.from("subjects").select("id,name,description").order("name").limit(100),
    supabase.from("assignments").select("id,title,status,due_at,total_marks,subject_id,teacher_id,subjects(name)").order("created_at",{ascending:false}).limit(8),
    supabase.from("announcements").select("id,title,body,is_pinned,published_at,created_at").or("is_published.eq.true,author_id.eq."+user.id).order("created_at",{ascending:false}).limit(6),
    supabase.from("timetable_entries").select("id,weekday,starts_at,ends_at,room,is_cancelled,subjects(name)").eq("is_cancelled",false).order("weekday").order("starts_at").limit(8),
    supabase.from("notifications").select("id,title,body,read_at,created_at,target_path").eq("recipient_id",user.id).order("created_at",{ascending:false}).limit(5),
    supabase.from("attendance_records").select("id,status,session_id").eq("student_id",user.id).limit(200),
  ]);

  const { count: studentCount } = role === "admin" || role === "teacher"
    ? await supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","student").eq("is_active",true)
    : { count: null };
  const { count: teacherCount } = role === "admin"
    ? await supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","teacher").eq("is_active",true)
    : { count: null };
  const { count: pendingCount } = role === "teacher" || role === "admin"
    ? await supabase.from("submissions").select("id",{count:"exact",head:true}).eq("status","submitted")
    : { count: null };
  const unread = (notifications || []).filter((n: Row) => !n.read_at).length;
  const greeting = profile.full_name?.split(" ")[0] || "there";
  const nav = [
    { href:"#assignments", label:"Assignments", icon:FileText },
    { href:"#attendance", label:"Attendance", icon:ClipboardCheck },
    { href:"#timetable", label:"Timetable", icon:CalendarDays },
    { href:"#announcements", label:"Announcements", icon:Megaphone },
    { href:"#subjects", label:"Subjects", icon:BookOpen },
    { href:"#notifications", label:"Notifications", icon:Bell },
  ];

  return <main className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:flex">
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-700 text-white"><GraduationCap size={22}/></span><span><strong className="block text-base">Classroom</strong><small className="text-[10px] font-bold tracking-widest text-slate-400">CLASS MANAGEMENT</small></span></Link>
      <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-slate-400">YOUR WORKSPACE</p>
      <nav className="space-y-1">{nav.map(({href,label,icon:Icon})=><a key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700"><Icon size={17}/>{label}</a>)}</nav>
      {(role==="admin" || role==="teacher") && <div className="mt-7 rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold text-blue-900">Teaching tools</p><p className="mt-1 text-xs leading-5 text-blue-800/75">Create assignments and share updates with your class.</p></div>}
      <div className="mt-auto border-t border-slate-100 pt-4"><p className="truncate text-sm font-bold">{profile.full_name}</p><p className="mt-1 text-xs capitalize text-slate-500">{role}{profile.roll_number ? " · "+profile.roll_number : ""}</p><form action="/auth/signout" method="post" className="mt-4"><button className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Sign out</button></form></div>
    </aside>
    <section className="min-w-0 flex-1">
      <header className="sticky top-0 z-10 flex min-h-[70px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8"><div><p className="text-xs text-slate-400">Class workspace</p><h1 className="text-lg font-extrabold">Overview</h1></div><div className="flex items-center gap-3"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold capitalize text-blue-700">{role}</span><span className="relative rounded-xl border border-slate-200 p-2 text-slate-600"><Bell size={18}/>{unread>0&&<span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unread}</span>}</span></div></header>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Connected workspace</span><h2 className="mt-3 text-3xl font-extrabold tracking-tight">Welcome, {greeting} 👋</h2><p className="mt-2 text-sm text-slate-500">Your class information below is loaded from the connected database.</p></div><p className="text-xs text-slate-400">Signed in as {profile.email || user.email}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[{label:"Subjects",value:subjects?.length ?? 0,icon:BookOpen},{label:"Assignments",value:assignments?.length ?? 0,icon:FileText},{label:role==="student"?"My attendance records":"Active students",value:role==="student"?(attendance?.length ?? 0):(studentCount ?? "—"),icon:Users},{label:role==="student"?"Unread notifications":"Pending reviews",value:role==="student"?unread:(pendingCount ?? "—"),icon:Bell}].map(({label,value,icon:Icon})=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={19}/></span><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-extrabold">{value}</p></div>)}
        </div>
        <DashboardTools role={role} userId={user.id} subjects={subjects || []}/>
        <div className="grid gap-6 xl:grid-cols-2">
          <div id="assignments"><Panel title="Assignments" icon={FileText}>{assignments?.length ? <div className="divide-y divide-slate-100">{assignments.map((a:Row)=><div key={a.id} className="flex items-start justify-between gap-3 py-3 first:pt-0"><div><p className="font-semibold">{a.title}</p><p className="mt-1 text-xs text-slate-500">{a.subjects?.name || "Class assignment"}{a.due_at ? " · Due "+new Date(a.due_at).toLocaleString("en-PK",{dateStyle:"medium",timeStyle:"short"}) : ""}</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold capitalize">{a.status}</span></div>)}</div>:<Empty>No assignments are available to your account yet.</Empty>}</Panel></div>
          <div id="announcements"><Panel title="Announcements" icon={Megaphone}>{announcements?.length ? <div className="space-y-3">{announcements.map((a:Row)=><article key={a.id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold">{a.title}</h3>{a.is_pinned&&<span className="text-[10px] font-bold text-blue-700">PINNED</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{a.body}</p><p className="mt-2 text-[10px] text-slate-400">{a.published_at?new Date(a.published_at).toLocaleDateString():"Draft"}</p></article>)}</div>:<Empty>No published announcements yet.</Empty>}</Panel></div>
          <div id="subjects"><Panel title="Subjects" icon={BookOpen}>{subjects?.length ? <div className="grid gap-3 sm:grid-cols-2">{subjects.map((s:Row)=><div key={s.id} className="rounded-xl border border-slate-100 p-4"><p className="font-bold">{s.name}</p><p className="mt-1 text-xs text-slate-500">{s.description || "No description added."}</p></div>)}</div>:<Empty>No subjects have been added yet.</Empty>}</Panel></div>
          <div id="timetable"><Panel title="Timetable" icon={CalendarDays}>{timetable?.length ? <div className="space-y-3">{timetable.map((t:Row)=><div key={t.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][t.weekday]}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{t.subjects?.name || "Class"}</p><p className="text-xs text-slate-500">{String(t.starts_at).slice(0,5)}–{String(t.ends_at).slice(0,5)}{t.room?" · "+t.room:""}</p></div></div>)}</div>:<Empty>No timetable entries have been published.</Empty>}</Panel></div>
          <div id="attendance"><Panel title="My attendance" icon={ClipboardCheck}>{role==="student" ? <div className="space-y-2">{attendance?.length ? attendance.slice(0,8).map((a:Row)=><div key={a.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>Attendance record</span><span className="font-bold capitalize">{a.status}</span></div>):<Empty>No attendance records yet.</Empty>}</div>:<p className="text-sm text-slate-500">Attendance is private. Students can see only their own records; authorized teachers and admins manage class attendance through the attendance workflow.</p>}</Panel></div>
          <div id="notifications"><Panel title="Recent notifications" icon={Bell}>{notifications?.length ? <div className="space-y-2">{notifications.map((n:Row)=><div key={n.id} className={`rounded-xl p-3 ${n.read_at?"bg-slate-50":"bg-blue-50"}`}><p className="text-sm font-bold">{n.title}</p><p className="mt-1 text-xs text-slate-500">{n.body}</p></div>)}</div>:<Empty>You’re all caught up. New notifications will appear here.</Empty>}</Panel></div>
          <div><Panel title="Role & permissions" icon={ShieldCheck}><p className="text-sm leading-6 text-slate-600">This account has the <strong className="capitalize">{role}</strong> role. Access to records is enforced by Supabase row-level security, not just by hiding buttons in the interface.</p>{role==="admin"&&<p className="mt-3 text-xs text-slate-500">Use the admin tools above to add subjects and provision accounts.</p>}</Panel></div>
        </div>
        <footer className="border-t border-slate-200 py-5 text-xs text-slate-400">Classroom · Secure class workspace</footer>
      </div>
    </section>
  </main>;
}
