const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service key for server ops
);

router.post('/change-password', async (req, res) => {
  try {
    const { currentpassword, newpassword } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Verify current via Supabase (or custom logic)
    const { data: session } = await supabase.auth.getUser(token);
    if (!session.user) return res.status(401).json({ error: 'Invalid token' });

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newpassword
    }, { token });

    if (error) throw new Error(error.message);
    
    // Update first_login
    await supabase.from('profiles').update({ first_login: false }).eq('id', session.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);
    if (!user.user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    res.json(profile || { role: 'patient' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
