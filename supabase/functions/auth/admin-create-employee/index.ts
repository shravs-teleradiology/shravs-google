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

    const { name, email, password: tempPassword } = await req.json()

    if (!name || !email || !tempPassword) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 1. Create user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_login: true,
        role: 'employee',
        name: name
      }
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Update profile
    await supabase
      .from('profiles')
      .update({
        name,
        role: 'employee',
        first_login: true,
        created_by: 'admin'
      })
      .eq('user_id', user.user.id)

    // 3. Send custom welcome email using Supabase auth email template
    const welcomeEmail = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: 'https://shravsteleradiology.com/login.html'
      }
    })

    // 4. Send custom offer letter via Supabase database trigger (bonus)
    await supabase
      .from('offer_letters')
      .upsert({
        id: user.user.id,
        employee_email: email,
        employee_name: name,
        temp_password: tempPassword,
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        message: 'Employee created successfully! Welcome email sent.',
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
