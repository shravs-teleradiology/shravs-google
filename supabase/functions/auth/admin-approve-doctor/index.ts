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
    const supabaseAdmin = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR'
    )

    const supabase = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_publishable_zZe-aVVerbOt7joJQMt6QQ_bq3Ej7Ze'
    )

    // Admin auth check
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token || '')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const { id } = await req.json()
    const { data: doctor } = await supabaseAdmin
      .from('pending_doctors')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!doctor) throw new Error('Doctor not found')

    // Create doctor user
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: doctor.email,
      email_confirm: true,
      user_metadata: { name: doctor.name, speciality: doctor.speciality }
    })
    if (authError) throw authError

    // Create profile
    await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      name: doctor.name,
      email: doctor.email,
      role: 'doctor'
    })

    // Remove from pending
    await supabaseAdmin.from('pending_doctors').delete().eq('id', id)

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
