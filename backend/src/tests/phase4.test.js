// src/tests/phase4.test.js
// Tests the orchestrator by running all 10 scanner modules against a test target.
// Bypasses the BullMQ queue and runs orchestrator.runScan() directly.

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Target = require('../models/Target');
const Scan = require('../models/Scan');
const { runScan } = require('../scanners/orchestrator');

// We use httpbin.org as a safe testing target because it reflects data well
// and doesn't mind automated testing.
const TEST_TARGET = 'https://httpbin.org';
const TEST_EMAIL = `phase4_${Date.now()}@test.com`;

const run = async () => {
  try {
    console.log(' Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(' Connected');

    console.log(' Creating test user and target...');
    const user = await User.create({ name: 'Phase 4 Tester', email: TEST_EMAIL, password: 'TestPassword1' });
    
    const target = await Target.create({
      user: user._id,
      url: TEST_TARGET,
      label: 'HTTPBin Test',
      confirmedOwnership: true,
    });

    const scan = await Scan.create({
      user: user._id,
      target: target._id,
      type: 'passive',
      status: 'queued',
    });

    console.log(`\n Starting orchestrator scan for ${TEST_TARGET}... (this takes ~10-20 seconds)`);
    console.log('   Testing all 10 modules concurrently...\n');

    const startTime = Date.now();
    
    // Run the orchestrator directly
    await runScan(scan._id, target.url);

    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(1);

    // Fetch final scan from DB
    const finalScan = await Scan.findById(scan._id);

    // Assertions
    if (finalScan.status !== 'completed') {
      throw new Error(`Scan status is '${finalScan.status}', expected 'completed'`);
    }

    if (finalScan.progress !== 100) {
      throw new Error(`Scan progress is ${finalScan.progress}, expected 100`);
    }

    const { summary, findings } = finalScan;

    console.log(` Scan completed successfully in ${durationSec}s`);
    console.log(` Progress is 100%`);
    console.log(` Total Findings: ${summary.total}`);
    console.log(`   - Critical: ${summary.critical}`);
    console.log(`   - High: ${summary.high}`);
    console.log(`   - Medium: ${summary.medium}`);
    console.log(`   - Low: ${summary.low}`);
    console.log(`   - Info: ${summary.info}`);

    // Verify finding schema is intact
    if (findings.length > 0) {
      const sample = findings[0];
      if (!sample.findingId || !sample.scanner || !sample.severity) {
        throw new Error('Finding schema validation failed. Missing required fields.');
      }
      console.log(`\n Sample Finding: [${sample.severity}] ${sample.title} (from ${sample.scanner})`);
    }

    console.log('\n Cleaning up test data...');
    await Scan.findByIdAndDelete(scan._id);
    await Target.findByIdAndDelete(target._id);
    await User.findByIdAndDelete(user._id);
    
    console.log('\n═══════════════════════════════════════');
    console.log('  ALL PHASE 4 TESTS PASSED');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n PHASE 4 TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
