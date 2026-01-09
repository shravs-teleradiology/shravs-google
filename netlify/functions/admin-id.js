import { ok, methodNotAllowed } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "GET") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const sba = sbAnon(auth.token);
  const { data, error } = await sba
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (error || !data) return { statusCode: 404, body: JSON.stringify({ error: "Admin not found" }) };
  return ok({ admin_id: data.id });
};
