// src/tests/phase5.test.js
// Tests the BullMQ background worker and Socket.IO real-time event streaming.
// We start the server, create a target, enqueue a scan via API, and listen to the socket events
// to prove the orchestrator is running in the background and streaming progress back.

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { io: Client } = require('socket.io-client');

const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');
const { startScanWorker } = require('../workers/scanWorker');
const User = require('../models/User');
const Target = require('../models/Target');
const Scan = require('../models/Scan');

const PORT = 5003;
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
  
  // Start the background worker process!
  const worker = startScanWorker();

  await new Promise((r) => httpServer.listen(PORT, r));
  console.log(`\n Test server started on port ${PORT}\n`);

  let socket;
  let userToken = '';
  let targetId = '';
  let scanId = '';

  try {
    console.log(' Setup Auth User...');
    const reg = await request('POST', '/auth/register', {
      name: 'Phase 5 Tester',
      email: `p5_${Date.now()}@test.com`,
      password: 'TestPassword1',
      confirmPassword: 'TestPassword1',
    });
    userToken = reg.body.accessToken;
    const headers = { Authorization: `Bearer ${userToken}` };

    console.log(' Create Target...');
    const tCreate = await request('POST', '/targets', {
      url: 'https://httpbin.org',
      confirmedOwnership: true,
    }, headers);
    targetId = tCreate.body.target._id;

    console.log(' Connecting Socket.IO client...');
    socket = Client(SOCKET_URL, {
      auth: { token: userToken },
      transports: ['websocket', 'polling'], // Fallback if WS fails
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
    });
    console.log('    Socket connected successfully');

    // Start listening for scan events BEFORE hitting the API
    const eventsReceived = {
      started: false,
      progress: 0,
      findings: 0,
      completed: false,
    };

    socket.on('scan:started', (data) => {
      eventsReceived.started = true;
      console.log(` Event received: scan:started (${data.scanId})`);
    });

    socket.on('scan:progress', (data) => {
      eventsReceived.progress = data.percent;
      console.log(` Event received: scan:progress (${data.percent}%) modules: ${data.scanner}`);
    });

    socket.on('scan:finding', (data) => {
      eventsReceived.findings++;
      console.log(` Event received: scan:finding [${data.finding.severity}] ${data.finding.title}`);
    });

    socket.on('scan:completed', (data) => {
      eventsReceived.completed = true;
      console.log(` Event received: scan:completed (Total findings: ${data.summary.total})`);
    });

    console.log('\n Triggering Scan via API (which queues to BullMQ)...');
    const sCreate = await request('POST', '/scans', {
      targetId,
      type: 'passive',
    }, headers);
    
    if (sCreate.status !== 201) throw new Error(`Failed to create scan: ${sCreate.status}`);
    scanId = sCreate.body.scanId;

    // Join the specific scan room
    socket.emit('join:scan', scanId);
    console.log(`    API responded instantly. Scan ${scanId} queued.`);
    console.log(`    Waiting for BullMQ worker to process and emit socket events (up to 30s)...\n`);

    // Wait for the scan to complete via socket events (timeout 30s)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Scan timed out waiting for completion event'));
      }, 30000);

      socket.on('scan:completed', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.on('scan:failed', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Scan failed event: ${err.error}`));
      });
    });

    // Final checks
    if (!eventsReceived.started) throw new Error('Did not receive scan:started event');
    if (eventsReceived.progress !== 100) throw new Error(`Final progress was ${eventsReceived.progress}%, expected 100%`);
    if (!eventsReceived.completed) throw new Error('Did not receive scan:completed event');

    console.log('\n Background processing (BullMQ) + Socket streaming works perfectly!');

    console.log('\n Cleaning up...');
    await worker.close(); // gracefully shutdown bullmq worker
    await Scan.deleteMany({ user: reg.body.user._id });
    await Target.deleteMany({ user: reg.body.user._id });
    await User.deleteMany({ email: reg.body.user.email });
    console.log('    Cleanup complete\n');

    console.log('═══════════════════════════════════════');
    console.log('  ALL PHASE 5 TESTS PASSED');
    console.log('═══════════════════════════════════════\n');

  } catch (err) {
    console.error('\n PHASE 5 TEST FAILED:');
    console.error(err);
    process.exit(1);
  } finally {
    if (socket) socket.disconnect();
    httpServer.close();
    await mongoose.disconnect();
    
    // Hard exit to close any lingering redis connections in worker
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
