"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setupNeeded = searchParams.get("setup") === "1";

  useEffect(() => {\n    const onBeforeInstallPrompt = (event: Event) => {\n      event.preventDefault();\n      setInstallPrompt(event as InstallPromptEvent);\n    };\n    const onInstalled = () => {\n      setInstallPrompt(null);\n      setInstallMessage("App installed successfully. You can open it from your Home Screen.");\n    };\n    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);\n    window.addEventListener("appinstalled", onInstalled);\n    return () => {\n      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);\n      window.removeEventListener("appinstalled", onInstalled);\n    };\n  }, []);\n\n  async function handleInstall() {\n    setInstallMessage("");\n    if (installPrompt) {\n      await installPrompt.prompt();\n      const choice = await installPrompt.userChoice;\n      if (choice.outcome === "accepted") setInstallMessage("Installation started. Follow your browser prompts to finish.");\n      else setInstallMessage("Installation was cancelled. You can install it later from your browser menu.");\n      setInstallPrompt(null);\n      return;\n    }\n    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);\n    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;\n    if (isStandalone) setInstallMessage("This app is already installed on your device.");\n    else if (isIOS) setInstallMessage("To install: open this page in Safari, tap Share, then choose Add to Home Screen.");\n    else setInstallMessage("If the install prompt is not available yet, open your browser menu and choose Install app or Add to Home screen. If missing, wait for the website deployment to finish and reload.");\n  }\n\n  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.assign(searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-10">
      <div className="grid w-full max-w-[920px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-[#172554] p-10 text-white md:flex">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><GraduationCap size={24}/></span><div><p className="font-extrabold">Classroom</p><p className="text-[10px] tracking-[0.18em] text-blue-200">CLASS MANAGEMENT</p></div></div>
          <div><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={28}/></div><h1 className="max-w-xs text-3xl font-extrabold leading-tight tracking-[-0.04em]">One class. One connected workspace.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/75">Assignments, attendance, learning materials and class updates — accessible only to authorized members.</p></div>
          <p className="text-xs text-blue-200/60">Secure sign-in · No public registration</p>
        </section>
        <section className="p-7 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white"><GraduationCap size={22}/></span><span className="font-extrabold">Classroom</span></div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Welcome back</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Sign in to your class</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Use the account provided by your class administrator.</p>
          {setupNeeded && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">Supabase environment variables are not configured yet. Add them in your local environment or hosting project to enable sign-in.</div>}
          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Email address</span><span className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50"><Mail size={17} className="text-slate-400"/><input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.com" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"/></span></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Password</span><span className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50"><LockKeyhole size={17} className="text-slate-400"/><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"/></span></label>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
            <button disabled={loading} type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in…" : "Sign in securely"}</button>
          </form>
          <div className="mt-5">\n            <button type="button" onClick={handleInstall} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100">\n              <Download size={17} /> Download / Install App\n            </button>\n            {installMessage && <p role="status" className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{installMessage}</p>}\n          </div>\n          <p className="mt-6 text-center text-xs text-slate-400">Accounts are created by an administrator. Public sign-up is disabled.</p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading sign-in…</div>}><LoginForm /></Suspense>;
}
