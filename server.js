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

const SUPABASE_FUNCTIONS_BASE = 'https://xksqdjwbiojwyfllwtvh.supabase.co/functions/v1';

/**
 * IMPORTANT:
 * These right-side names MUST match the function names that appear in
 * Supabase Dashboard → Edge Functions.
 *
 * Based on your screenshot, your folders are under api/ and auth/.
 * In Supabase, nested folders are not invoked as /api/team.
 * Usually you deploy with a flat function name like:
 *   api-team, api-tasks, auth-admin-pending-doctors, etc.
 *
 * So we map /api/team -> api-team, etc.
 */
const FN_MAP = {
  // Admin/Auth group
  'admin-create-employee': 'auth-admin-create-employee',
  'admin-set-role': 'auth-admin-set-role',
  'admin-pending-doctors': 'auth-admin-pending-doctors',
  'admin-approve-doctor': 'auth-admin-approve-doctor',
  'admin-pending-diagnostics': 'auth-admin-pending-diagnostics',

  // IMPORTANT: Your screenshot shows "admin-approve-diagnostic" (singular)
  'admin-approve-diagnostics': 'auth-admin-approve-diagnostic',

  // API group
  'team': 'api-team',
  'tasks': 'api-tasks',

  // If used
  'auth-login': 'auth-auth-login',
  'auth-me': 'auth-auth-me',
};

app.all('/api/:fn', async (req, res) => {
  try {
    const fnName = (req.params.fn || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const mapped = FN_MAP[fnName];
    if (!mapped) return res.status(404).json({ error: 'Function not found' });

    const url = new URL(`${SUPABASE_FUNCTIONS_BASE}/${mapped}`);

    // query params
    for (const [k, v] of Object.entries(req.query || {})) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }

    // forward headers (CRITICAL)
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json'
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

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
