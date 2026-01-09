import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    'https://xksqdjwbiojwyfllwtvh.supabase.co',
    'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR'
  )

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || 'employee'

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return new Response(
      JSON.stringify({ items: data }), 
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
