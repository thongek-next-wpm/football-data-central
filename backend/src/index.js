require('dotenv').config();
const { createApp } = require('./app');
const { initDatabase } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { startSyncJobs } = require('./jobs/syncJobs');

const PORT = Number(process.env.PORT) || 5001;

async function bootstrap() {
  await Promise.all([initDatabase(), connectRedis()]);
  startSyncJobs();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[FDC Backend] Running on http://localhost:${PORT}`);
  });
}

bootstrap();
