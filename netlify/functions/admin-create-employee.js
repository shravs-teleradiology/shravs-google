const { ok, badRequest, unauthorized, forbidden, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { requireUser, requireAdmin } = require("./_lib/auth");
const { supabaseAdmin } = require("./_lib/supabase");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "POST") return badRequest("Use POST");

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);
  if (!requireAdmin(auth.profile)) return forbidden("Admin only");

  const body = parseJsonBody(event);
  if (!body) return badRequest("Invalid JSON");

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const phone = (body.phone || "").trim();
  const organization = (body.organization || "").trim();

  if (!name || !email) return badRequest("name and email required");

  const admin = supabaseAdmin();

  // 1) Generate employee id STR-01, STR-02...
  const { data: empData, error: empErr } = await admin.rpc("next_emp_id");
  if (empErr) return badRequest("emp-id generation failed: " + empErr.message);

  const emp_id = empData;          // e.g., "STR-01"
  const password = emp_id;         // default password

  // 2) Create Auth user
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, emp_id }
  });
  if (cErr || !created?.user) return badRequest(cErr?.message || "Failed to create user");

  // 3) Upsert profile
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      email,
      name,
      emp_id,
      phone,
      role: "employee",
      organization: organization || ""
    });
  if (pErr) return badRequest(pErr.message);

  return ok({
    message: "Employee created",
    user_id: created.user.id,
    email,
    emp_id,
    default_password: password
  });
};
