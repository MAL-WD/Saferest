// src/config/db.js
// Mongoose connection with retry logic and structured logging.
// Called once from server.js at boot time.

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000);
const SOCKET_TIMEOUT_MS = Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 30000);
const CONNECT_TIMEOUT_MS = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 5000);
const IP_FAMILY = Number(process.env.MONGODB_IP_FAMILY || 4);

let connectionListenersAttached = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retryCount = 0) => {
  try {
    const startedAt = Date.now();
    logger.info(`Connecting to MongoDB (attempt ${retryCount + 1})...`);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
      family: IP_FAMILY,
    });

    logger.info(`MongoDB connected: ${conn.connection.host} (${Date.now() - startedAt}ms)`);

    if (!connectionListenersAttached) {
      connectionListenersAttached = true;

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
        void connectDB().catch((err) => {
          logger.error(`MongoDB reconnect failed: ${err.message}`);
        });
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });
    }
  } catch (error) {
    logger.error(`MongoDB connection failed (attempt ${retryCount + 1}): ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await delay(RETRY_DELAY_MS);
      return connectDB(retryCount + 1);
    } else {
      logger.error('Max retries reached. Exiting process.');
      throw error;
    }
  }
};

module.exports = connectDB;
