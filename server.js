const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight
app.options('*', cors());

// Serve static files (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// API Proxy - Netlify-style functions under /netlify/functions
function toNetlifyEvent(req) {
  return {
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: req.query,
    body: req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : null,
  };
}

app.all('/api/:fn', async (req, res) => {
  try {
    const fnName = req.params.fn.replace(/[^a-zA-Z0-9_-]/g, ''); // Sanitize
    const fnPath = path.join(__dirname, 'netlify', 'functions', `${fnName}.js`);
    
    // Security: only allow specific functions
    const allowedFns = [
      'auth-login',
      'auth-me',
      'admin-create-employee',
      'admin-set-role',
      'admin-pending-doctors',
      'admin-approve-doctor',
      'admin-pending-diagnostics',
      'admin-approve-diagnostics',
      'tasks',
      'team'
    ];
    if (!allowedFns.includes(fnName)) {
      return res.status(404).json({ error: 'Function not found' });
    }

    // Load function
    let mod;
    try {
      mod = require(fnPath);
    } catch (e) {
      console.error(`Function ${fnName} not found at ${fnPath}:`, e.message);
      return res.status(404).json({ error: `Function ${fnName} not found` });
    }

    const handler = mod.handler || mod.default || mod;
    if (typeof handler !== 'function') {
      return res.status(500).json({ error: `Invalid function export for ${fnName}` });
    }

    const out = await handler(toNetlifyEvent(req));
    const status = out?.statusCode || 200;
    
    // Copy headers
    const headers = out?.headers || {};
    Object.entries(headers).forEach(([k, v]) => {
      if (v !== undefined) res.setHeader(k, v);
    });

    const body = out?.body;
    if (body === undefined || body === null || body === '') {
      return res.status(status).end();
    }

    // Parse JSON or send raw
    try {
      const parsed = JSON.parse(body);
      return res.status(status).json(parsed);
    } catch {
      return res.status(status).send(body);
    }
  } catch (e) {
    console.error('API error:', e);
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Cloud Run: listen on PORT env var
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Health: http://localhost:${port}/health`);
  console.log(`🌐 Admin: http://localhost:${port}/admin.html`);
});
