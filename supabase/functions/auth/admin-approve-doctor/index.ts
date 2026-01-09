import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAdmin, randPassword, supabaseAdmin } from "../_shared.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const { user } = await requireAdmin(req);
    const body = await req.json();
    const doctor_id = body.doctor_id || body.doctorId || body.id;

    if (!doctor_id) return json({ error: "doctor_id required" }, 400);

    const admin = supabaseAdmin();

    const { data: reqRow, error: reqErr } = await admin
      .from("doctor_requests")
      .select("id,name,email,organization,status")
      .eq("id", doctor_id)
      .single();

    if (reqErr) return json({ error: reqErr.message }, 400);
    if (!reqRow || reqRow.status !== "pending") return json({ error: "Request not pending" }, 400);

    const temp_password = randPassword("DOC");

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: reqRow.email,
      password: temp_password,
      email_confirm: true,
      user_metadata: { name: reqRow.name, role: "doctor" },
    });

    if (cErr || !created?.user) return json({ error: cErr?.message || "Failed to create doctor user" }, 400);

    const { error: pErr } = await admin.from("profiles").upsert({
      id: created.user.id,
      email: reqRow.email,
      name: reqRow.name,
      role: "doctor",
      organization: reqRow.organization || "",
      approved: true,
    });
    if (pErr) return json({ error: pErr.message }, 400);

    const { error: uErr } = await admin
      .from("doctor_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", doctor_id);

    if (uErr) return json({ error: uErr.message }, 400);

    return json({
      message: "Doctor approved",
      email: reqRow.email,
      doctor_user_id: created.user.id,
      temp_password,
    }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
});
