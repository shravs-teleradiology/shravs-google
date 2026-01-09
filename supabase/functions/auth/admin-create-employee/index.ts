import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { name, email, phone, organization } = await req.json()

    if (!name || !email) throw new Error('name and email required')

    // Generate emp_id
    const { data: empData } = await supabaseAdmin.rpc('next_emp_id')
    const emp_id = empData
    const password = emp_id

    // Create auth user
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, emp_id }
    })
    if (createErr) throw createErr

    // Create profile
    await supabaseAdmin.from('profiles').upsert({
      id: createdUser.user.id,
      email,
      name,
      emp_id,
      phone: phone || '',
      role: 'employee',
      organization: organization || ''
    })

    return new Response(JSON.stringify({ 
      message: 'Employee created', 
      emp_id, 
      default_password: password,
      email 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
