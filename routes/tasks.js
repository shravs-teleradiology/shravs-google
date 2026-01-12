const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { assignedto, title, description, priority, duedate, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (assigned_to, title, description, priority, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [assignedto, title, description, priority, duedate, status || 'pending']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
