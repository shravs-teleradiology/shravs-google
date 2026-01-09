import { ok, bad, methodNotAllowed, parseBody } from "./_lib/http.js";
import { requireAuth } from "./_lib/auth.js";
import { sbAnon } from "./_lib/supabase.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const auth = await requireAuth(event);
  if (auth.error) return auth.error;

  if (auth.profile.role !== "doctor") return { statusCode: 403, body: JSON.stringify({ error: "Doctor only" }) };
  if (!auth.profile.approved) return { statusCode: 403, body: JSON.stringify({ error: "Waiting for admin approval" }) };

  const body = parseBody(event);
  const type = (body.type || "general").trim();
  const message = (body.message || "").trim();
  if (!message) return bad("Message required");

  const sba = sbAnon(auth.token);
  const { error } = await sba.from("queries").insert({
    type,
    name: auth.profile.name || "Doctor",
    designation: auth.profile.organization || "Doctor",
    email: auth.profile.email || "",
    phone: null,
    message,
    author_profile_id: auth.profile.id
  });

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return ok({ message: "Sent to admin" });
};
