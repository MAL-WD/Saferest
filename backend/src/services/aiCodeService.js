/**
 * AI code analysis service
 * Uses Ollama for deep security analysis
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const modelName = process.env.OLLAMA_MODEL || 'gemma4:e4b';

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);

function extractLikelyJson(text) {
  if (!text || typeof text !== 'string') return null;
  // Prefer fenced JSON block if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  // Otherwise attempt to pull the outermost object
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return null;
}

function normalizeFinding(raw, idx = 0, preScan = {}) {
  const findingId = typeof raw?.findingId === 'string' && raw.findingId.trim() ? raw.findingId : uuidv4();
  const severityRaw = (raw?.severity || '').toString().toLowerCase().trim();
  const severity = SEVERITIES.has(severityRaw) ? severityRaw : (preScan.severity || 'info');

  const line = Number.isFinite(Number(raw?.line)) ? Number(raw.line) : (preScan.line || 1);
  const lineEnd = Number.isFinite(Number(raw?.lineEnd)) ? Number(raw.lineEnd) : line;
  const column = Number.isFinite(Number(raw?.column)) ? Number(raw.column) : 1;

  return {
    findingId,
    line,
    lineEnd,
    column,
    severity,
    category: (raw?.category || '').toString().trim() || preScan.category || 'Security issue',
    owaspCategory: (raw?.owaspCategory || '').toString().trim() || preScan.owaspCategory || '',
    cwe: (raw?.cwe || '').toString().trim() || preScan.cwe || '',
    title: (raw?.title || '').toString().trim() || preScan.title || `Finding ${idx + 1}`,
    description: (raw?.description || '').toString().trim() || preScan.description || '',
    vulnerableCode: (raw?.vulnerableCode || '').toString(),
    fixedCode: (raw?.fixedCode || '').toString(),
    explanation: (raw?.explanation || '').toString().trim() || '',
    remediation: (raw?.remediation || '').toString().trim() || '',
    references: Array.isArray(raw?.references) ? raw.references.map((r) => String(r)) : [],
  };
}

function computeSummary(findings = []) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    if (counts[f.severity] !== undefined) counts[f.severity] += 1;
  }
  const total = findings.length;
  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (counts.critical * 25 + counts.high * 15 + counts.medium * 8 + counts.low * 3 + counts.info * 1) /
          Math.max(1, total)
      )
    )
  );
  const grade =
    riskScore <= 5 ? 'A+' : riskScore <= 12 ? 'A' : riskScore <= 25 ? 'B' : riskScore <= 45 ? 'C' : riskScore <= 65 ? 'D' : 'F';

  return {
    total,
    ...counts,
    riskScore,
    grade,
  };
}

/**
 * Build comprehensive security analysis prompt for AI
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {Array} preScanFindings - Results from regex pre-scan
 * @returns {string} - Formatted prompt
 */
function buildAnalysisPrompt(code, language, preScanFindings = []) {
  const preScanText =
    preScanFindings.length > 0
      ? preScanFindings
          .map((f) => `- [${f.severity.toUpperCase()}] ${f.title} (${f.cwe}) at line ${f.line}`)
          .join('\n')
      : '(none)';

  return `You are an expert application security engineer specialising in source code vulnerability analysis. You have deep expertise in OWASP Top 10, CWE classifications, and secure coding practices across all major programming languages.

Your task is to perform a thorough security review of the provided source code. Check for ALL vulnerabilities in these categories:
- Injection attacks (SQL, Command, LDAP, XPath, Template)
- Broken Authentication (weak passwords, hardcoded creds, no MFA)
- Sensitive Data Exposure (secrets, tokens, PII in logs)
- Broken Access Control (missing auth checks, IDOR, path traversal)
- Security Misconfiguration (debug mode, CORS *, SSL disabled)
- Vulnerable Dependencies (known-bad functions, deprecated APIs)
- Insecure Deserialization (pickle, yaml.load, unserialize)
- Cryptographic Failures (MD5, SHA1, weak random, hardcoded IV)
- SSRF (user-controlled URLs in HTTP requests)
- XSS (innerHTML, document.write, unescaped output)
- Race Conditions (TOCTOU, non-atomic operations)
- Memory Safety issues

You MUST return ONLY valid JSON — no markdown, no preamble, no explanation outside the JSON structure. Your response must be parseable by JSON.parse() directly.
If you find no issues, return an empty findings array and a correct summary.

CODE TO ANALYSE (${language}):
\`\`\`${language}
${code}
\`\`\`

PRE-SCAN DETECTED (validate and expand these):
${preScanText}

INSTRUCTIONS:
1. CRITICAL: Find ALL vulnerabilities in the code. DO NOT STOP after finding just one. If there are multiple vulnerabilities (e.g., SQLi, XSS, and IDOR), your "findings" array MUST contain an object for EVERY single vulnerability.
2. Validate and expand on any PRE-SCAN DETECTED issues.
3. For each finding, provide the EXACT line number(s) in the code.
4. Quote the exact vulnerable code snippet (max 200 chars).
5. Provide a corrected version of the vulnerable code.
6. Map every finding to an OWASP Top 10 2021 category AND a CWE ID.
7. Classify severity as one of: critical | high | medium | low | info.
8. Provide real-world impact and exploitation scenario for each.

RETURN THIS EXACT JSON STRUCTURE AND NOTHING ELSE:
{
  "summary": {
    "total": <number>,
    "critical": <number>,
    "high": <number>,
    "medium": <number>,
    "low": <number>,
    "info": <number>,
    "riskScore": <0-100>,
    "grade": "<A+ | A | B | C | D | F>",
    "overallAssessment": "<2-3 sentences for non-technical users>"
  },
  "findings": [
    {
      "findingId": "<uuid>",
      "line": <number>,
      "lineEnd": <number>,
      "column": <number>,
      "severity": "<critical | high | medium | low | info>",
      "category": "<string>",
      "owaspCategory": "<A01:2021 | A02:2021 | ... | A10:2021>",
      "cwe": "<CWE-XXX>",
      "title": "<string>",
      "description": "<string>",
      "vulnerableCode": "<string>",
      "fixedCode": "<string>",
      "explanation": "<string: real-world impact>",
      "remediation": "<string: step-by-step fix>",
      "references": ["<url>", "<url>"]
    }
  ]
}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test AI connection
 */
async function testAIConnection() {
  const start = Date.now();
  
  try {
    const response = await axios.post(`${ollamaBaseUrl}/api/generate`, {
      model: modelName,
      prompt: 'Return ONLY valid JSON with this exact shape: {"ok":true}. No markdown, no extra keys.',
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
        num_predict: 50
      }
    });

    const responseText = response.data.response;
    const jsonText = extractLikelyJson(responseText) || responseText;

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (_err) {
      throw new Error('AI test failed: response was not valid JSON');
    }

    if (!parsed || parsed.ok !== true) {
      throw new Error('AI test failed: unexpected response');
    }

    return {
      ok: true,
      model: modelName,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    throw new Error(`AI connection failed: ${error.message}`);
  }
}

/**
 * Analyse code using AI API with retry logic
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {Array} preScanFindings - Pre-scan results
 * @returns {Promise<Object>} - Analysis result
 */
async function analyseCode(code, language, preScanFindings = []) {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount <= maxRetries) {
    try {
      const prompt = buildAnalysisPrompt(code, language, preScanFindings);
      
      const response = await axios.post(`${ollamaBaseUrl}/api/generate`, {
        model: modelName,
        prompt: prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0,
          num_predict: 4096,  // enough for detailed findings; faster than 8000
        }
      }, { timeout: 90000 }); // 90-second timeout — if AI is slower, fall back to regex

      const responseText = response.data.response;
      const jsonText = extractLikelyJson(responseText) || responseText;

      let analysisData;
      try {
        analysisData = JSON.parse(jsonText);
      } catch (_err) {
        console.error(`[AI Service] Failed to parse AI response. Raw text length: ${responseText.length}`);
        console.error(`[AI Service] Raw text sample: ${responseText.substring(0, 200)}...`);
        throw new Error('Failed to parse AI response as JSON');
      }

      const findingsRaw = Array.isArray(analysisData?.findings) ? analysisData.findings : [];
      const findings = findingsRaw.map((f, idx) => {
        const line = Number.isFinite(Number(f?.line)) ? Number(f.line) : -1;
        // Find matching pre-scan by line (within +/- 2 lines to account for AI line number fuzziness)
        const matchedPreScan = preScanFindings.find(p => Math.abs(p.line - line) <= 2) || {};
        return normalizeFinding(f, idx, matchedPreScan);
      });

      const summaryRaw = analysisData?.summary && typeof analysisData.summary === 'object' ? analysisData.summary : {};
      const computed = computeSummary(findings);

      const summary = {
        total: computed.total,
        critical: computed.critical,
        high: computed.high,
        medium: computed.medium,
        low: computed.low,
        info: computed.info,
        riskScore: computed.riskScore,
        grade: computed.grade,
        overallAssessment:
          typeof summaryRaw.overallAssessment === 'string' && summaryRaw.overallAssessment.trim()
            ? summaryRaw.overallAssessment.trim()
            : '',
      };

      return { summary, findings };
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || '';

      // Don't retry on timeout — a slow model should fall back to regex, not retry and hang longer
      if (errorMessage.includes('429') || errorMessage.includes('ECONNRESET')) {
        retryCount++;
        if (retryCount > maxRetries) break;
        let waitMs = Math.pow(2, retryCount) * 2000; // 4s, 8s, 16s
        console.warn(`[AI Service] Rate limited. Retrying in ${Math.round(waitMs / 1000)}s... (Attempt ${retryCount}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }

      // Timeout or parse error — throw immediately so the fallback logic in codeScanService can kick in
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  throw new Error(`AI analysis failed after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`);
}

module.exports = {
  analyseCode,
  buildAnalysisPrompt,
  testAIConnection,
};
