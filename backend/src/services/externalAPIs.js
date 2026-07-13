// Centralized external API client: Redis cache (1h TTL), error handling, graceful fallbacks.
// All outbound integrations should go through this module — not raw axios from routes/scanners.

const crypto = require('crypto');
const axios = require('axios');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL_SEC = 3600;

const hashKey = (parts) =>
  crypto.createHash('sha256').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 48);

const isRedisCacheAvailable = () => {
  try {
    const redisConnection = getRedisConnection();
    return redisConnection.status === 'ready';
  } catch (_) {
    return false;
  }
};

async function cacheGet(key) {
  if (!isRedisCacheAvailable()) return null;
  try {
    const redisConnection = getRedisConnection();
    const raw = await redisConnection.get(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    logger.debug(`[externalAPIs] cache get miss: ${e.message}`);
  }
  return null;
}

async function cacheSet(key, value) {
  if (!isRedisCacheAvailable()) return;
  try {
    const redisConnection = getRedisConnection();
    await redisConnection.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SEC);
  } catch (e) {
    logger.debug(`[externalAPIs] cache set skip: ${e.message}`);
  }
}

async function withCache(namespace, parts, fetcher) {
  const key = `extapi:${namespace}:${hashKey(parts)}`;
  const hit = await cacheGet(key);
  if (hit !== null) return hit;
  try {
    const data = await fetcher();
    if (data !== undefined && data !== null) await cacheSet(key, data);
    return data;
  } catch (e) {
    logger.warn(`[externalAPIs] ${namespace}: ${e.message}`);
    return null;
  }
}

function safeAxios(config) {
  return axios({
    timeout: 20000,
    validateStatus: () => true,
    ...config,
  });
}

/** Cloudflare DNS-over-HTTPS (JSON) */
async function cloudflareDoH(name, type = 'TXT') {
  const base = process.env.CLOUDFLARE_DOH_URL || 'https://cloudflare-dns.com/dns-query';
  return withCache('doh', [name, type], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: base,
      params: { name, type },
      headers: { Accept: 'application/dns-json' },
    });
    if (res.status !== 200 || !res.data) return { Status: -1, Answer: [] };
    return res.data;
  });
}

/** HackerTarget — plain text body */
async function hackerTarget(path, q) {
  const base = (process.env.HACKERTARGET_BASE_URL || 'https://api.hackertarget.com').replace(/\/$/, '');
  return withCache('hackertarget', [path, q], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: `${base}${path}`,
      params: { q },
    });
    if (res.status !== 200) return { raw: null, error: `HTTP ${res.status}` };
    return { raw: typeof res.data === 'string' ? res.data : String(res.data || '') };
  });
}

async function hackerTargetNmap(host) {
  const r = await hackerTarget('/nmap/', host);
  return r;
}

async function hackerTargetHostSearch(domain) {
  const r = await hackerTarget('/hostsearch/', domain);
  return r;
}

async function hackerTargetDnsLookup(domain) {
  const r = await hackerTarget('/dnslookup/', domain);
  return r;
}

async function hackerTargetZoneTransfer(domain) {
  const r = await hackerTarget('/zonetransfer/', domain);
  return r;
}

async function hackerTargetReverseDns(ip) {
  const r = await hackerTarget('/reversedns/', ip);
  return r;
}

/** Shodan InternetDB */
async function shodanInternetDb(ip) {
  return withCache('shodan_idb', [ip], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: `https://internetdb.shodan.io/${encodeURIComponent(ip)}`,
    });
    if (res.status !== 200) return null;
    return res.data;
  });
}

/** SecurityTrails (optional API key) */
async function securityTrailsGet(path) {
  const apiKey = process.env.SECURITY_TRAILS_API_KEY;
  const base = (process.env.SECURITY_TRAILS_BASE_URL || 'https://api.securitytrails.com/v1').replace(/\/$/, '');
  if (!apiKey) return null;
  return withCache('sectrails', [path], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: `${base}${path}`,
      headers: { APIKEY: apiKey },
    });
    if (res.status !== 200) return null;
    return res.data;
  });
}

async function securityTrailsSubdomains(domain) {
  return securityTrailsGet(`/domain/${domain}/subdomains`);
}

async function securityTrailsDnsHistory(domain) {
  return securityTrailsGet(`/history/${domain}/dns/a`);
}

async function securityTrailsAssociatedDomains(domain) {
  return securityTrailsGet(`/domain/${domain}/associated`);
}

/** SSL Labs — use skipCache:true from BullMQ poller while status is not READY */
async function sslLabsAnalyze(host, startNew = false, options = {}) {
  const { skipCache = false } = options;
  const base = (process.env.SSL_LABS_BASE_URL || 'https://api.ssllabs.com/api/v3').replace(/\/$/, '');
  const fetchOnce = async () => {
    const res = await safeAxios({
      method: 'GET',
      url: `${base}/analyze`,
      params: {
        host,
        startNew: startNew ? 'on' : undefined,
        all: 'done',
      },
    });
    if (res.status !== 200) return null;
    return res.data;
  };
  if (skipCache) return fetchOnce();
  return withCache('ssllabs', [host, startNew ? 'new' : 'poll'], fetchOnce);
}

/** VirusTotal domain report */
async function virusTotalDomain(domain) {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return null;
  return withCache('vt_domain', [domain], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`,
      headers: { 'x-apikey': key },
    });
    if (res.status !== 200) return null;
    return res.data;
  });
}

/** AbuseIPDB */
async function abuseIpDbCheck(ip) {
  const key = process.env.ABUSEIPDB_API_KEY;
  if (!key) return null;
  return withCache('abuseipdb', [ip], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: 'https://api.abuseipdb.com/api/v2/check',
      params: { ipAddress: ip, maxAgeInDays: 90 },
      headers: { Key: key, Accept: 'application/json' },
    });
    if (res.status !== 200) return null;
    return res.data;
  });
}

/**
 * MXToolbox — SuperTool API shape varies by account; degrade if no key or error.
 * Uses Lookup endpoint pattern from public docs (may require paid features for some tools).
 */
async function mxtoolboxBlacklistLookup(domain) {
  const key = process.env.MXTOOLBOX_API_KEY;
  if (!key) return null;
  return withCache('mxtoolbox_bl', [domain], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: 'https://api.mxtoolbox.com/api/v1/Lookup/blacklist',
      params: { argument: domain },
      headers: { Authorization: key },
    });
    if (res.status !== 200) return null;
    return res.data;
  });
}

/** URLScan.io */
async function urlscanSubmit(url) {
  const key = process.env.URLSCAN_API_KEY;
  if (!key) return null;
  const res = await safeAxios({
    method: 'POST',
    url: 'https://urlscan.io/api/v1/scan/',
    headers: { 'API-Key': key, 'Content-Type': 'application/json' },
    data: { url, visibility: 'public' },
  });
  if (res.status !== 200) return null;
  return res.data;
}

async function urlscanResult(uuid) {
  const key = process.env.URLSCAN_API_KEY;
  if (!key) return null;
  return withCache('urlscan_result', [uuid], async () => {
    const res = await safeAxios({
      method: 'GET',
      url: `https://urlscan.io/api/v1/result/${uuid}/`,
      headers: key ? { 'API-Key': key } : {},
    });
    if (res.status !== 200) return null;
    return res.data;
  });
}

/** Local BERT Email phishing model */
async function emailBertPredict(emailText) {
  const endpoint = (process.env.EMAIL_AI_API_URL || '').replace(/\/$/, '');
  if (!endpoint) return null;
  try {
    const res = await safeAxios({
      method: 'POST',
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      data: { email: emailText },
      timeout: 30000,
    });
    if (res.status !== 200 || !res.data) return null;
    return res.data; // { status, threat_level, confidence, reason, model }
  } catch (e) {
    logger.warn(`[externalAPIs] emailBertPredict: ${e.message}`);
    return null;
  }
}

/** Local/remote URL detection model API */
async function urlDetectionPredict(url) {
  const modelEndpoint = process.env.URL_DETECTION_API_URL;
  if (!modelEndpoint) return null;

  const endpoint = modelEndpoint.replace(/\/$/, '');
  return withCache('url_detection', [url], async () => {
    const res = await safeAxios({
      method: 'POST',
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      data: { url },
      timeout: 10000,
    });

    if (res.status !== 200 || !res.data) return null;
    return res.data;
  });
}

module.exports = {
  withCache,
  cloudflareDoH,
  hackerTargetNmap,
  hackerTargetHostSearch,
  hackerTargetDnsLookup,
  hackerTargetZoneTransfer,
  hackerTargetReverseDns,
  shodanInternetDb,
  securityTrailsSubdomains,
  securityTrailsDnsHistory,
  securityTrailsAssociatedDomains,
  sslLabsAnalyze,
  virusTotalDomain,
  abuseIpDbCheck,
  mxtoolboxBlacklistLookup,
  urlscanSubmit,
  urlscanResult,
  urlDetectionPredict,
  emailBertPredict,
};
