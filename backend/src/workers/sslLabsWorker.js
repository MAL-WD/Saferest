const { Worker } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const { getRedisConnection } = require('../config/redis');
const external = require('../services/externalAPIs');
const Scan = require('../models/Scan');
const logger = require('../utils/logger');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const startSslLabsWorker = () => {
  const worker = new Worker(
    'ssl-labs-queue',
    async (job) => {
      const { scanId, host } = job.data;
      await external.sslLabsAnalyze(host, true, { skipCache: true });

      let data = null;
      for (let i = 0; i < 36; i++) {
        data = await external.sslLabsAnalyze(host, false, { skipCache: true });
        if (!data) break;
        if (data.status === 'READY') break;
        if (data.status === 'ERROR') break;
        await sleep(10000);
      }

      if (!data || data.status !== 'READY') {
        logger.warn(`[SSL Labs] No READY result for ${host} scan ${scanId}`);
        return;
      }

      const ep = (data.endpoints && data.endpoints[0]) || {};
      const grade = ep.grade || 'Unknown';
      const findings = [];

      findings.push({
        findingId: uuidv4(),
        scanner: 'SSL Labs',
        severity: grade === 'A+' || grade === 'A' ? 'INFO' : 'MEDIUM',
        title: `SSL Labs overall grade: ${grade}`,
        description: 'Qualys SSL Labs assessment completed asynchronously.',
        evidence: JSON.stringify({
          grade,
          cipherSuite: ep.suites?.list?.length,
          details: ep.details,
        }).slice(0, 8000),
        owaspCategory: 'A02:2021 – Cryptographic Failures',
        remediation: grade.startsWith('A') ? '' : 'Review TLS configuration and disable weak ciphers/protocols.',
        references: ['https://www.ssllabs.com/ssltest/'],
      });

      if (ep.details?.vulnBeast) {
        findings.push({
          findingId: uuidv4(),
          scanner: 'SSL Labs',
          severity: 'HIGH',
          title: 'BEAST TLS vulnerability reported',
          description: 'SSL Labs indicates BEAST.',
          evidence: 'vulnBeast=true',
          owaspCategory: 'A02:2021 – Cryptographic Failures',
          remediation: 'Update TLS stack / disable vulnerable protocols.',
          references: [],
        });
      }

      await Scan.findByIdAndUpdate(scanId, { $push: { findings: { $each: findings } } });
      logger.info(`[SSL Labs] Appended ${findings.length} findings to scan ${scanId}`);
    },
    { connection: getRedisConnection(), concurrency: 1 }
  );

  worker.on('failed', (j, err) => logger.error(`[SSL Labs worker] ${j?.id}: ${err.message}`));
  logger.info('SSL Labs BullMQ worker started');
  return worker;
};

module.exports = { startSslLabsWorker };
