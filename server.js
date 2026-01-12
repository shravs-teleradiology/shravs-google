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
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: '*' })); // Adjust for your domain
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', authMiddleware);
app.use('/api/team', teamRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/queries', queriesRoutes);

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
