// src/tests/phase2.test.js
// Phase 2 verification test — starts the server and tests all 5 auth endpoints.
// Run with: node src/tests/phase2.test.js
// Prerequisites: server must NOT be running separately (test starts its own instance)

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');
const User = require('../models/User');

const PORT = 5001; // use different port to avoid conflicts
const BASE = `http://localhost:${PORT}/api`;

// Simple HTTP client helper
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
        // Extract set-cookie header
        const cookies = res.headers['set-cookie'] || [];
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), cookies });
        } catch {
          resolve({ status: res.statusCode, body: data, cookies });
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

const TEST_EMAIL = `phase2_${Date.now()}@saferest-test.com`;
let accessToken = '';
let refreshCookie = '';

const run = async () => {
  // Start server
  await connectDB();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  await new Promise((r) => httpServer.listen(PORT, r));
  console.log(`\n Test server started on port ${PORT}\n`);

  try {

    console.log(' Test 1: Health check...');
    const health = await request('GET', '/../health');
    assert(health.status === 200, `Expected 200, got ${health.status}`);
    assert(health.body.success === true, 'Health check failed');
    console.log('    Health endpoint OK\n');

    console.log(' Test 2: Register new user...');
    const reg = await request('POST', '/auth/register', {
      name: 'Test User',
      email: TEST_EMAIL,
      password: 'TestPass1',
      confirmPassword: 'TestPass1',
    });
    assert(reg.status === 201, `Expected 201, got ${reg.status}: ${JSON.stringify(reg.body)}`);
    assert(reg.body.accessToken, 'No access token returned');
    assert(reg.cookies.some((c) => c.startsWith('refreshToken=')), 'No refreshToken cookie set');
    accessToken = reg.body.accessToken;
    refreshCookie = reg.cookies.find((c) => c.startsWith('refreshToken='));
    console.log('    User registered, access token and refresh cookie received\n');

    console.log(' Test 3: Reject duplicate registration...');
    const dup = await request('POST', '/auth/register', {
      name: 'Duplicate',
      email: TEST_EMAIL,
      password: 'TestPass1',
      confirmPassword: 'TestPass1',
    });
    assert(dup.status === 409, `Expected 409, got ${dup.status}`);
    console.log('    Duplicate email correctly rejected\n');

    console.log(' Test 4: Login with valid credentials...');
    const login = await request('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: 'TestPass1',
    });
    assert(login.status === 200, `Expected 200, got ${login.status}: ${JSON.stringify(login.body)}`);
    assert(login.body.accessToken, 'No access token on login');
    accessToken = login.body.accessToken;
    refreshCookie = login.cookies.find((c) => c.startsWith('refreshToken='));
    console.log('    Login successful, tokens received\n');

    console.log(' Test 5: Reject incorrect password...');
    const badLogin = await request('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: 'WrongPass1',
    });
    assert(badLogin.status === 401, `Expected 401, got ${badLogin.status}`);
    console.log('    Wrong password correctly rejected\n');

    console.log(' Test 6: GET /me with valid access token...');
    const me = await request('GET', '/auth/me', null, { Authorization: `Bearer ${accessToken}` });
    assert(me.status === 200, `Expected 200, got ${me.status}: ${JSON.stringify(me.body)}`);
    assert(me.body.user.email === TEST_EMAIL, 'Wrong user returned');
    assert(!me.body.user.password, 'Password leaked in response!');
    console.log('    /me returns correct user without password\n');

    console.log(' Test 7: Reject invalid token on /me...');
    const badMe = await request('GET', '/auth/me', null, { Authorization: 'Bearer invalid.token.here' });
    assert(badMe.status === 401, `Expected 401, got ${badMe.status}`);
    console.log('    Invalid token correctly rejected\n');

    console.log(' Test 8: Refresh access token via cookie...');
    const refreshCookieValue = refreshCookie?.split(';')[0];
    const ref = await request('POST', '/auth/refresh', null, { Cookie: refreshCookieValue });
    assert(ref.status === 200, `Expected 200, got ${ref.status}: ${JSON.stringify(ref.body)}`);
    assert(ref.body.accessToken, 'No new access token returned from refresh');
    console.log('    Access token refreshed successfully\n');

    console.log(' Test 9: Validate password strength on registration...');
    const weakReg = await request('POST', '/auth/register', {
      name: 'Weak',
      email: 'weak@test.com',
      password: 'weakpass',
      confirmPassword: 'weakpass',
    });
    assert(weakReg.status === 400, `Expected 400, got ${weakReg.status}`);
    console.log('    Weak password rejected at validation layer\n');

    console.log(' Cleaning up test user...');
    await User.deleteOne({ email: TEST_EMAIL });
    console.log('    Test user removed\n');

    console.log('═══════════════════════════════════════');
    console.log('  ALL PHASE 2 TESTS PASSED');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('\n PHASE 2 TEST FAILED:');
    console.error(error.message);
    // Cleanup on failure too
    await User.deleteOne({ email: TEST_EMAIL }).catch(() => {});
    process.exit(1);
  } finally {
    httpServer.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
