// src/workers/scanWorker.js
// BullMQ worker that processes scan jobs from the queue.
// Calls the orchestrator, which handles the actual execution.

const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { runScan } = require('../scanners/orchestrator');
const logger = require('../utils/logger');

const startScanWorker = () => {
  const worker = new Worker(
    'scan-queue',
    async (job) => {
      const { scanId, targetUrl } = job.data;
      logger.info(`[Worker] Picked up job ${job.id} for scan ${scanId} on ${targetUrl}`);
      
      // Execute the orchestrator
      await runScan(scanId, targetUrl);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5, // Process up to 5 scans concurrently on this Node instance
    }
  );

  worker.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`[Worker] Internal error: ${err.message}`);
  });

  logger.info(' BullMQ Scan Worker initialized and listening on queue: scan-queue');
  return worker;
};

module.exports = { startScanWorker };
