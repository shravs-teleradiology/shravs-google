import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAdmin, supabaseAdmin } from "../_shared.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    await requireAdmin(req);

    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const organization = (body.organization || "").trim();

    if (!name || !email) return json({ error: "name and email required" }, 400);

    const admin = supabaseAdmin();

    // 1) Generate STR-01, STR-02...
    const { data: empId, error: empErr } = await admin.rpc("next_emp_id");
    if (empErr) return json({ error: "emp-id generation failed: " + empErr.message }, 400);

    const emp_id = String(empId);
    const password = emp_id;

    // 2) Create auth user
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, emp_id },
    });
    if (cErr || !created?.user) return json({ error: cErr?.message || "Failed to create user" }, 400);

    // 3) Upsert profile
    const { error: pErr } = await admin.from("profiles").upsert({
      id: created.user.id,
      email,
      name,
      emp_id,
      phone: phone || "",
      role: "employee",
      organization: organization || "",
    });
    if (pErr) return json({ error: pErr.message }, 400);

    return json({
      message: "Employee created",
      user_id: created.user.id,
      email,
      emp_id,
      default_password: password,
    }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
});
