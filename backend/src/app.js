const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

function createApp() {
  const app = express();

  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
    })
  );

  app.use(express.json());

  // Public read-only API (no user authentication required)
  app.use('/api', apiRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}

module.exports = { createApp };
