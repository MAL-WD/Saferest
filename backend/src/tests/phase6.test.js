// src/tests/phase6.test.js
// Tests the Webhook endpoint that the Python AI Service calls.
// Validates secret header logic, MongoDB upserts, and Socket.IO real-time emission.

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { io: Client } = require('socket.io-client');

const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');
const User = require('../models/User');
const Target = require('../models/Target');
const Scan = require('../models/Scan');
const AIReport = require('../models/AIReport');

const PORT = 5004;
const BASE = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;

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

const run = async () => {
  console.log(' Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(' Connected');

  const httpServer = http.createServer(app);
  initSocket(httpServer);
  
  await new Promise((r) => httpServer.listen(PORT, r));
  console.log(`\n Test server started on port ${PORT}\n`);

  let socket;
  let userToken = '';
  let userId = '';
  let targetId = '';
  let scanId = '';

  try {
    // 1. Setup minimal required data
    console.log(' Setup User & Scan Data...');
    const reg = await request('POST', '/auth/register', {
      name: 'Phase 6 Tester',
      email: `p6_${Date.now()}@test.com`,
      password: 'TestPassword1',
      confirmPassword: 'TestPassword1',
    });
    userToken = reg.body.accessToken;
    userId = reg.body.user._id;
    const headers = { Authorization: `Bearer ${userToken}` };

    const tCreate = await request('POST', '/targets', {
      url: 'https://example.com',
      confirmedOwnership: true,
    }, headers);
    targetId = tCreate.body.target._id;

    // We manually insert a scan to simulate an already completed scan
    const scan = await Scan.create({
      user: userId,
      target: targetId,
      type: 'passive',
      status: 'completed',
    });
    scanId = scan._id.toString();
    console.log(`    DB Prep done. Scan ID: ${scanId}\n`);

    // 2. Setup Socket.IO to listen for the notification
    console.log(' Connecting Socket.IO client...');
    socket = Client(SOCKET_URL, {
      auth: { token: userToken },
      transports: ['websocket', 'polling'],
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
    });
    socket.emit('join:scan', scanId);
    console.log('    Socket listening on room: scan:' + scanId + '\n');

    // 3. Test Webhook Authentication Rejection
    console.log('  Testing Webhook Auth Rejection...');
    const wFail = await request('POST', '/reports/webhook', {
      scanId,
      userId,
      executiveSummary: 'Should fail',
    }, { 'x-ai-secret': 'wrong_secret' });
    
    if (wFail.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${wFail.status}`);
    console.log('    Webhook correctly rejected invalid secret.\n');

    // 4. Test Successful Webhook Delivery (Simulating the Python script)
    console.log(' Simulating Python AI Service publishing report...');
    
    // Setup a listener for the expected socket event
    let reportReadyFired = false;
    socket.on('report:ready', (data) => {
      if (data.scanId === scanId && data.reportId) {
        reportReadyFired = true;
        console.log(`    SOCKET EVENT RECEIVED: report:ready for scan ${data.scanId}`);
      }
    });

    const wSuccess = await request('POST', '/reports/webhook', {
      scanId,
      userId,
      status: 'generated',
      executiveSummary: 'This is the AI generated summary.',
      overallRiskScore: 85,
    }, { 'x-ai-secret': process.env.AI_WEBHOOK_SECRET || 'saferest_internal_ai_webhook_secret_123' });

    if (wSuccess.status !== 200) throw new Error(`Expected 200 OK, got ${wSuccess.status}`);
    console.log('    Webhook processed successfully by Node server.');

    // 5. Verify the DB insertion
    const savedReport = await AIReport.findOne({ scan: scanId });
    if (!savedReport) throw new Error('AI Report was not saved to MongoDB!');
    if (savedReport.overallRiskScore !== 85) throw new Error('Report data mismatch!');
    console.log('    Report verified in MongoDB Atlas.');

    // Wait briefly for socket event to arrive
    await new Promise(r => setTimeout(r, 500));
    if (!reportReadyFired) throw new Error('Did not receive report:ready socket event!');
    
    console.log('\n Phase 6 integration point works flawlessly!');

    console.log('\n Cleaning up test data...');
    await AIReport.deleteMany({ user: userId });
    await Scan.deleteMany({ user: userId });
    await Target.deleteMany({ user: userId });
    await User.deleteMany({ _id: userId });
    console.log('    Cleanup complete\n');

    console.log('═══════════════════════════════════════');
    console.log('  ALL PHASE 6 TESTS PASSED');
    console.log('═══════════════════════════════════════\n');

  } catch (err) {
    console.error('\n PHASE 6 TEST FAILED:');
    console.error(err);
    process.exit(1);
  } finally {
    if (socket) socket.disconnect();
    httpServer.close();
    await mongoose.disconnect();
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
