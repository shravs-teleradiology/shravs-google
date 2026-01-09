const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));

// CORS (simple)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

function toNetlifyEvent(req) {
  return {
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: req.query,
    body: req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : (req.rawBody || req.body || null),
  };
}

app.all('/api/:fn', async (req, res) => {
  try {
    const fnName = req.params.fn;
    const fnPath = path.join(__dirname, 'netlify', 'functions', `${fnName}.js`);
    const mod = require(fnPath);
    const handler = mod.handler || mod.default || mod;
    if (typeof handler !== 'function') {
      return res.status(500).json({ error: `Invalid function export for ${fnName}` });
    }
    const out = await handler(toNetlifyEvent(req));
    const status = out?.statusCode || 200;
    const headers = out?.headers || {};
    Object.entries(headers).forEach(([k, v]) => { if (v !== undefined) res.setHeader(k, v); });
    const body = out?.body;
    if (body === undefined || body === null || body === '') return res.status(status).end();
    // body is often JSON string
    try {
      const parsed = JSON.parse(body);
      return res.status(status).json(parsed);
    } catch {
      return res.status(status).send(body);
    }
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Static site
app.use('/', express.static(path.join(__dirname, 'public')));

// Default
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server listening on ${port}`));
