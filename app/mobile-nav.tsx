"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, CalendarDays, ClipboardCheck, FileText, GraduationCap, Menu, Megaphone, ShieldCheck, Users, X } from "lucide-react";

type NavItem = { href: string; label: string; icon: string };
const icons = { Bell, BookOpen, CalendarDays, ClipboardCheck, FileText, GraduationCap, Megaphone, ShieldCheck, Users };

export default function MobileNav({ items, fullName, role, rollNumber }: { items: NavItem[]; fullName: string; role: string; rollNumber?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button type="button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} onClick={() => setOpen(v => !v)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && <div className="fixed inset-0 z-50 lg:hidden">
        <button aria-label="Close navigation menu" className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} />
        <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col overflow-y-auto bg-white p-5 shadow-2xl">
          <div className="mb-7 flex items-center justify-between gap-3">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-700 text-white"><GraduationCap size={22} /></span>
              <span><strong className="block text-base">Classroom</strong><small className="text-[10px] font-bold tracking-widest text-slate-400">CLASS MANAGEMENT</small></span>
            </Link>
            <button type="button" aria-label="Close navigation menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><X size={19} /></button>
          </div>
          <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-slate-400">YOUR WORKSPACE</p>
          <nav className="space-y-1">
            {items.map(item => {
              const Icon = icons[item.icon as keyof typeof icons] || BookOpen;
              const active = item.href.startsWith("/") && item.href !== "/" && pathname === item.href;
              return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}>
                <Icon size={18} />{item.label}
              </Link>;
            })}
          </nav>
          {(role === "admin" || role === "teacher") && <div className="mt-6 rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold text-blue-900">Teaching tools</p><p className="mt-1 text-xs leading-5 text-blue-800/75">Open your role panel to manage class activities.</p></div>}
          <div className="mt-auto border-t border-slate-100 pt-4">
            <p className="truncate text-sm font-bold">{fullName}</p><p className="mt-1 text-xs capitalize text-slate-500">{role}{rollNumber ? " · " + rollNumber : ""}</p>
            <form action="/auth/signout" method="post" className="mt-4"><button className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Sign out</button></form>
          </div>
        </aside>
      </div>}
    </div>
  );
}
