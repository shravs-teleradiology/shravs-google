import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR'
    )

    const { user_id, role } = await req.json()

    if (!user_id || !role) {
      return new Response(
        JSON.stringify({ error: 'user_id and role required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update profile role
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', user_id)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: `Role updated to ${role}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
