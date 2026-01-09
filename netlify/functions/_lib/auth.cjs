const { supabaseUser } = require('./supabase');

function getBearerToken(event){
  const h = event.headers?.authorization || event.headers?.Authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function requireUser(event){
  const token = getBearerToken(event);
  if (!token) return { error: 'Missing token' };
  const sb = supabaseUser(token);
  const { data: u, error: uerr } = await sb.auth.getUser();
  if (uerr || !u?.user) return { error: 'Invalid token' };
  const { data: profile, error: perr } = await sb.from('profiles').select('*').eq('user_id', u.user.id).single();
  if (perr || !profile) return { error: 'Profile not found' };
  return { sb, token, user: u.user, profile };
}

function requireAdmin(profile){
  return profile && profile.role === 'admin';
}

module.exports = { requireUser, requireAdmin };
