const { ok, badRequest, unauthorized, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { supabaseUser } = require("./_lib/supabase");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "POST") return badRequest("Use POST");

  const body = parseJsonBody(event);
  if (!body) return badRequest("Invalid JSON");
  const { email, password } = body;
  if (!email || !password) return badRequest("Email and password required");

  const sb = supabaseUser(null);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data?.session) return unauthorized("Invalid credentials");

  return ok({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: { id: data.user.id, email: data.user.email }
  });
};
