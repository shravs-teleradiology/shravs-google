import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create user in auth.users
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_login: true,
        role: 'employee'
      }
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update profile created by trigger
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name,
        role: 'employee',
        first_login: true,
        created_by: 'admin'
      })
      .eq('user_id', user.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Employee created successfully', 
        user_id: user.user.id 
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
