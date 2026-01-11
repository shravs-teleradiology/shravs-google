import { corsHeaders, json, requireAdmin, supabaseAdmin } from "../../_shared.ts";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    await requireAdmin(req);

    const { id } = await req.json();
    if (!id) return json({ error: "id required" }, 400);

    const admin = supabaseAdmin();

    const { data: doctor, error: dErr } = await admin
      .from("pending_doctors")
      .select("*")
      .eq("id", id)
      .single();

    if (dErr) return json({ error: dErr.message }, 400);
    if (!doctor) return json({ error: "Doctor not found" }, 404);

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: doctor.email,
      password: doctor.password || undefined, // if you stored one; else remove this line
      email_confirm: true,
      user_metadata: { name: doctor.name, speciality: doctor.speciality }
    });
    if (cErr || !created?.user) return json({ error: cErr?.message || "Create user failed" }, 400);

    const { error: pErr } = await admin.from("profiles").upsert({
      id: created.user.id,
      name: doctor.name,
      email: doctor.email,
      role: "doctor"
    });
    if (pErr) return json({ error: pErr.message }, 400);

    await admin.from("pending_doctors").delete().eq("id", id);

    return json({ success: true }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
}
