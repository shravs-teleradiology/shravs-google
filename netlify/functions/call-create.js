import { ok, bad, methodNotAllowed, parseBody } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const body = parseBody(event);
  const callee_profile_id = body.callee_profile_id;
  if (!callee_profile_id) return bad("Missing callee_profile_id");

  const sba = sbAnon(auth.token);
  const { data, error } = await sba
    .from("call_sessions")
    .insert({
      caller_profile_id: auth.profile.id,
      callee_profile_id,
      status: "active"
    })
    .select("*")
    .single();

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return ok({ session: data });
};
