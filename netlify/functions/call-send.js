import { ok, bad, methodNotAllowed, parseBody } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const body = parseBody(event);
  const { session_id, signal_type, payload } = body;
  if (!session_id || !signal_type || !payload) return bad("Missing session_id/signal_type/payload");

  const sba = sbAnon(auth.token);
  const { data, error } = await sba
    .from("call_signals")
    .insert({
      session_id,
      sender_profile_id: auth.profile.id,
      signal_type,
      payload
    })
    .select("*")
    .single();

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return ok({ signal: data });
};
