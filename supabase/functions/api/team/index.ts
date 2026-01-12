import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handler } from "../api/team/index.ts";  // your real handler
serve(handler);

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Use GET" }, 405);

  try {
    await requireAdmin(req);
    
    const admin = supabaseAdmin();
    const url = new URL(req.url);
    const role = url.searchParams.get("role") || "employee";
    
    const { data, error } = await admin
      .from("profiles")
      .select("id, name, email, role, created_at")
      .eq("role", role)
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 400);
    return json({ items: data || [] }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 401);
  }
}
