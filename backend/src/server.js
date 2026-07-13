// src/server.js
require('dotenv').config();
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { checkRedisAvailability } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  logger.info('Boot stage: connecting database');
  await connectDB();
  logger.info('Boot stage: loading app');
  const app = require('./app');
  logger.info('Boot stage: creating HTTP server');

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const redisAvailable = await checkRedisAvailability();
  if (redisAvailable) {
    const { startScanWorker } = require('./workers/scanWorker');
    const { startSslLabsWorker } = require('./workers/sslLabsWorker');
    const { startSchedulerWorker } = require('./workers/schedulerWorker');

    // Only start the code-scan BullMQ worker when NOT running in inline mode.
    // In inline mode (CODE_SCAN_INLINE=1), scans run in-process and the worker
    // would double-process any residual jobs from prior Redis sessions.
    const codeScanInline = process.env.CODE_SCAN_INLINE === '1' || process.env.CODE_SCAN_INLINE === 'true';
    if (codeScanInline) {
      logger.info('CODE_SCAN_INLINE=1: BullMQ code-scan worker is disabled. Draining stale queue jobs...');
      // Drain + clean any stale jobs left from previous sessions so they don't replay
      try {
        const { Queue } = require('bullmq');
        const { getRedisConnection } = require('./config/redis');
        const staleQueue = new Queue('code-scan', { connection: getRedisConnection() });
        await staleQueue.drain();  // remove waiting jobs
        await staleQueue.clean(0, 100, 'active');   // remove active (stalled)
        await staleQueue.clean(0, 100, 'failed');   // remove failed
        await staleQueue.clean(0, 100, 'delayed');  // remove delayed
        await staleQueue.close();
        logger.info('code-scan queue drained successfully.');
      } catch (drainErr) {
        logger.warn(`Could not drain code-scan queue: ${drainErr.message}`);
      }
    } else {
      require('./workers/codeScanWorker'); // Initialize code scan BullMQ worker
    }

    // Start BullMQ workers
    startScanWorker();
    startSslLabsWorker();
    startSchedulerWorker();
  } else {
    logger.warn('Running without Redis workers; scan queue processing is disabled until Redis is reachable.');
  }

  httpServer.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
}); 
