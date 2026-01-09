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

  const { name, email, password, organization } = body;
  if (!name || !email || !password) return badRequest("name, email, password required");

  const admin = supabaseAdmin();

  // Create Auth user
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });
  if (cErr || !created?.user) return badRequest(cErr?.message || "Failed to create user");

  // Create/Update profile row as employee
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      email,
      name,
      role: "employee",
      organization: organization || ""
    });

  if (pErr) return badRequest(pErr.message);

  return ok({ user_id: created.user.id, email, role: "employee" });
};
