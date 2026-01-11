import { corsHeaders, json, requireAdmin, supabaseAdmin } from "../../_shared.ts";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Use GET" }, 405);

  try {
    await requireAdmin(req);

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("pending_diagnostics")
      .select("id,name,email,speciality,organization,created_at")
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 400);
    return json({ items: data || [] }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
}
