const { ok, badRequest, unauthorized, forbidden, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { requireUser, requireAdmin } = require("./_lib/auth");
const { supabaseAdmin } = require("./_lib/supabase");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "PATCH") return badRequest("Use PATCH");

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);
  if (!requireAdmin(auth.profile)) return forbidden("Admin only");

  const body = parseJsonBody(event);
  if (!body) return badRequest("Invalid JSON");
  const { user_id, role } = body;

  if (!user_id || !role) return badRequest("user_id and role required");
  if (!["user","employee","admin"].includes(role)) return badRequest("Invalid role");

  const admin = supabaseAdmin();
  const { error } = await admin.from("profiles").update({ role }).eq("id", user_id);
  if (error) return badRequest(error.message);

  return ok({ user_id, role });
};
