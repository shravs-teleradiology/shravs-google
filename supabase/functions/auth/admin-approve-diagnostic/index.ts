import { corsHeaders, json, requireAdmin, supabaseAdmin } from "../../_shared.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handler } from "../auth/admin-approve-diagnostic/index.ts";
serve(handler);

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    await requireAdmin(req);

    const { id } = await req.json();
    if (!id) return json({ error: "id required" }, 400);

    const admin = supabaseAdmin();

    const { data: diag, error: dErr } = await admin
      .from("pending_diagnostics")
      .select("*")
      .eq("id", id)
      .single();

    if (dErr) return json({ error: dErr.message }, 400);
    if (!diag) return json({ error: "Diagnostic not found" }, 404);

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: diag.email,
      password: diag.password || undefined,
      email_confirm: true,
      user_metadata: { name: diag.name, speciality: diag.speciality }
    });
    if (cErr || !created?.user) return json({ error: cErr?.message || "Create user failed" }, 400);

    const { error: pErr } = await admin.from("profiles").upsert({
      id: created.user.id,
      name: diag.name,
      email: diag.email,
      role: "diagnostic"
    });
    if (pErr) return json({ error: pErr.message }, 400);

    await admin.from("pending_diagnostics").delete().eq("id", id);

    return json({ success: true }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
}
