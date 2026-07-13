// src/queues/scanQueue.js
// BullMQ Queue definition for background security scans.

const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');

let scanQueue = null;

const getScanQueue = () => {
  if (!scanQueue) {
    scanQueue = new Queue('scan-queue', {
      connection: getRedisConnection(),
    });
  }

  return scanQueue;
};

// Helper to reliably enqueue a scan job
const enqueueScan = async (scanId, targetUrl) => {
  return await getScanQueue().add(
    'process-scan',
    { scanId, targetUrl },
    {
      jobId: scanId.toString(), // prevent duplicate jobs for the same scan
      attempts: 0, // Scans shouldn't auto-retry if they fail, to prevent infinite loops of bad targets
      removeOnComplete: true, // keep Redis memory clean
      removeOnFail: false, // keep failed jobs for debugging
    }
  );
};

module.exports = { getScanQueue, enqueueScan };
