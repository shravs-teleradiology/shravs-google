const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error('SUPABASE_URL missing');
if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    // If you are using Supabase JWT, simplest is: ask Supabase who user is
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });

    // Load profile & role
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pErr || !profile) return res.status(403).json({ error: 'Profile not found' });

    req.user = profile;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }
};
