const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
  credentials: true
}));
app.options('*', cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Functions
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xksqdjwbiojwyfllwtvh.supabase.co';
const SUPABASE_FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

// IMPORTANT: set this in Cloud Run env vars
// (same value as your SB publishable anon key)
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

/**
 * Frontend endpoint -> Supabase Edge Function name.
 * NOTE: your frontend uses "admin-approve-diagnostics" but your function is "admin-approve-diagnostic".
 */
const FN_MAP = {
  'admin-create-employee': 'admin-create-employee',
  'admin-set-role': 'admin-set-role',

  'admin-pending-doctors': 'admin-pending-doctors',
  'admin-approve-doctor': 'admin-approve-doctor',

  'admin-pending-diagnostics': 'admin-pending-diagnostics',
  'admin-approve-diagnostics': 'admin-approve-diagnostic', // singular function name

  'tasks': 'tasks',
  'team': 'team',
};

app.all('/api/:fn', async (req, res) => {
  try {
    const fnName = (req.params.fn || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const mapped = FN_MAP[fnName];
    if (!mapped) return res.status(404).json({ error: 'Function not found' });

    const url = new URL(`${SUPABASE_FUNCTIONS_BASE}/${mapped}`);

    // Forward query params
    for (const [k, v] of Object.entries(req.query || {})) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }

    // Forward headers
    const headers = {
  'Content-Type': req.headers['content-type'] || 'application/json',
  'apikey': process.env.SUPABASE_ANON_KEY,  // Always required
};

// ONLY forward real user JWTs - NEVER fake with anon key
if (req.headers.authorization && !req.headers.authorization.includes('sb_publishable')) {
  headers['Authorization'] = req.headers.authorization;
}

    // Pass JWT through (required for admin/team endpoints)
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Add apikey header (recommended for Supabase HTTP calls)
    if (SUPABASE_ANON_KEY) {
      headers['apikey'] = SUPABASE_ANON_KEY;
      // If no Authorization provided, fall back to anon key so public functions can still be called.
      if (!headers['Authorization']) headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const method = req.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);
    const body = hasBody ? JSON.stringify(req.body || {}) : undefined;

    const resp = await fetch(url.toString(), { method, headers, body });

    const text = await resp.text();
    res.status(resp.status);

    try {
      return res.json(text ? JSON.parse(text) : {});
    } catch {
      return res.send(text);
    }
  } catch (e) {
    console.error('API proxy error:', e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});
