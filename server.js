const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/team');
const tasksRoutes = require('./routes/tasks');
const queriesRoutes = require('./routes/queries');

const app = express();
const PORT = process.env.PORT || 8080;

// CSP: allow inline scripts/styles (your HTML uses them),
// allow Supabase CDN module import, and allow Supabase network calls.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        // Needed because your pages have inline <script> blocks
        // and also import supabase-js from cdn.jsdelivr.net.
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net"
        ],

        // Supabase makes fetch requests to https://*.supabase.co
        // and may use Realtime websockets (wss://*.supabase.co).
        // jsdelivr 'sm/*.map' source maps can also trigger connections.
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "https://cdn.jsdelivr.net"
        ],

        imgSrc: ["'self'", "data:", "https:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],

        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"]
      }
    }
  })
);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', authMiddleware);
app.use('/api/team', teamRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/queries', queriesRoutes);

// Serve frontend from 'public'
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index-1.html'));
});

// Cloud Run: must listen on 0.0.0.0 and PORT env
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
