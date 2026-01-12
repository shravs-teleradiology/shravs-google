const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/team', async (req, res) => {
  try {
    const { role } = req.query;
    const result = await pool.query(
      'SELECT * FROM profiles WHERE role = $1 ORDER BY created_at DESC',
      [role || 'employee']
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin-create-employee', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Create in Supabase auth (use supabase admin API in prod)
    // For now, assume manual or trigger
    await pool.query(
      'INSERT INTO profiles (name, email, role, first_login) VALUES ($1, $2, $3, $4)',
      [name, email, 'employee', true]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/admin-set-role', async (req, res) => {
  const { userid, role } = req.body;
  try {
    await pool.query('UPDATE profiles SET role = $1 WHERE id = $2', [role, userid]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin-pending-doctors', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE role = 'doctor' AND speciality IS NULL"
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin-approve-doctor', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query(
      'UPDATE profiles SET speciality = $1 WHERE id = $2',
      ['Approved', id] // Update logic as needed
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin-pending-diagnostics', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE role LIKE '%diagnostic%' AND status = 'pending'"
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin-approve-diagnostics', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('UPDATE profiles SET status = $1 WHERE id = $2', ['approved', id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
