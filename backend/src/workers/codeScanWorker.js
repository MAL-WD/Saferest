/**
 * BullMQ worker for async code scan processing
 */

const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { processScan } = require('../services/codeScanService');

const codeScanWorker = new Worker(
  'code-scan',
  async (job) => {
    const { scanId, code, language, userId } = job.data;

    console.log(`[CodeScan Worker] Starting scan ${scanId}`);

    try {
      // Process the scan
      const result = await processScan(scanId, code);

      console.log(`[CodeScan Worker] Completed scan ${scanId}`);

      // Clear code from memory explicitly
      job.data.code = null;

      return {
        success: true,
        scanId,
        summary: result.summary,
      };
    } catch (error) {
      console.error(`[CodeScan Worker] Failed scan ${scanId}:`, error.message);

      // Job failure is automatically handled by BullMQ
      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.CODE_SCAN_CONCURRENCY || 3),
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      timeout: parseInt(process.env.CODE_SCAN_TIMEOUT_MS || 120000),
    },
  }
);

// Event handlers
codeScanWorker.on('completed', (job) => {
  console.log(`[CodeScan Worker] Job ${job.id} completed`);
});

codeScanWorker.on('failed', (job, err) => {
  console.error(`[CodeScan Worker] Job ${job.id} failed:`, err.message);
});

codeScanWorker.on('error', (error) => {
  console.error('[CodeScan Worker] Error:', error);
});

module.exports = codeScanWorker;
