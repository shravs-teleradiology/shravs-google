import { ok, bad, methodNotAllowed, parseBody } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const sba = sbAnon(auth.token);

  if (event.httpMethod === "GET") {
    return ok({ profile: auth.profile });
  }

  if (event.httpMethod !== "PATCH") return methodNotAllowed();

  const body = parseBody(event);
  const name = (body.name ?? "").toString().trim();
  const organization = (body.organization ?? "").toString().trim();

  if (!name && !organization && !("photo_url" in body)) return bad("Nothing to update");

  const patch = {};
  if (name) patch.name = name;
  if (organization) patch.organization = organization;
  if (body.photo_url !== undefined) patch.photo_url = body.photo_url;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await sba
    .from("profiles")
    .update(patch)
    .eq("user_id", auth.user.id)   // IMPORTANT
    .select("*")
    .single();

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return ok({ profile: data });
};
