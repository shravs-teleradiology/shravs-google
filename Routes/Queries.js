const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.post('/', async (req, res) => {
  const { type, name, designation, email, phone, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO queries (type, name, designation, email, phone, message) VALUES ($1, $2, $3, $4, $5, $6)',
      [type, name, designation, email, phone || null, message]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM queries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
