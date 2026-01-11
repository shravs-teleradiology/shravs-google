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

// EXACT MATCH to your deployed function names
const FN_MAP = {
  'admin-create-employee': 'admin-create-employee',
  'admin-set-role': 'admin-set-role',
  'admin-pending-doctors': 'admin-pending-doctors',  // ✅ You have this
  'admin-approve-doctor': 'admin-approve-doctor',
  'admin-pending-diagnostics': 'admin-pending-diagnostics',
  'admin-approve-diagnostics': 'admin-approve-diagnostic',  // ✅ singular from your screenshot

  'team': 'team',    // ✅ You have this
  'tasks': 'tasks',  // ✅ You have this

  // Auth (if needed)
  'auth-login': 'auth-login',
  'auth-me': 'auth-me',
};

// CRITICAL: API routes BEFORE SPA fallback
app.all('/api/:fn', async (req, res) => {
  try {
    const fnName = (req.params.fn || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const mapped = FN_MAP[fnName];
    if (!mapped) return res.status(404).json({ error: `Function ${fnName} not found` });

    const url = new URL(`${SUPABASE_FUNCTIONS_BASE}/${mapped}`);

    for (const [k, v] of Object.entries(req.query || {})) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json'
    };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const method = req.method.toUpperCase();
    const body = !['GET', 'HEAD'].includes(method) ? JSON.stringify(req.body || {}) : undefined;

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

// SPA fallback AFTER API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});
