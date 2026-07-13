const cron = require('node-cron');
const Target = require('../models/Target');
const Scan = require('../models/Scan');
const User = require('../models/User');
const Automation = require('../models/Automation');
const { enqueueScan } = require('../queues/scanQueue');
const { computeNextScanAt } = require('../services/scheduleUtils');
const logger = require('../utils/logger');

const startSchedulerWorker = () => {
  const pattern = process.env.SCHEDULER_CRON_INTERVAL || '* * * * *';
  cron.schedule(pattern, async () => {
    const now = new Date();
    try {
      const due = await Target.find({
        'schedule.enabled': true,
        'schedule.nextScanAt': { $lte: now },
      }).limit(25);

      for (const target of due) {
        const user = await User.findById(target.user);
        if (!user || user.planTier !== 'pro') {
          target.schedule.enabled = false;
          await target.save();
          continue;
        }

        if (!target.confirmedOwnership) {
          target.schedule.enabled = false;
          await target.save();
          continue;
        }

        const last = await Scan.findOne({
          target: target._id,
          status: 'completed',
        }).sort({ completedAt: -1 });

        const scan = await Scan.create({
          user: target.user,
          target: target._id,
          type: last?.type || 'passive',
          source: 'scheduled',
          previousScanId: last?._id || null,
          status: 'queued',
          progress: 0,
          startedAt: new Date(),
        });

        await enqueueScan(scan._id.toString(), target.url);

        target.schedule.nextScanAt = computeNextScanAt(
          target.schedule.frequency,
          target.schedule.customIntervalMinutes,
          now
        );
        await target.save();
        logger.info(`[Scheduler] Enqueued scheduled scan ${scan._id} for target ${target._id}`);
      }
      const dueAutomations = await Automation.find({
        isActive: true,
        nextRunAt: { $lte: now },
      }).limit(25).populate('target');

      for (const auto of dueAutomations) {
        const user = await User.findById(auto.user);
        if (!user) {
          auto.isActive = false;
          await auto.save();
          continue;
        }

        let target = auto.target;
        let targetUrl = auto.customInput;

        if (target) {
          if (!target.confirmedOwnership) {
            auto.isActive = false;
            await auto.save();
            continue;
          }
          targetUrl = target.url;
        } else if (targetUrl && (auto.tool === 'passive_scan' || auto.tool === 'subfinder' || auto.tool === 'port_scan')) {
          // Find or create target on the fly for website-related tools
          const sanitizedUrl = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
          target = await Target.findOne({
            user: auto.user,
            $or: [{ url: targetUrl }, { sanitizedUrl }],
          });

          if (!target) {
            target = await Target.create({
              user: auto.user,
              url: targetUrl,
              label: sanitizedUrl,
              confirmedOwnership: true,
            });
          }
        }

        // For this MVP, we create a generic Scan record if it's a passive scan type.
        // For other tools (code scan, email scan, etc.) you'd enqueue to their specific queues.
        // We will enqueue it as a passive scan if it uses the main engine.
        if (auto.tool === 'passive_scan' || auto.tool === 'subfinder' || auto.tool === 'port_scan') {
          if (!target) {
            logger.error(`[Scheduler] Automation ${auto._id} failed: No target specified/created for website scanning tool. Deactivating.`);
            auto.isActive = false;
            await auto.save();
            continue;
          }

          const options = {};
          if (auto.tool === 'port_scan') options.scanner = 'port';
          if (auto.tool === 'subfinder') options.scanner = 'subfinder';

          const scan = await Scan.create({
            user: auto.user,
            target: target._id,
            type: auto.tool === 'passive_scan' ? 'passive' : 'active', // Just approximating
            source: 'scheduled',
            status: 'queued',
            progress: 0,
            options,
            startedAt: new Date(),
          });
          
          if (targetUrl) {
            await enqueueScan(scan._id.toString(), targetUrl);
          }
        } else {
          // Placeholder for other queues (e.g. email scan queue, code scan queue)
          logger.info(`[Scheduler] Automation tool ${auto.tool} triggered for ${targetUrl}`);
        }

        auto.lastRunAt = now;
        auto.nextRunAt = computeNextScanAt(auto.schedule, 1440, now);
        await auto.save();
        logger.info(`[Scheduler] Enqueued automation ${auto._id} (tool: ${auto.tool})`);
      }
    } catch (e) {
      logger.error(`[Scheduler] ${e.message}`);
    }
  });
  logger.info(`Scheduler cron registered: ${pattern}`);
};

module.exports = { startSchedulerWorker };
