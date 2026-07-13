// cleanup-automations.js — One-time script to delete all automations and disable scheduled scans
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Automation = require('./src/models/Automation');
    const Target = require('./src/models/Target');

    // 1. Delete all automations
    const autoResult = await Automation.deleteMany({});
    console.log(`Deleted ${autoResult.deletedCount} automation(s)`);

    // 2. Disable all scheduled scans on targets
    const targetResult = await Target.updateMany(
      { 'schedule.enabled': true },
      { $set: { 'schedule.enabled': false, 'schedule.nextScanAt': null } }
    );
    console.log(`Disabled scheduling on ${targetResult.modifiedCount} target(s)`);

    console.log('Cleanup complete!');
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanup();
