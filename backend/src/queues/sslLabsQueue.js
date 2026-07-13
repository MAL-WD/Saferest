const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');

let sslLabsQueue = null;

const getSslLabsQueue = () => {
  if (!sslLabsQueue) {
    sslLabsQueue = new Queue('ssl-labs-queue', { connection: getRedisConnection() });
  }

  return sslLabsQueue;
};

const enqueueSslLabsJob = async ({ scanId, host }) => {
  return getSslLabsQueue().add(
    'poll-ssllabs',
    { scanId, host },
    {
      jobId: `ssllabs-${scanId}`,
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};

module.exports = { getSslLabsQueue, enqueueSslLabsJob };
