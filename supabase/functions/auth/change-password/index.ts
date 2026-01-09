import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR'
    )

    const { current_password, new_password } = await req.json()

    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Current and new passwords required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user from token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No token' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify current password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password
    })

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update to new password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: new_password
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update first_login flag
    await supabase
      .from('profiles')
      .update({ first_login: false })
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({ message: 'Password changed successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
