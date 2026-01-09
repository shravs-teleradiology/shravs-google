const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseUser(access_token=null){
  return createClient(SUPABASE_URL, ANON, {
    global: access_token ? { headers: { Authorization: `Bearer ${access_token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function supabaseAdmin(){
  return createClient(SUPABASE_URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = { supabaseUser, supabaseAdmin };
