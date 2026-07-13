// src/config/redis.js
// IORedis connection for BullMQ job queue.
// Exported as a reusable connection object used by queue definitions and workers.

const { Redis } = require('ioredis');
const logger = require('../utils/logger');

const resolveRedisConfig = () => {
  if (process.env.REDIS_URL) {
    return {
      connection: process.env.REDIS_URL,
      target: process.env.REDIS_URL,
    };
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  logger.warn('REDIS_URL is missing. Falling back to REDIS_HOST/REDIS_PORT.');
  return {
    connection: { host, port },
    target: `${host}:${port}`,
  };
};

const createRedisConnection = () => {
  const { connection, target } = resolveRedisConfig();
  logger.info(`Initializing Redis connection (${target})`);
  const redis = new Redis(connection, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
      // Stop reconnecting after a few attempts to avoid infinite ECONNREFUSED loops.
      if (times > 3) {
        logger.error('Redis reconnect attempts exhausted. Redis-backed features remain disabled until restart.');
        return null;
      }
      return Math.min(times * 1000, 5000);
    },
  });

  redis.on('connect', () => logger.info(' Redis connected'));
  redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  redis.on('reconnecting', () => logger.warn(' Redis reconnecting...'));

  return redis;
};

const checkRedisAvailability = async () => {
  const { connection, target } = resolveRedisConfig();
  const probe = new Redis(connection, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 3000,
    retryStrategy: () => null,
  });

  try {
    await probe.connect();
    await probe.ping();
    logger.info(`Redis startup probe succeeded (${target})`);
    return true;
  } catch (err) {
    logger.warn(`Redis unavailable at startup (${target}): ${err.message}. Queue workers will not start.`);
    return false;
  } finally {
    try {
      await probe.quit();
    } catch (_) {
      probe.disconnect();
    }
  }
};

let redisConnection = null;

const getRedisConnection = () => {
  if (!redisConnection) {
    redisConnection = createRedisConnection();
  }
  return redisConnection;
};

module.exports = { getRedisConnection, createRedisConnection, checkRedisAvailability };
