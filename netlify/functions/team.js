import { ok, methodNotAllowed } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const role = (event.queryStringParameters?.role || "").trim();
  const sba = sbAnon(auth.token);

  let q = sba.from("profiles")
    .select("id,name,email,organization,role,photo_url,approved")
    .eq("approved", true);

  if (role) q = q.eq("role", role);

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

  return ok({ items: data });
};
