// worker-node.js
// Entry point for deploying standalone WebGuard AI scan workers globally.
// This runs only the BullMQ worker and connects to the central DB/Redis.

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
const { checkRedisAvailability } = require('./src/config/redis');
const { startScanWorker } = require('./src/workers/scanWorker');

const startWorkerNode = async () => {
  logger.info('=== WebGuard AI: Global Worker Node ===');

  if (!process.env.MONGO_URI || (!process.env.REDIS_URL && !process.env.REDIS_HOST)) {
    logger.error('CRITICAL: MONGO_URI and REDIS_URL are required to start a worker node.');
    process.exit(1);
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info(' Connected to global MongoDB database');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  // Connect to Redis and start BullMQ Worker
  const redisOk = await checkRedisAvailability();
  if (redisOk) {
    startScanWorker();
    logger.info(' Worker Node is now listening for scan jobs...');
  } else {
    logger.error(' Could not connect to Redis queue broker. Exiting.');
    process.exit(1);
  }
};

startWorkerNode();
