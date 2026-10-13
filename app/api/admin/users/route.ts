import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

    const { data: actor, error: actorError } = await sessionClient.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
    if (actorError || actor?.role !== "admin" || !actor.is_active) return NextResponse.json({ error: "Only an active administrator can create accounts." }, { status: 403 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) return NextResponse.json({ error: "Server setup is incomplete. Add SUPABASE_SERVICE_ROLE_KEY to Vercel as a server-only environment variable, then redeploy." }, { status: 503 });

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = body.role === "teacher" ? "teacher" : "student";
    const rollNumber = String(body.rollNumber || "").trim() || null;
    if (!fullName || !email || password.length < 8) return NextResponse.json({ error: "Name, valid email and a password of at least 8 characters are required." }, { status: 400 });
    if (role === "teacher" && rollNumber) return NextResponse.json({ error: "Roll number is only for students." }, { status: 400 });

    const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
    if (createError || !created.user) return NextResponse.json({ error: createError?.message || "Could not create authentication account." }, { status: 400 });

    const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, full_name: fullName, email, role, roll_number: rollNumber, is_active: true });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: "Account profile could not be created: " + profileError.message }, { status: 400 });
    }
    await admin.from("audit_logs").insert({ actor_id: user.id, action: "account_created", table_name: "profiles", record_id: created.user.id, details: { role, email } });
    return NextResponse.json({ ok: true, user: { id: created.user.id, email, fullName, role } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
  }
}
