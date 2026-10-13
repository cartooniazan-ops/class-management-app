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


export async function PATCH(request: Request) {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    const { data: actor, error: actorError } = await sessionClient.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
    if (actorError || actor?.role !== "admin" || !actor.is_active) return NextResponse.json({ error: "Only an active administrator can manage accounts." }, { status: 403 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !url) return NextResponse.json({ error: "Server setup is incomplete. Check the server-only SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 503 });
    const body = await request.json();
    const userId = String(body.userId || "");
    const action = String(body.action || "");
    if (!userId || userId === user.id) return NextResponse.json({ error: "A valid non-admin account is required." }, { status: 400 });
    if (action !== "reset_password" && action !== "deactivate" && action !== "activate") return NextResponse.json({ error: "Unsupported account action." }, { status: 400 });

    const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: target, error: targetError } = await admin.from("profiles").select("id,role,email,is_active").eq("id", userId).maybeSingle();
    if (targetError || !target) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    if (target.role === "admin") return NextResponse.json({ error: "Administrator accounts cannot be changed from this screen." }, { status: 403 });

    if (action === "reset_password") {
      const password = String(body.password || "");
      if (password.length < 8) return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await admin.from("audit_logs").insert({ actor_id: user.id, action: "account_password_reset", table_name: "profiles", record_id: userId, details: { role: target.role } });
      return NextResponse.json({ ok: true });
    }

    const is_active = action === "activate";
    const { error: updateError } = await admin.from("profiles").update({ is_active }).eq("id", userId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    await admin.from("audit_logs").insert({ actor_id: user.id, action: is_active ? "account_activated" : "account_deactivated", table_name: "profiles", record_id: userId, details: { role: target.role, email: target.email } });
    return NextResponse.json({ ok: true, is_active });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
  }
}
