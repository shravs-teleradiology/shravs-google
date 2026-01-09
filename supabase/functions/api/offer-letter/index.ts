// supabase/functions/offer-letter/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    const { employee_email, employee_name } = await req.json()

    // Insert employee record
    const { data: employee, error: insertError } = await supabase
      .from('employees')
      .insert({ 
        email: employee_email, 
        name: employee_name,
        status: 'active'
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Send welcome email via Supabase (uses your project SMTP)
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: employee_email,
        subject: `Welcome ${employee_name}!`,
        html: `<h1>Welcome to Shravs Teleradiology!</h1>`
      }
    })

    return new Response(JSON.stringify({ success: true, employee }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
