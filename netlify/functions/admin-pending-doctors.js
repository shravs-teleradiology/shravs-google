const { ok, badRequest, unauthorized, forbidden, isOptions, optionsOk } = require("./_lib/http");
const { requireUser, requireAdmin } = require("./_lib/auth");
const { supabaseAdmin } = require("./_lib/supabase");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "GET") return badRequest("Use GET");

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);
  if (!requireAdmin(auth.profile)) return forbidden("Admin only");

  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("doctor_requests")
    .select("id,name,email,organization,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return badRequest(error.message);
  return ok({ items: data || [] });
};
