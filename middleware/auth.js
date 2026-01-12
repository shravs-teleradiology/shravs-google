const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    // Decode Supabase JWT or generate custom
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', decoded.sub).single();
    if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    req.user = profile;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
