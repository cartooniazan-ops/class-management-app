import {
  ArrowDownRight, ArrowUpRight, Bell, BookOpen, CalendarDays, CheckCheck,
  ChevronDown, ClipboardCheck, Clock3, FileText, GraduationCap, LayoutDashboard,
  LifeBuoy, Megaphone, MoreHorizontal, Plus, Search, Settings2, ShieldCheck,
  Users, UserRound, BookMarked
} from "lucide-react";

const navGroups = [
  { title: "WORKSPACE", items: [
    { label: "Overview", icon: LayoutDashboard, active: true },
    { label: "Attendance", icon: ClipboardCheck },
    { label: "Assignments", icon: FileText },
    { label: "Class timetable", icon: CalendarDays },
    { label: "Books & notes", icon: BookOpen },
  ]},
  { title: "CLASS COMMUNITY", items: [
    { label: "Students & teachers", icon: Users },
    { label: "Announcements", icon: Megaphone },
    { label: "Class representative", icon: ShieldCheck },
  ]},
];

const tasks = [
  { subject: "Physics", title: "Chapter 04 — Numerical problems", due: "Today, 11:59 PM", status: "Due soon", tone: "amber", initials: "PH", color: "violet" },
  { subject: "Computer Science", title: "Database design worksheet", due: "Tomorrow, 02:00 PM", status: "In progress", tone: "blue", initials: "CS", color: "blue" },
  { subject: "English", title: "Argumentative essay draft", due: "Friday, 09:00 AM", status: "New", tone: "green", initials: "EN", color: "green" },
];

const events = [
  { day: "13", month: "OCT", title: "Computer Science", meta: "09:00 – 09:45 AM · Room 12", color: "blue" },
  { day: "13", month: "OCT", title: "Physics", meta: "10:00 – 10:45 AM · Lab 2", color: "violet" },
  { day: "13", month: "OCT", title: "English Language", meta: "11:15 – 12:00 PM · Room 12", color: "green" },
];

function SectionTitle({ children, action }: { children: React.ReactNode; action?: string }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-800">{children}</h2>{action && <button className="text-xs font-semibold text-blue-700 hover:text-blue-900">{action}</button>}</div>;
}

export default function Home() {
  return (
    <main className="min-h-screen lg:flex">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <a href="#" className="mb-9 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm"><GraduationCap size={22} /></span>
          <span><span className="block text-[15px] font-extrabold tracking-tight">Classroom</span><span className="text-[11px] font-medium text-slate-400">CLASS MANAGEMENT</span></span>
        </a>
        {navGroups.map((group) => <div className="mb-7" key={group.title}>
          <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">{group.title}</p>
          <nav className="space-y-1">{group.items.map((item) => {
            const Icon = item.icon;
            return <a key={item.label} href="#" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${item.active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={17} strokeWidth={1.9} />{item.label}{item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}</a>;
          })}</nav>
        </div>)}
        <div className="mt-auto rounded-2xl bg-slate-50 p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm"><LifeBuoy size={18}/></div>
          <p className="text-sm font-bold">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Check the setup guide to connect your class workspace.</p>
          <a href="https://github.com/cartooniazan-ops/class-management-app" className="mt-3 inline-block text-xs font-bold text-blue-700">View setup guide ↗</a>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 lg:hidden"><GraduationCap size={20}/></div>
            <div><p className="text-xs font-medium text-slate-400">Monday, October 13, 2026</p><h1 className="text-lg font-extrabold tracking-[-0.03em] sm:text-xl">Class overview</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button aria-label="Search" className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs text-slate-400 sm:flex"><Search size={15}/> Search anything <kbd className="ml-4 rounded border border-slate-200 px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button>
            <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><Bell size={18}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500"/></button>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe8ff] text-xs font-extrabold text-blue-800">AD</div><div className="hidden sm:block"><p className="text-xs font-bold">Class Admin</p><p className="text-[11px] text-slate-400">Administrator</p></div><ChevronDown size={14} className="hidden text-slate-400 sm:block"/></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><div className="mb-2 flex items-center gap-2"><span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Class workspace</span><span className="text-xs text-slate-400">• Setup preview</span></div><h2 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-[30px]">Good morning, Admin <span>✦</span></h2><p className="mt-2 text-sm text-slate-500">Here’s what’s happening with your class today.</p></div>
            <div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"><CalendarDays size={15}/> This week <ChevronDown size={14}/></button><button className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800"><Plus size={16}/> Quick action</button></div>
          </div>

          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total students", value: "—", sub: "Add your class roster", icon: Users, trend: "Admin managed", color: "blue" },
              { label: "Teachers", value: "—", sub: "Assign subject teachers", icon: UserRound, trend: "Subject access", color: "violet" },
              { label: "Attendance today", value: "—", sub: "No records yet", icon: CheckCheck, trend: "Live tracking", color: "green" },
              { label: "Pending reviews", value: "—", sub: "Submissions to review", icon: FileText, trend: "Teacher workflow", color: "amber" },
            ].map((stat) => {
              const Icon = stat.icon;
              const colors: Record<string, string> = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
              return <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.02)]"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[stat.color]}`}><Icon size={19}/></span><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{stat.trend}</span></div><p className="mt-5 text-[13px] font-medium text-slate-500">{stat.label}</p><p className="mt-1 text-[28px] font-extrabold tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-slate-400">{stat.sub}</p></div>;
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.02)] sm:p-6">
                <SectionTitle action="View all assignments">Assignments & submissions</SectionTitle>
                <div className="mb-5 flex flex-wrap gap-2"><span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">All subjects</span><span className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">Due soon</span><span className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">Needs review</span></div>
                <div className="divide-y divide-slate-100">{tasks.map((task) => <div key={task.title} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${task.color === "violet" ? "bg-violet-50 text-violet-700" : task.color === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{task.initials}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{task.subject}</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{task.title}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={12}/>{task.due}</p></div><span className={`hidden rounded-lg px-2.5 py-1.5 text-[10px] font-bold sm:inline-block ${task.tone === "amber" ? "bg-amber-50 text-amber-700" : task.tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{task.status}</span><button aria-label="More assignment options" className="text-slate-400"><MoreHorizontal size={18}/></button></div>)}</div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.02)] sm:p-6">
                <SectionTitle action="Open announcements">Class announcements</SectionTitle>
                <div className="flex gap-3 rounded-xl bg-blue-50/70 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700"><Megaphone size={18}/></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">Welcome to your class workspace</p><span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">Pinned</span></div><p className="mt-1.5 text-xs leading-5 text-slate-500">Once setup is complete, your admin can publish class notices, timetable updates and important reminders here.</p><p className="mt-2 text-[10px] font-medium text-slate-400">System preview · Visible to the class after publishing</p></div></div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.02)] sm:p-6">
                <SectionTitle action="View timetable">Today’s timetable</SectionTitle>
                <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3"><div className="flex items-center gap-2 text-xs font-bold text-slate-700"><CalendarDays size={15} className="text-blue-700"/> Monday, 13 October</div><span className="text-[10px] font-semibold text-slate-400">3 sample slots</span></div>
                <div className="space-y-4">{events.map((event, i) => <div key={event.title} className="flex gap-3"><div className="w-12 shrink-0 pt-0.5 text-center"><p className="text-lg font-extrabold leading-5">{event.day}</p><p className="mt-1 text-[9px] font-bold tracking-widest text-slate-400">{event.month}</p></div><div className={`w-1 shrink-0 rounded-full ${event.color === "blue" ? "bg-blue-500" : event.color === "violet" ? "bg-violet-500" : "bg-emerald-500"}`}/><div className="min-w-0 pb-1"><p className="text-sm font-bold">{event.title}</p><p className="mt-1 text-xs text-slate-400">{event.meta}</p></div></div>)}</div>
                <button className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Open full timetable</button>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.02)] sm:p-6">
                <SectionTitle>Quick access</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {[{ title: "Manage users", desc: "Students & teachers", icon: Users, color: "blue" }, { title: "Mark attendance", desc: "Daily class record", icon: ClipboardCheck, color: "green" }, { title: "Add a subject", desc: "Build your syllabus", icon: BookMarked, color: "violet" }, { title: "Post a notice", desc: "Keep everyone updated", icon: Megaphone, color: "amber" }].map((item) => { const Icon = item.icon; return <button key={item.title} className="rounded-xl border border-slate-100 p-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40"><span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${item.color === "blue" ? "bg-blue-50 text-blue-700" : item.color === "green" ? "bg-emerald-50 text-emerald-700" : item.color === "violet" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}><Icon size={17}/></span><span className="block text-xs font-bold">{item.title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-400">{item.desc}</span></button>; })}
                </div>
              </section>
            </div>
          </div>
          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400 sm:flex-row"><p>© 2026 Classroom · Class Management Workspace</p><p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400"/> Preview data only — connect Supabase to enable live records</p></footer>
        </div>
      </section>
    </main>
  );
}
