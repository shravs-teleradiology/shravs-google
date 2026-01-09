import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, requireAdmin, supabaseAdmin } from "../_shared.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Use GET" }, 405);

  try {
    await requireAdmin(req);

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("doctor_requests")
      .select("id,name,email,organization,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 400);
    return json({ items: data || [] }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
});
