// src/tests/phase3.test.js
// Phase 3 verification test — tests Targets, Scans, and Reports CRUD routes.

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');
const User = require('../models/User');
const Target = require('../models/Target');
const Scan = require('../models/Scan');
const AIReport = require('../models/AIReport');

const PORT = 5002;
const BASE = `http://localhost:${PORT}/api`;

const request = (method, path, body = null, headers = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

const assert = (condition, message) => {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
};

let userToken = '';
let targetId = '';
let scanId = '';

const run = async () => {
  await connectDB();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  await new Promise((r) => httpServer.listen(PORT, r));
  console.log(`\n Test server started on port ${PORT}\n`);

  try {
    // 1. Setup Auth
    console.log(' Test 1: Setup Auth User...');
    const reg = await request('POST', '/auth/register', {
      name: 'Phase 3 Tester',
      email: `p3_${Date.now()}@test.com`,
      password: 'TestPassword1',
      confirmPassword: 'TestPassword1',
    });
    userToken = reg.body.accessToken;
    const headers = { Authorization: `Bearer ${userToken}` };
    console.log('    Setup complete\n');

    // 2. Target Creation
    console.log(' Test 2: Create Target...');
    const tCreate = await request('POST', '/targets', {
      url: 'https://scanme.nmap.org',
      confirmedOwnership: true,
    }, headers);
    assert(tCreate.status === 201, `Target creation failed: ${tCreate.status}`);
    targetId = tCreate.body.target._id;
    console.log('    Target created successfully\n');

    // 3. Reject target missing ownership
    console.log(' Test 3: Reject Target without ownership...');
    const tRej = await request('POST', '/targets', {
      url: 'https://google.com',
      confirmedOwnership: false,
    }, headers);
    assert(tRej.status === 400, `Target should be rejected 400, got ${tRej.status}`);
    console.log('    Missing ownership safely rejected\n');

    // 4. List targets
    console.log(' Test 4: List Targets...');
    const tList = await request('GET', '/targets', null, headers);
    assert(tList.status === 200 && tList.body.targets.length === 1, 'Target list failed');
    console.log('    Target listed\n');

    // 5. Create Scan
    console.log(' Test 5: Create Scan...');
    const sCreate = await request('POST', '/scans', {
      targetId,
      type: 'passive',
    }, headers);
    assert(sCreate.status === 201, `Scan creation failed: ${sCreate.status}`);
    scanId = sCreate.body.scanId;
    console.log('    Scan created successfully\n');

    // 6. Get Scan Details
    console.log(' Test 6: Get Scan Details...');
    const sGet = await request('GET', `/scans/${scanId}`, null, headers);
    assert(sGet.status === 200, 'Scan fetch failed');
    assert(sGet.body.scan.target.url === 'https://scanme.nmap.org', 'Scan populated target failed');
    console.log('    Scan fetched with populated target\n');

    // 7. List Scans
    console.log(' Test 7: List Scans (pagination)...');
    const sList = await request('GET', '/scans?page=1&limit=5', null, headers);
    assert(sList.status === 200 && sList.body.scans.length === 1, 'Scan list failed');
    assert(!sList.body.scans[0].findings, 'Scan list should exclude findings array');
    console.log('    Scan list works (findings excluded)\n');

    // 8. Fetch Report (404 expected as scan is queued)
    console.log(' Test 8: Fetch Report for queued scan...');
    const r404 = await request('GET', `/reports/${scanId}`, null, headers);
    assert(r404.status === 404, `Missing report should 404, got ${r404.status}`);
    console.log('    Queued scan correctly returns 404 for report\n');

    // 9. Fake scan completion and fetch report (202 expected)
    console.log(' Test 9: Fetch Report for completed scan without report yet...');
    await Scan.findByIdAndUpdate(scanId, { status: 'completed' });
    const r202 = await request('GET', `/reports/${scanId}`, null, headers);
    assert(r202.status === 202, `Missing report for completed scan should 202, got ${r202.status}`);
    console.log('    Completed scan correctly returns 202 indicating AI generation in progress\n');

    // 10. Fake AI report creation and fetch again (200 expected)
    console.log(' Test 10: Fetch completed AI Report...');
    await AIReport.create({
      scan: scanId,
      user: reg.body.user._id,
      executiveSummary: 'Test Summary',
      overallRiskScore: 50,
      status: 'generated',
    });
    const r200 = await request('GET', `/reports/${scanId}`, null, headers);
    assert(r200.status === 200, `Ready report should 200, got ${r200.status}`);
    assert(r200.body.report.overallRiskScore === 50, 'Report data mismatched');
    console.log('    Report fetched successfully\n');

    console.log(' Cleaning up...');
    await AIReport.deleteMany({ user: reg.body.user._id });
    await Scan.deleteMany({ user: reg.body.user._id });
    await Target.deleteMany({ user: reg.body.user._id });
    await User.deleteMany({ email: reg.body.user.email });
    console.log('    Cleanup complete\n');

    console.log('═══════════════════════════════════════');
    console.log('  ALL PHASE 3 TESTS PASSED');
    console.log('═══════════════════════════════════════\n');
  } catch (err) {
    console.error('\n PHASE 3 TEST FAILED:');
    console.error(err);
    process.exit(1);
  } finally {
    httpServer.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
