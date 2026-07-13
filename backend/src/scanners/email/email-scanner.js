// Passive DNS/email security checks — uses externalAPIs only.

const external = require('../../services/externalAPIs');
const logger = require('../../utils/logger');

const DKIM_SELECTORS = ['google', 'default', 'mail', 'smtp', 'k1', 'selector1', 'selector2'];

function gradeSpf(txtRecords) {
  const spf = txtRecords.find((t) => t.startsWith('v=spf1'));
  if (!spf) return { status: 'FAIL', detail: 'No SPF TXT record' };
  if (/\s\+all\s*$|\+all$/i.test(spf)) return { status: 'FAIL', detail: 'SPF includes +all (too permissive)' };
  const lookups = (spf.match(/(?:include|a|mx|ptr|exists|redirect)/gi) || []).length;
  if (lookups > 10) return { status: 'FAIL', detail: 'SPF exceeds recommended DNS lookups' };
  if (/\s~all\s*$|\s-all\s*$/i.test(spf)) return { status: 'PASS', detail: 'SPF present with fail/softfail mechanism' };
  return { status: 'WARN', detail: 'SPF present; review mechanism' };
}

function gradeDmarc(records) {
  const flat = records.map((r) => (Array.isArray(r) ? r.join('') : r));
  const dmarc = flat.find((r) => r.startsWith('v=DMARC1'));
  if (!dmarc) return { status: 'FAIL', detail: 'No DMARC' };
  const policyMatch = dmarc.match(/;\s*p=([^;]+)/i);
  const policy = policyMatch ? policyMatch[1].trim() : 'none';
  let status = 'WARN';
  if (policy === 'reject') status = 'PASS';
  else if (policy === 'quarantine') status = 'PASS';
  else if (policy === 'none') status = 'WARN';
  const hasRua = /rua=/i.test(dmarc);
  const pctMatch = dmarc.match(/;\s*pct=(\d+)/i);
  const pct = pctMatch ? parseInt(pctMatch[1], 10) : 100;
  return {
    status,
    policy,
    pct,
    hasRua,
    detail: `p=${policy}, pct=${pct}, rua=${hasRua ? 'yes' : 'no'}`,
  };
}

function countSpfDnsLookups(spf) {
  return (spf.match(/(?:include|a|mx|ptr|exists|redirect)/gi) || []).length;
}

/**
 * @param {string} domain apex hostname
 */
async function runEmailChecks(domain) {
  const apex = domain.replace(/^\.+/, '').toLowerCase();

  const txtData = await external.cloudflareDoH(apex, 'TXT');
  const parseTxt = (a) => {
    const d = a.data;
    if (Array.isArray(d)) return d.map((p) => (typeof p === 'string' ? p.replace(/^"(.*)"$/, '$1') : String(p))).join('');
    if (typeof d === 'string') return d.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
    return String(d || '');
  };
  const txtAnswers = (txtData?.Answer || []).filter((a) => a.type === 16).map(parseTxt);

  const spfGrade = gradeSpf(txtAnswers);

  const dmarcName = `_dmarc.${apex}`;
  const dmarcData = await external.cloudflareDoH(dmarcName, 'TXT');
  const dmarcStrings = (dmarcData?.Answer || []).filter((a) => a.type === 16).map(parseTxt);
  const dmarcGrade = gradeDmarc(dmarcStrings);

  const dkimFound = [];
  for (const sel of DKIM_SELECTORS) {
    const name = `${sel}._domainkey.${apex}`;
    const d = await external.cloudflareDoH(name, 'TXT');
    const answers = d?.Answer || [];
    if (answers.length) {
      dkimFound.push({ selector: sel, records: answers.length });
    }
  }
  const dkimStatus =
    dkimFound.length > 0
      ? { status: 'PASS', detail: `Selectors: ${dkimFound.map((x) => x.selector).join(', ')}` }
      : { status: 'WARN', detail: 'No DKIM at common selectors' };

  const mxData = await external.cloudflareDoH(apex, 'MX');
  const mxAnswers = mxData?.Answer || [];
  const mxStatus =
    mxAnswers.length > 0
      ? { status: 'PASS', detail: `${mxAnswers.length} MX record(s)` }
      : { status: 'FAIL', detail: 'No MX records' };

  let blacklist = null;
  try {
    blacklist = await external.mxtoolboxBlacklistLookup(apex);
  } catch (e) {
    logger.debug(`MXToolbox blacklist skipped: ${e.message}`);
  }

  let vt = null;
  try {
    vt = await external.virusTotalDomain(apex);
  } catch (e) {
    logger.debug(`VirusTotal skipped: ${e.message}`);
  }

  const vtStats = vt?.data?.attributes?.last_analysis_stats || null;

  const spoofable =
    spfGrade.status === 'FAIL' ||
    dmarcGrade.status === 'FAIL' ||
    (dmarcGrade.policy && String(dmarcGrade.policy).toLowerCase() === 'none');

  return {
    domain: apex,
    spf: spfGrade,
    dmarc: dmarcGrade,
    dkim: dkimStatus,
    dkimSelectors: dkimFound,
    mx: mxStatus,
    spfLookupCount: txtAnswers.find((t) => t.startsWith('v=spf1'))
      ? countSpfDnsLookups(txtAnswers.find((t) => t.startsWith('v=spf1')))
      : 0,
    blacklist,
    virusTotal: vtStats
      ? {
          harmless: vtStats.harmless || 0,
          malicious: vtStats.malicious || 0,
          suspicious: vtStats.suspicious || 0,
          undetected: vtStats.undetected || 0,
        }
      : null,
    spoofable,
  };
}

module.exports = { runEmailChecks, DKIM_SELECTORS };
