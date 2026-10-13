"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, UserPlus, Megaphone, BookOpen, LoaderCircle } from "lucide-react";

type Subject = { id: string; name: string };
export default function DashboardTools({ role, userId, subjects }: { role: string; userId: string; subjects: Subject[] }) {
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [showUser,setShowUser] = useState(false);
  const [showSubject,setShowSubject] = useState(false);
  const [showAssignment,setShowAssignment] = useState(false);
  const [showNotice,setShowNotice] = useState(false);
  const canTeach = role === "admin" || role === "teacher";
  async function run(event: FormEvent<HTMLFormElement>, action: (form: FormData)=>Promise<void>) {
    event.preventDefault(); const form = event.currentTarget; const formData = new FormData(form); setMessage(""); setBusy(true);
    try { await action(formData); setMessage("Saved successfully."); form.reset(); window.location.reload(); }
    catch(e) { setMessage(e instanceof Error ? e.message : "Unable to save this item."); }
    finally { setBusy(false); }
  }
  async function addSubject(form:FormData) {
    const name=String(form.get("name")||"").trim(); const description=String(form.get("description")||"").trim();
    if(!name) throw new Error("Enter a subject name.");
    const {error}=await createClient().from("subjects").insert({name,description:description||null,created_by:userId});
    if(error) throw error;
  }
  async function addAssignment(form:FormData) {
    const title=String(form.get("title")||"").trim(); const subject_id=String(form.get("subject_id")||"");
    if(!title||!subject_id) throw new Error("Enter a title and choose a subject.");
    const {error}=await createClient().from("assignments").insert({title,subject_id,teacher_id:userId,instructions:String(form.get("instructions")||"").trim()||null,due_at:form.get("due_at")?new Date(String(form.get("due_at"))).toISOString():null,total_marks:form.get("total_marks")?Number(form.get("total_marks")):null,status:form.get("publish")==="on"?"published":"draft",published_at:form.get("publish")==="on"?new Date().toISOString():null});
    if(error) throw error;
  }
  async function addAnnouncement(form:FormData) {
    const title=String(form.get("title")||"").trim(); const body=String(form.get("body")||"").trim();
    if(!title||!body) throw new Error("Enter a title and message.");
    const publish=form.get("publish")==="on";
    const {error}=await createClient().from("announcements").insert({title,body,author_id:userId,is_published:publish,is_pinned:form.get("pinned")==="on",published_at:publish?new Date().toISOString():null});
    if(error) throw error;
  }
  async function createUser(form:FormData) {
    const response=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:form.get("full_name"),email:form.get("email"),password:form.get("password"),role:form.get("role"),rollNumber:form.get("roll_number")})});
    const result=await response.json(); if(!response.ok) throw new Error(result.error||"Unable to create account.");
  }
  const btn="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50";
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-extrabold">Workspace actions</h2><p className="mt-1 text-xs text-slate-500">Actions available to your account role.</p></div><div className="flex flex-wrap gap-2">
      {role==="admin"&&<button className={btn} onClick={()=>setShowUser(!showUser)}><UserPlus className="mr-1 inline" size={14}/>Create account</button>}
      {role==="admin"&&<button className={btn} onClick={()=>setShowSubject(!showSubject)}><BookOpen className="mr-1 inline" size={14}/>Add subject</button>}
      {canTeach&&<button className={btn} onClick={()=>setShowAssignment(!showAssignment)}><Plus className="mr-1 inline" size={14}/>New assignment</button>}
      {canTeach&&<button className={btn} onClick={()=>setShowNotice(!showNotice)}><Megaphone className="mr-1 inline" size={14}/>Post notice</button>}
    </div></div>
    {message&&<p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {showUser&&role==="admin"&&<form onSubmit={e=>run(e,createUser)} className="space-y-3 rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Create a class account</h3><input required name="full_name" placeholder="Full name" className="field"/><input required type="email" name="email" placeholder="Email address" className="field"/><input required minLength={8} type="password" name="password" placeholder="Temporary password (8+ characters)" className="field"/><select name="role" className="field"><option value="student">Student</option><option value="teacher">Teacher</option></select><input name="roll_number" placeholder="Roll number (optional, students)" className="field"/><button disabled={busy} className="primary">{busy ? <LoaderCircle className="inline animate-spin" size={15}/> : "Create account"}</button><p className="text-xs leading-5 text-slate-500">Requires SUPABASE_SERVICE_ROLE_KEY configured as a server-only Vercel environment variable.</p></form>}
      {showSubject&&role==="admin"&&<form onSubmit={e=>run(e,addSubject)} className="space-y-3 rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Add subject</h3><input required name="name" placeholder="Subject name" className="field"/><textarea name="description" placeholder="Description (optional)" className="field min-h-20"/><button disabled={busy} className="primary">{busy?"Saving…":"Save subject"}</button></form>}
      {showAssignment&&canTeach&&<form onSubmit={e=>run(e,addAssignment)} className="space-y-3 rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Create assignment</h3><input required name="title" placeholder="Assignment title" className="field"/><select required name="subject_id" className="field"><option value="">Choose subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><textarea name="instructions" placeholder="Instructions" className="field min-h-20"/><label className="block text-xs text-slate-500">Deadline<input type="datetime-local" name="due_at" className="field mt-1"/></label><input type="number" min="0" step="0.5" name="total_marks" placeholder="Total marks (optional)" className="field"/><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="publish"/> Publish immediately</label><button disabled={busy} className="primary">{busy?"Saving…":"Save assignment"}</button></form>}
      {showNotice&&canTeach&&<form onSubmit={e=>run(e,addAnnouncement)} className="space-y-3 rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Post announcement</h3><input required name="title" placeholder="Announcement title" className="field"/><textarea required name="body" placeholder="Write the class notice…" className="field min-h-28"/><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="publish" defaultChecked/> Publish to class</label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="pinned"/> Pin notice</label><button disabled={busy} className="primary">{busy?"Publishing…":"Save notice"}</button></form>}
    </div>
    <style jsx>{`.field{display:block;width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;background:white;color:#0f172a;outline:none}.field:focus{border-color:#2563eb;box-shadow:0 0 0 3px #dbeafe}.primary{width:100%;border-radius:10px;background:#1d4ed8;color:white;padding:10px 12px;font-size:13px;font-weight:700}.primary:disabled{opacity:.6}`}</style>
  </section>;
}
