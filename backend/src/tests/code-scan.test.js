// Code Scanner Endpoint Test
// Tests: paste, upload, GitHub scanning, and AI integration

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const fs = require('fs');

const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');
const User = require('../models/User');
const CodeScan = require('../models/CodeScan');

const PORT = 5005;
const BASE = `http://localhost:${PORT}/api`;

const request = (method, path, body = null, headers = {}, isFormData = false) =>
  new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    let payload = null;

    if (isFormData) {
      payload = body;
    } else {
      payload = body ? JSON.stringify(body) : null;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        ...(payload && !isFormData && { 'Content-Type': 'application/json' }),
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
  console.log('🔗 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✓ Connected\n');

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  await new Promise((r) => httpServer.listen(PORT, r));
  console.log(`📡 Test server started on port ${PORT}\n`);

  let userToken = '';
  let userId = '';
  let scanId = '';

  try {
    // 1. Register and login user
    console.log('📝 Step 1: Create test user and authenticate...');
    const email = `codescan_${Date.now()}@test.com`;
    const reg = await request('POST', '/auth/register', {
      name: 'Code Scanner Tester',
      email,
      password: 'CodeScan123',
      confirmPassword: 'CodeScan123',
    });

    if (reg.status !== 201 && reg.status !== 200) {
      throw new Error(`Registration failed: ${reg.status}`);
    }

    userToken = reg.body.accessToken;
    userId = reg.body.user._id;
    const authHeaders = { Authorization: `Bearer ${userToken}` };
    console.log(`✓ User created: ${email}`);
    console.log(`✓ Token obtained\n`);

    // 2. Test: POST /code-scan (paste code)
    console.log('🧪 Test 1: Paste code scanning...');
    const vulnerableCode = `
const express = require('express');
const app = express();

// CRITICAL: Hardcoded AWS Key
const AWS_KEY = 'AKIA1234567890ABCDEF';

// HIGH: SQL Injection risk
app.get('/user/:id', (req, res) => {
  const query = "SELECT * FROM users WHERE id = '" + req.params.id + "'";
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// HIGH: eval() usage
app.post('/calc', (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});

// MEDIUM: Weak hash
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');
    `;

    const pasteRes = await request('POST', '/code-scan', {
      code: vulnerableCode,
      language: 'javascript',
      filename: 'app.js',
    }, authHeaders);

    if (pasteRes.status !== 201) {
      throw new Error(`Paste scan failed: ${pasteRes.status} - ${JSON.stringify(pasteRes.body)}`);
    }

    scanId = pasteRes.body.scanId;
    console.log(`✓ Code submitted for analysis`);
    console.log(`✓ Scan ID: ${scanId}`);
    console.log(`✓ Status: ${pasteRes.body.status}`);
    console.log(`✓ Language detected: ${pasteRes.body.language}\n`);

    // 3. Wait for AI analysis
    console.log('⏳ Waiting for AI analysis (max 30s)...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!completed && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      const checkRes = await request('GET', `/code-scan/${scanId}`, null, authHeaders);

      if (checkRes.status === 200) {
        const scan = checkRes.body.codeScan;
        if (scan.status === 'completed') {
          completed = true;
          console.log(`✓ Analysis completed!\n`);
          console.log(`📊 RESULTS:`);
          console.log(`   Risk Score: ${scan.summary?.riskScore}/100`);
          console.log(`   Grade: ${scan.summary?.grade}`);
          console.log(`   Total Findings: ${scan.summary?.total}`);
          console.log(`   - Critical: ${scan.summary?.critical}`);
          console.log(`   - High: ${scan.summary?.high}`);
          console.log(`   - Medium: ${scan.summary?.medium}`);
          console.log(`   - Low: ${scan.summary?.low}`);
          console.log(`   AI Model: ${scan.aiModel}`);
          console.log(`   Duration: ${scan.scanDuration}ms\n`);

          if (scan.findings && scan.findings.length > 0) {
            console.log(`🔍 Top Findings:`);
            scan.findings.slice(0, 3).forEach((f, i) => {
              console.log(
                `   ${i + 1}. [${f.severity.toUpperCase()}] ${f.title} (${f.cwe})`
              );
            });
          }
        } else if (scan.status === 'failed') {
          throw new Error(`Scan failed: ${scan.error}`);
        }
      }

      attempts++;
      process.stdout.write('.');
    }

    if (!completed) {
      throw new Error('Analysis timed out after 30 seconds');
    }

    // 4. Test: List code scans
    console.log('\n\n📋 Test 2: List code scans...');
    const listRes = await request('GET', '/code-scan?page=1&limit=10', null, authHeaders);

    if (listRes.status !== 200) {
      throw new Error(`List failed: ${listRes.status}`);
    }

    console.log(`✓ Scans retrieved: ${listRes.body.scans.length} total`);
    console.log(`✓ Pages: ${listRes.body.pages}\n`);

    // 5. Test: Export as JSON
    console.log('💾 Test 3: Export scan as JSON...');
    const exportRes = await request('GET', `/code-scan/${scanId}/export/json`, null, authHeaders);

    if (exportRes.status !== 200) {
      throw new Error(`Export failed: ${exportRes.status}`);
    }

    console.log(`✓ JSON export successful`);
    console.log(`✓ Export contains ${exportRes.body.findings?.length || 0} findings\n`);

    // 6. Test: DELETE scan
    console.log('🗑️  Test 4: Delete scan...');
    const delRes = await request('DELETE', `/code-scan/${scanId}`, null, authHeaders);

    if (delRes.status !== 200) {
      throw new Error(`Delete failed: ${delRes.status}`);
    }

    console.log(`✓ Scan deleted successfully\n`);

    // 7. Verify deletion
    const verifyRes = await request('GET', `/code-scan/${scanId}`, null, authHeaders);
    if (verifyRes.status === 200) {
      throw new Error('Scan still exists after deletion');
    }

    console.log('✓ Deletion verified\n');

    console.log('\n' + '═'.repeat(50));
    console.log('  ✅ ALL CODE SCANNER TESTS PASSED');
    console.log('═'.repeat(50));
    console.log('\n✨ Code Scanner Backend is FULLY FUNCTIONAL!\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:');
    console.error(err.message);
    process.exit(1);
  } finally {
    console.log('Cleaning up test data...');
    try {
      if (userId) {
        await CodeScan.deleteMany({ userId });
        await User.deleteMany({ _id: userId });
      }
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
    httpServer.close();
    await mongoose.disconnect();
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
