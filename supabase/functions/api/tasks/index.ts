import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    'https://xksqdjwbiojwyfllwtvh.supabase.co',
    'sb_secret_0WpYpxW795cxtCcPEuBRcA_aoQyXZtR'
  )

  try {
    // GET - Fetch all tasks
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return new Response(
        JSON.stringify(data), 
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // POST - Create new task
    if (req.method === 'POST') {
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

      const { assigned_to, title, description, priority, due_date, status } = await req.json()

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          assigned_to,
          title,
          description,
          priority: priority || 'medium',
          due_date,
          status: status || 'pending',
          assigned_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      return new Response(
        JSON.stringify(data), 
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // PATCH - Update task status
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

      const { id, status } = await req.json()

      const { data, error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
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
