import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      'https://xksqdjwbiojwyfllwtvh.supabase.co',
      'sb_publishable_zZe-aVVerbOt7joJQMt6QQ_bq3Ej7Ze'
    )

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:8080/reset-password.html'
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists (security)
      return new Response(
        JSON.stringify({ message: 'Reset link sent if email exists' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Password reset email sent' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
