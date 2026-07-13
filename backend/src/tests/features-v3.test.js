/**
 * End-to-end checks for v3 features (email scan, code scan, traffic, scores, firewall, schedule, externalAPIs).
 * Requires: backend on TEST_API_URL (default http://localhost:5000), MongoDB, Redis, optional AI for long steps.
 *
 * Run: npm run test:v3
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const BASE = process.env.TEST_API_URL || 'http://localhost:5000';
const API = `${BASE.replace(/\/$/, '')}/api`;

const results = { pass: 0, fail: 0, skip: 0 };

function ok(name, cond, detail = '') {
  if (cond) {
    results.pass++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    results.fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function skip(name, reason) {
  results.skip++;
  console.log(`  SKIP  ${name} — ${reason}`);
}

async function main() {
  console.log(`\n=== Saferest v3 feature tests ===\nAPI: ${API}\n`);

  // 1) Health
  try {
    const { data } = await axios.get(`${BASE}/health`, { timeout: 5000 });
    ok('Health', data?.success && data?.status === 'healthy', JSON.stringify(data).slice(0, 80));
  } catch (e) {
    ok('Health', false, e.message);
    console.log('\nStart the backend (npm run dev) and ensure MongoDB + Redis are reachable.\n');
    process.exit(1);
  }

  const email = `v3_${Date.now()}@saferest-test.local`;
  const password = 'TestPass1';

  // 2) Register
  let token;
  try {
    const { data } = await axios.post(
      `${API}/auth/register`,
      {
        name: 'V3 Tester',
        email,
        password,
        confirmPassword: password,
      },
      { timeout: 15000 }
    );
    token = data.accessToken;
    ok('Auth register', !!token, email);
  } catch (e) {
    ok('Auth register', false, e.response?.data?.message || e.message);
    process.exit(1);
  }

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  let userId;
  // 3) Me
  try {
    const { data } = await axios.get(`${API}/auth/me`, { ...auth, timeout: 5000 });
    userId = data?.user?._id || data?.user?.id;
    ok('Auth /me', data?.user?.email === email);
  } catch (e) {
    ok('Auth /me', false, e.message);
  }

  // 4) externalAPIs (unit, no HTTP)
  try {
    const ext = require('../services/externalAPIs');
    const doh = await ext.cloudflareDoH('cloudflare.com', 'TXT');
    ok('externalAPIs.cloudflareDoH', !!doh && (doh.Status !== undefined || Array.isArray(doh.Answer)));
  } catch (e) {
    ok('externalAPIs.cloudflareDoH', false, e.message);
  }

  // 5) Scores (empty list OK)
  try {
    const { data } = await axios.get(`${API}/scores`, { ...auth, timeout: 10000 });
    ok('GET /scores', data?.success && Array.isArray(data.scores));
  } catch (e) {
    ok('GET /scores', false, e.response?.data?.message || e.message);
  }

  // 6) Firewall advise (needs AI)
  try {
    const { data } = await axios.post(
      `${API}/firewall/advise`,
      {
        findingsSummary:
          'High: Reflected XSS on /q param. Medium: Missing CSP. High: TLS 1.0 enabled on port 443.',
        stackHint: 'nginx reverse proxy',
      },
      { ...auth, timeout: 120000 }
    );
    ok(
      'POST /firewall/advise',
      data?.iptables || data?.nftables || data?.nginx,
      data?.disclaimer ? 'has disclaimer' : ''
    );
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    if (msg.includes('503') || msg.includes('ECONNREFUSED') || e.code === 'ECONNREFUSED') {
      skip('POST /firewall/advise', 'AI service unavailable');
    } else {
      ok('POST /firewall/advise', false, msg);
    }
  }

  // 7) Email scan (needs AI)
  try {
    const { data } = await axios.post(
      `${API}/email-scan`,
      { domain: 'cloudflare.com', confirmedAuthorization: true },
      { ...auth, timeout: 120000 }
    );
    ok(
      'POST /email-scan',
      data?.success && data?.emailScan?.results,
      `grade=${data?.emailScan?.grade}`
    );
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    if (e.code === 'ECONNREFUSED' || String(msg).includes('ECONNREFUSED')) {
      skip('POST /email-scan', 'AI service unavailable');
    } else {
      ok('POST /email-scan', false, msg);
    }
  }

  try {
    const { data } = await axios.get(`${API}/email-scan`, { ...auth, timeout: 5000 });
    ok('GET /email-scan list', data?.success && Array.isArray(data.scans));
  } catch (e) {
    ok('GET /email-scan list', false, e.message);
  }

  // 8) Code scan (needs AI)
  try {
    const { data } = await axios.post(
      `${API}/code-scan`,
      {
        code: "const x = process.env.API_KEY; eval(userInput);",
        language: 'javascript',
        filename: 'bad.js',
      },
      { ...auth, timeout: 120000 }
    );
    ok('POST /code-scan', data?.success && data?.codeScan?.findings !== undefined, `findings=${data?.codeScan?.findings?.length}`);
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    if (e.code === 'ECONNREFUSED' || String(msg).includes('ECONNREFUSED')) {
      skip('POST /code-scan', 'AI service unavailable');
    } else {
      ok('POST /code-scan', false, msg);
    }
  }

  // 9) Traffic log upload (needs AI)
  try {
    const fd = new FormData();
    fd.append(
      'file',
      Buffer.from('192.168.1.1 - - [01/Jan/2024:12:00:00 +0000] "GET /admin?x=<script> HTTP/1.1" 200 1234\n'),
      { filename: 'access.log', contentType: 'text/plain' }
    );
    const { data } = await axios.post(`${API}/traffic/upload`, fd, {
      ...auth,
      headers: { ...auth.headers, ...fd.getHeaders() },
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    ok('POST /traffic/upload (log)', data?.success && data?.analysis?.status === 'completed', data?.analysis?.summary?.slice(0, 60));
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    if (e.code === 'ECONNREFUSED' || String(msg).includes('ECONNREFUSED')) {
      skip('POST /traffic/upload (log)', 'AI service unavailable');
    } else {
      ok('POST /traffic/upload (log)', false, msg);
    }
  }

  // 10) Target + schedule (free tier → 403 when enabling)
  let targetId;
  try {
    const { data } = await axios.post(
      `${API}/targets`,
      {
        url: 'https://example.com',
        label: 'v3 schedule test',
        confirmedOwnership: true,
      },
      { ...auth, timeout: 15000 }
    );
    targetId = data.target?._id;
    ok('POST /targets', !!targetId);
  } catch (e) {
    ok('POST /targets', false, e.response?.data?.message || e.message);
  }

  if (targetId) {
    try {
      await axios.patch(
        `${API}/targets/${targetId}/schedule`,
        { schedule: { enabled: true, frequency: 'daily', emailAlerts: true } },
        { ...auth, timeout: 5000 }
      );
      ok('PATCH /targets/:id/schedule (free → 403)', false, 'expected 403 for free tier');
    } catch (e) {
      const st = e.response?.status;
      ok('PATCH /targets/:id/schedule (free → 403)', st === 403, `status=${st}`);
    }
  }

  // 11) scanDiff (DB) — needs userId + targetId from above
  try {
    const { diffFindings, fingerprint } = require('../services/scanDiff');
    const mk = (id, title, sev, ev) => ({
      findingId: id,
      scanner: 'TestScanner',
      severity: sev,
      title,
      description: 'test finding',
      evidence: ev,
      owaspCategory: 'Other',
    });
    const a = mk('f-a', 'Shared finding', 'HIGH', 'same-evidence');
    const b = mk('f-b', 'New finding', 'LOW', 'new-evidence');
    ok('scanDiff.fingerprint stable', fingerprint(a) === fingerprint(a));
    if (!userId || !targetId) {
      skip('scanDiff.diffFindings', 'missing userId or targetId from earlier steps');
    } else {
      const Scan = require('../models/Scan');
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
      }
      const id1 = new mongoose.Types.ObjectId();
      const id2 = new mongoose.Types.ObjectId();
      await Scan.deleteMany({ _id: { $in: [id1, id2] } });
      await Scan.create({
        _id: id1,
        user: userId,
        target: targetId,
        type: 'passive',
        status: 'completed',
        findings: [a],
      });
      await Scan.create({
        _id: id2,
        user: userId,
        target: targetId,
        type: 'passive',
        status: 'completed',
        findings: [a, b],
      });
      const d = await diffFindings(id1, id2);
      await Scan.deleteMany({ _id: { $in: [id1, id2] } });
      ok('scanDiff.diffFindings', d.newFindings.length === 1 && d.resolvedFindings.length === 0);
    }
  } catch (e) {
    ok('scanDiff.diffFindings', false, e.message);
  }

  console.log(`\n=== Summary: ${results.pass} passed, ${results.fail} failed, ${results.skip} skipped ===\n`);
  process.exit(results.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
