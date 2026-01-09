const { ok, badRequest, unauthorized, forbidden, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { requireUser, requireAdmin } = require("./_lib/auth");
const { supabaseAdmin } = require("./_lib/supabase");

function makeTempPassword(prefix = "DIA") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "POST") return badRequest("Use POST");

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);
  if (!requireAdmin(auth.profile)) return forbidden("Admin only");

  const body = parseJsonBody(event);
  if (!body) return badRequest("Invalid JSON");

  const request_id = body.request_id;
  if (!request_id) return badRequest("request_id required");

  const admin = supabaseAdmin();

  const { data: reqRow, error: reqErr } = await admin
    .from("diagnostic_requests")
    .select("id,name,email,organization,status")
    .eq("id", request_id)
    .single();

  if (reqErr) return badRequest(reqErr.message);
  if (!reqRow || reqRow.status !== "pending") return badRequest("Request not pending");

  const temp_password = makeTempPassword("DIA");

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email: reqRow.email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { name: reqRow.name, role: "diagnostic" }
  });
  if (cErr || !created?.user) return badRequest(cErr?.message || "Failed to create diagnostic user");

  const { error: pErr } = await admin.from("profiles").upsert({
    id: created.user.id,
    email: reqRow.email,
    name: reqRow.name,
    role: "diagnostic",
    organization: reqRow.organization || "",
    approved: true
  });
  if (pErr) return badRequest(pErr.message);

  const { error: uErr } = await admin
    .from("diagnostic_requests")
    .update({ status: "approved", approved_by: auth.profile.id, approved_at: new Date().toISOString() })
    .eq("id", request_id);

  if (uErr) return badRequest(uErr.message);

  return ok({
    message: "Diagnostic approved",
    user_id: created.user.id,
    email: reqRow.email,
    temp_password
  });
};
