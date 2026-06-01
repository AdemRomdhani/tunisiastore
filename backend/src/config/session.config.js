const Redis = require('ioredis');
const { RedisStore } = require('connect-redis');
const session = require('express-session');

let redisClient = null;
let sessionMiddleware = null;

function initSessionStore() {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || 6379;
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false
  });

  redisClient.on('error', (err) => {
    console.error('🔴 Redis session error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis session store connected');
  });

  sessionMiddleware = session({
    store: new RedisStore({
      client: redisClient,
      prefix: 'session:',
      ttl: 7 * 24 * 60 * 60 // 7 days
    }),
    secret: process.env.JWT_SECRET || 'fallback-session-secret',
    name: 'tunisia.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  });

  return sessionMiddleware;
}

function getRedisClient() {
  return redisClient;
}

function getSessionMiddleware() {
  if (!sessionMiddleware) {
    return initSessionStore();
  }
  return sessionMiddleware;
}

async function closeSessionStore() {
  if (redisClient) {
    await redisClient.quit();
  }
}

module.exports = {
  initSessionStore,
  getSessionMiddleware,
  getRedisClient,
  closeSessionStore
};