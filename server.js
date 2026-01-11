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

// Supabase Edge Functions base
const SUPABASE_FUNCTIONS_BASE = 'https://xksqdjwbiojwyfllwtvh.supabase.co/functions/v1';

// IMPORTANT: map only to functions that actually exist in Supabase right now
const FN_MAP = {
  // deployed
  'admin-create-employee': 'admin-create-employee',
  'admin-set-role': 'admin-set-role',
  'tasks': 'tasks',
  'team': 'team',
  'offer-letter': 'offer-letter',
  'profile': 'profile',
  'password-reset': 'password-reset',
  'change-password': 'change-password',
  'auth': 'auth'

  // NOT deployed yet (these will 404 if called)
  // 'admin-pending-doctors': 'admin-pending-doctors',
  // 'admin-pending-diagnostics': 'admin-pending-diagnostics',
  // 'admin-approve-doctor': 'admin-approve-doctor',
  // 'admin-approve-diagnostics': 'admin-approve-diagnostics',
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

    // Forward headers (CRITICAL for JWT)
    const headers = {};
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    headers['Content-Type'] = req.headers['content-type'] || 'application/json';

    const method = req.method.toUpperCase();
    const body = (method === 'GET' || method === 'HEAD') ? undefined : JSON.stringify(req.body || {});

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
