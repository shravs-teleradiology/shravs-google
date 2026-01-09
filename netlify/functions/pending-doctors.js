import { ok, methodNotAllowed } from "./_lib/http.js";
import { requireAdmin } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const auth = await requireAdmin(event);
  if (auth.error) return auth.error;

  const sba = sbAnon(auth.token);
  const { data, error } = await sba
    .from("doctor_requests")
    .select("id,profile_id,name,email,organization,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return ok({ items: data });
};
