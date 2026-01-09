import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    'https://xksqdjwbiojwyfllwtvh.supabase.co',
    'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR'
  )

  try {
    // GET - Fetch current user profile
    if (req.method === 'GET') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return new Response(
        JSON.stringify(data), 
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // PATCH - Update profile
    if (req.method === 'PATCH') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const updates = await req.json()
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return new Response(
        JSON.stringify(data), 
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
