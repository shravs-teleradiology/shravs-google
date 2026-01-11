// server.js (project root)
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

/**
 * IMPORTANT:
 * Map your frontend routes to Supabase Edge Function names.
 * Adjust the right-side values to match the names you deployed in Supabase.
 *
 * If your Supabase function is named "admin-create-employee", keep it as is.
 * If you deployed it under some other name, update it here.
 */
const SUPABASE_FUNCTIONS_BASE = 'https://xksqdjwbiojwyfllwtvh.supabase.co/functions/v1';

const FN_MAP = {
  // Auth/Admin
  'admin-create-employee': 'admin-create-employee',
  'admin-set-role': 'admin-set-role',
  'admin-pending-doctors': 'admin-pending-doctors',
  'admin-approve-doctor': 'admin-approve-doctor',
  'admin-pending-diagnostics': 'admin-pending-diagnostics',
  'admin-approve-diagnostics': 'admin-approve-diagnostics',

  // API
  'tasks': 'tasks',
  'team': 'team',

  // If you have these in frontend
  'auth-login': 'auth-login',
  'auth-me': 'auth-me',
};

app.all('/api/:fn', async (req, res) => {
  try {
    const fnName = (req.params.fn || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const mapped = FN_MAP[fnName];
    if (!mapped) return res.status(404).json({ error: 'Function not found' });

    // Build Supabase function URL
    const url = new URL(`${SUPABASE_FUNCTIONS_BASE}/${mapped}`);

    // Preserve query params
    for (const [k, v] of Object.entries(req.query || {})) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }

    // Forward headers (especially Authorization)
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    // Prepare body
    const method = req.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);
    const body = hasBody ? JSON.stringify(req.body || {}) : undefined;

    // Node 18+ has global fetch (Cloud Run uses Node 18/20 typically)
    const resp = await fetch(url.toString(), { method, headers, body });

    // Pass through status + body
    const text = await resp.text();
    res.status(resp.status);

    // Try to return JSON if possible
    try {
      const json = JSON.parse(text);
      return res.json(json);
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
