const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const hasRedisUrl = Boolean(process.env.REDIS_URL);

let isConnected = false;
let lastRedisError = null;
let warnLogged = false;

const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 2000,
    reconnectStrategy(retries) {
      if (retries >= 3) {
        if (!warnLogged) {
          console.warn('[Redis] Unavailable; continuing with PostgreSQL / local disk cache fallback.');
          warnLogged = true;
        }
        return new Error('Redis retry limit reached');
      }
      return Math.min(retries * 500, 1500);
    },
  },
});

redisClient.on('error', (err) => {
  lastRedisError = err.message;
  if (isConnected) {
    console.warn('[Redis] Connection lost:', err.message);
  }
  isConnected = false;
});

redisClient.on('ready', () => {
  isConnected = true;
  lastRedisError = null;
  warnLogged = false;
  console.log('[Redis] Connected');
});

async function connectRedis() {
  if (!hasRedisUrl) {
    lastRedisError = 'REDIS_URL not configured';
    console.warn('[Redis] REDIS_URL not configured; continuing without Redis L1 cache.');
    return false;
  }

  try {
    await redisClient.connect();
    return true;
  } catch (err) {
    isConnected = false;
    lastRedisError = err.message;
    if (!warnLogged) {
      console.warn('[Redis] Running without Redis cache (fallback to DB/local cache):', err.message);
      warnLogged = true;
    }
    return false;
  }
}

module.exports = {
  redisClient,
  connectRedis,
  isRedisReady: () => isConnected,
  getRedisStatus: () => ({
    configured: hasRedisUrl,
    connected: isConnected,
    lastError: lastRedisError,
  }),
};
