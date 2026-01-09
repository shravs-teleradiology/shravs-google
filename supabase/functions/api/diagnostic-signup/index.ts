import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, supabaseAdmin } from "../_shared.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const organization = (body.organization || "").trim();

    if (!name || !email || !organization) {
      return json({ error: "name, email, organization required" }, 400);
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("diagnostic_requests")
      .insert({ name, email, organization, status: "pending" })
      .select("id,status,created_at")
      .single();

    if (error) return json({ error: error.message }, 400);

    return json({ message: "Diagnostic request submitted for admin approval.", request: data }, 200);
  } catch (e) {
    return json({ error: e?.message || String(e) }, 400);
  }
});
