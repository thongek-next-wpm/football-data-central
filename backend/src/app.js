const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

function createApp() {
  const app = express();

  const rawOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          rawOrigins.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, process.env.STRICT_CORS !== 'true');
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
