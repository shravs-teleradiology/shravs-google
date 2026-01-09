const { ok, badRequest, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { supabaseAdmin } = require("./_lib/supabase");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "POST") return badRequest("Use POST");

  const body = parseJsonBody(event);
  if (!body) return badRequest("Invalid JSON");

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const organization = (body.organization || "").trim();

  if (!name || !email || !organization) return badRequest("name, email, organization required");

  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("diagnostic_requests")
    .insert({ name, email, organization, status: "pending" })
    .select("id,status,created_at")
    .single();

  if (error) return badRequest(error.message);

  return ok({ message: "Diagnostic request submitted for admin approval.", request: data });
};
