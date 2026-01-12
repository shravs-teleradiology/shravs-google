const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/team');
const tasksRoutes = require('./routes/tasks');
const queriesRoutes = require('./routes/queries');

const app = express();
const PORT = process.env.PORT || 8080;  // Cloud Run default

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes  
app.use('/api', authMiddleware);
app.use('/api/team', teamRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/queries', queriesRoutes);

// Serve frontend from 'public' folder
app.use(express.static('public'));
app.get('*', (req, res) => {
  res.sendFile('public/index-1.html', { root: __dirname });
});

// CRITICAL: Bind to 0.0.0.0 for Cloud Run
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
