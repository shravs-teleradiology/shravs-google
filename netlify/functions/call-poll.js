import { ok, methodNotAllowed } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const session_id = event.queryStringParameters?.session_id;
  const since = event.queryStringParameters?.since; // optional timestamp ISO
  if (!session_id) return { statusCode: 400, body: JSON.stringify({ error: "Missing session_id" }) };

  const sba = sbAnon(auth.token);

  let q = sba.from("call_signals")
    .select("*")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  if (since) q = q.gt("created_at", since);

  const { data, error } = await q;
  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

  return ok({ signals: data });
};
