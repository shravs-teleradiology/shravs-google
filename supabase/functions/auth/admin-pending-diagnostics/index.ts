import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_publishable_zZe-aVVerbOt7joJQMt6QQ_bq3Ej7Ze'
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token || '')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    if (!profile || profile.role !== 'admin') throw new Error('Admin only')

    const { data, error } = await supabase
      .from('pending_diagnostics')  // or pending_doctors table
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    return new Response(JSON.stringify(data), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
