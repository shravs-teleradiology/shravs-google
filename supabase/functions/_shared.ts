// supabase/functions/_shared.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export function supabaseAdmin() {
  const url =
    Deno.env.get("PROJECT_URL") ||
    Deno.env.get("SUPABASE_URL") ||
    "https://xksqdjwbiojwyfllwtvh.supabase.co";

  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!serviceKey) throw new Error("Missing SERVICE_ROLE_KEY secret");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function supabaseAnon() {
  const url =
    Deno.env.get("PROJECT_URL") ||
    Deno.env.get("SUPABASE_URL") ||
    "https://xksqdjwbiojwyfllwtvh.supabase.co";

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ||
    "sb_publishable_zZe-aVVerbOt7joJQMt6QQ_bq3Ej7Ze";

  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) throw new Error("Missing Authorization Bearer token");

  const anon = supabaseAnon();
  const { data: u, error: uErr } = await anon.auth.getUser(token);
  if (uErr || !u?.user) throw new Error("Invalid token");

  const admin = supabaseAdmin();
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id,role,email,name")
    .eq("id", u.user.id)
    .single();

  if (pErr || !profile) throw new Error("Profile not found");
  if (profile.role !== "admin") throw new Error("Admin only");

  return { user: u.user, profile };
}
