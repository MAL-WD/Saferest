// src/tests/phase1.test.js
// Phase 1 verification test — connects to MongoDB Atlas and validates all 4 models.
// Run with: node src/tests/phase1.test.js

require('dotenv').config();
const mongoose = require('mongoose');

// Config/Utils
const logger = require('../utils/logger');
const { rawFindingSchema, SEVERITY_LEVELS, OWASP_CATEGORIES } = require('../utils/findingSchema');

// Models
const User = require('../models/User');
const Target = require('../models/Target');
const Scan = require('../models/Scan');
const AIReport = require('../models/AIReport');

const TEST_EMAIL = `test_${Date.now()}@saferest-test.com`;

const run = async () => {
  try {
    console.log('\n Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(' Connected to MongoDB Atlas\n');

    console.log(' Test 1: Creating User...');
    const user = await User.create({
      name: 'Test User',
      email: TEST_EMAIL,
      password: 'TestPassword1',
    });
    console.log(`    User created: ${user._id}`);

    // Verify password is hashed
    const userWithPass = await User.findById(user._id).select('+password');
    if (userWithPass.password === 'TestPassword1') throw new Error('Password was stored in plaintext!');
    console.log('    Password is hashed (not plaintext)');

    // Verify comparePassword works
    const match = await userWithPass.comparePassword('TestPassword1');
    if (!match) throw new Error('comparePassword() failed for valid password');
    console.log('    comparePassword() works correctly');

    // Verify JWT generation
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    if (!accessToken || !refreshToken) throw new Error('Token generation failed');
    console.log('    Access token and refresh token generated\n');

    console.log(' Test 2: Rejecting weak password (no uppercase/number)...');
    try {
      await User.create({ name: 'Bad User', email: 'bad@test.com', password: 'weakpass' });
      throw new Error('Should have rejected weak password!');
    } catch (err) {
      if (err.name === 'ValidationError') {
        console.log('    Weak password correctly rejected\n');
      } else throw err;
    }

    console.log(' Test 3: Creating Target...');
    const target = await Target.create({
      user: user._id,
      url: 'https://example.com/path?query=1',
      label: 'Example Site',
      confirmedOwnership: true,
    });
    console.log(`    Target created: ${target._id}`);
    console.log(`    Sanitized URL: ${target.sanitizedUrl}\n`);

    console.log(' Test 4: Rejecting Target without ownership confirmation...');
    try {
      await Target.create({
        user: user._id,
        url: 'https://unauthorized.com',
        confirmedOwnership: false,
      });
      throw new Error('Should have rejected unconfirmed ownership!');
    } catch (err) {
      if (err.name === 'ValidationError') {
        console.log('    Target without ownership correctly rejected\n');
      } else throw err;
    }

    console.log(' Test 5: Creating Scan...');
    const scan = await Scan.create({
      user: user._id,
      target: target._id,
      type: 'passive',
      status: 'queued',
    });
    console.log(`    Scan created: ${scan._id}`);

    // Add a finding and calculate summary
    scan.findings.push({
      findingId: 'test-finding-001',
      scanner: 'HTTP Headers',
      severity: 'HIGH',
      title: 'Missing Content-Security-Policy header',
      description: 'The CSP header is not set, allowing potential XSS attacks.',
      evidence: 'Header not present in response',
      owaspCategory: 'A05:2021 – Security Misconfiguration',
      remediation: 'Add a Content-Security-Policy header.',
      references: ['https://owasp.org/Top10/A05_2021-Security_Misconfiguration/'],
    });
    scan.calculateSummary();
    await scan.save();
    console.log(`    Finding added and summary calculated: ${JSON.stringify(scan.summary)}\n`);

    console.log(' Test 6: Creating AIReport...');
    const report = await AIReport.create({
      scan: scan._id,
      user: user._id,
      executiveSummary: 'The target has 1 HIGH severity issue that needs immediate attention.',
      overallRiskScore: 72,
      findings: [
        {
          findingId: 'test-finding-001',
          priority: 8,
          remediationSteps: [
            'Add Content-Security-Policy header to all responses.',
            "Use a strict policy like `default-src 'self'`.",
          ],
          codeExample: {
            vulnerable: "// No CSP header set\nres.send('Hello');",
            fixed: "res.setHeader('Content-Security-Policy', \"default-src 'self'\");\nres.send('Hello');",
          },
          references: [
            'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
            'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
          ],
        },
      ],
      status: 'generated',
      generatedAt: new Date(),
      modelUsed: 'claude-sonnet-4-20250514',
    });
    console.log(`    AIReport created: ${report._id}\n`);

    console.log(' Cleaning up test documents...');
    await AIReport.deleteOne({ _id: report._id });
    await Scan.deleteOne({ _id: scan._id });
    await Target.deleteOne({ _id: target._id });
    await User.deleteOne({ _id: user._id });
    console.log('    Test documents cleaned up\n');

    console.log('═══════════════════════════════════════');
    console.log('  ALL PHASE 1 TESTS PASSED');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('\n PHASE 1 TEST FAILED:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
