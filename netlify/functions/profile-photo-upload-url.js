import { ok, bad, methodNotAllowed, parseBody } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  const body = parseBody(event);
  const ext = (body.ext || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const contentType = body.contentType || "image/png";

  // store by internal profile id
  const path = `avatars/${auth.profile.id}/${Date.now()}.${ext}`;

  const sba = sbAnon(auth.token);
  const { data, error } = await sba.storage
    .from("avatars")
    .createSignedUploadUrl(path);

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

  return ok({
    path,
    token: data.token,
    signedUploadUrl: data.signedUrl,
    contentType,
    publicUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}`,
  });
};
