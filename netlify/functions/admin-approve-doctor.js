import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const sb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  // Verify admin (service_role bypasses RLS, but we check auth anyway)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Validate input
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { doctor_id } = req.body;
  if (!doctor_id) {
    return res.status(400).json({ error: 'Missing doctor_id' });
  }

  try {
    // 1) Fetch doctor request details
    const { data: reqData, error: reqErr } = await sb
      .from('doctor_requests')
      .select('name, email, organization')
      .eq('id', doctor_id)
      .eq('status', 'pending')
      .single();

    if (reqErr || !reqData) {
      return res.status(404).json({ error: 'Pending doctor request not found' });
    }

    // 2) Create auth user (service_role bypasses email confirmation)
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: reqData.email,
      password: 'temp' + Math.random().toString(36).slice(-8), // Random temp password
      email_confirm: true,
      user_metadata: { 
        name: reqData.name, 
        role: 'doctor',
        organization: reqData.organization 
      }
    });

    if (authErr) {
      return res.status(500).json({ error: `Auth creation failed: ${authErr.message}` });
    }

    // 3) Create profile (service_role bypasses RLS)
    const { data: profileData, error: profileErr } = await sb
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: reqData.name,
        email: reqData.email,
        role: 'doctor',
        organization: reqData.organization,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileErr) {
      return res.status(500).json({ error: `Profile creation failed: ${profileErr.message}` });
    }

    // 4) Mark request as approved
    const { error: updateErr } = await sb
      .from('doctor_requests')
      .update({ 
        status: 'approved', 
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', doctor_id);

    if (updateErr) {
      console.error('Warning: Approval update failed:', updateErr);
    }

    res.status(200).json({ 
      message: 'Doctor approved successfully',
      doctor: {
        id: authData.user.id,
        name: reqData.name,
        email: reqData.email,
        temp_password: authData.user.password || 'temp-generated'
      }
    });

  } catch (err) {
    console.error('Approve doctor error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
