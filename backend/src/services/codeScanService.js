/**
 * Code scan service - orchestrates the full scanning pipeline
 */

const { v4: uuidv4 } = require('uuid');
const CodeScan = require('../models/CodeScan');
const { preScan } = require('./preScanner');
const { analyseCode } = require('./aiCodeService');
const { detectLanguage, isSupported } = require('../utils/languageDetector');
const logger = require('../utils/logger');

const maxCodeBytes = () => parseInt(process.env.CODE_SCAN_MAX_SIZE_KB || '50', 10) * 1024;

function buildFallbackFromPreScan(preScanFindings, overallAssessment) {
  return {
    summary: {
      total: preScanFindings.length,
      critical: preScanFindings.filter((f) => f.severity === 'critical').length,
      high: preScanFindings.filter((f) => f.severity === 'high').length,
      medium: preScanFindings.filter((f) => f.severity === 'medium').length,
      low: preScanFindings.filter((f) => f.severity === 'low').length,
      info: preScanFindings.filter((f) => f.severity === 'info').length,
      riskScore: preScanFindings.length > 0 ? 50 : 0,
      grade: preScanFindings.length > 5 ? 'D' : 'B',
      overallAssessment,
    },
    findings: preScanFindings.map((f) => ({
      findingId: uuidv4(),
      line: f.line,
      lineEnd: f.line,
      column: 1,
      severity: f.severity,
      category: f.category,
      owaspCategory: f.owaspCategory,
      cwe: f.cwe,
      title: f.title,
      description: f.description,
      vulnerableCode: f.snippet,
      fixedCode: '',
      explanation:
        'Detected by the local pattern engine. Set OLLAMA_BASE_URL on the server for AI explanations and deeper coverage.',
      remediation: 'Review the code and apply standard security best practices for this vulnerability type.',
      references: [],
    })),
  };
}

function shouldFallbackToRegex(aiError) {
  const m = aiError && aiError.message ? String(aiError.message).toLowerCase() : '';
  return (
    m.includes('429') ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('resource exhausted') ||
    m.includes('too many requests') ||
    m.includes('ollama_base_url') ||
    m.includes('not set') ||
    m.includes('failed to parse ai') ||
    m.includes('timeout') ||          // AI too slow → fallback instead of failure
    m.includes('etimedout') ||         // network timeout
    m.includes('econnaborted') ||      // axios cancel/abort
    (m.includes('parse') && m.includes('json')) ||
    m.includes('invalid json') ||
    m.includes('billing') ||
    m.includes('permission denied') ||
    m.includes('fetch failed') ||
    m.includes('econnrefused')
  );
}

/**
 * Create a new code scan job
 * @param {string} userId - User ID
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {string} source - Source type (paste, upload, github)
 * @param {Object} metadata - Additional metadata (filename, repo, etc.)
 * @returns {Promise<Object>} - Created scan record with scanId
 */
async function createCodeScan(userId, code, language, source, metadata = {}) {
  // Detect language if not provided
  let detectedLanguage = language;
  if (!detectedLanguage) {
    detectedLanguage = detectLanguage(metadata.filename, code);
  }

  if (!isSupported(detectedLanguage)) {
    throw new Error(
      `Language not supported. Supported: ${[
        'javascript',
        'typescript',
        'python',
        'php',
        'csharp',
        'ruby',
        'go',
        'java',
      ].join(', ')}`
    );
  }

  const maxLen = maxCodeBytes();
  if (code.length > maxLen) {
    throw new Error(`Code exceeds maximum size of ${Math.round(maxLen / 1024)}KB`);
  }

  // Create scan record
  const scan = new CodeScan({
    userId,
    source,
    language: detectedLanguage,
    filename: metadata.filename || `code.${getExtension(detectedLanguage)}`,
    linesOfCode: code.split('\n').length,
    githubRepo: metadata.githubRepo,
    githubBranch: metadata.githubBranch,
    githubPath: metadata.githubPath,
    status: 'queued',
  });

  await scan.save();

  return {
    scanId: scan._id.toString(),
    status: 'queued',
    language: detectedLanguage,
    filename: scan.filename,
  };
}

/**
 * Process a code scan (full pipeline)
 * @param {string} scanId - Scan ID
 * @param {string} code - Source code (NOT stored)
 * @returns {Promise<Object>} - Updated scan with findings
 */
async function processScan(scanId, code) {
  const startTime = Date.now();

  try {
    // Fetch scan record
    const scan = await CodeScan.findById(scanId);
    if (!scan) {
      throw new Error('Scan not found');
    }

    // Update status to scanning
    scan.status = 'scanning';
    scan.startedAt = new Date();
    scan.progressPercent = 5;
    scan.progressStage = 'starting';
    scan.progressMessage = 'Preparing scan environment...';
    await scan.save();

    // Step 1: Pre-scan
    scan.progressPercent = 18;
    scan.progressStage = 'pre-scan';
    scan.progressMessage = 'Running fast regex pre-scan...';
    await scan.save();

    const preScanFindings = preScan(code);
    scan.preScanHints = preScanFindings.map((f) => f.title);
    scan.progressPercent = 30;
    scan.progressStage = 'pre-scan';
    scan.progressMessage =
      preScanFindings.length > 0
        ? `Pre-scan flagged ${preScanFindings.length} potential issue(s)...`
        : 'Pre-scan complete. No obvious patterns found.';
    await scan.save();

    // Step 2: AI analysis (optional) + regex fallback
    let analysisResult;
    let isLimitedScan = false;
    const aiConfigured = true; // Defaulting to true as local Ollama can be used without explicitly setting keys

    if (!aiConfigured) {
      scan.progressPercent = 50;
      scan.progressStage = 'fallback';
      scan.progressMessage = 'AI not configured — using local pattern analysis.';
      await scan.save();
      analysisResult = buildFallbackFromPreScan(
        preScanFindings,
        'OLLAMA_BASE_URL is not configured. Results are from the built-in pattern scanner only.'
      );
      isLimitedScan = true;
    } else {
      try {
        scan.progressPercent = 42;
        scan.progressStage = 'ai';
        scan.progressMessage = 'Sending code to AI for deep analysis...';
        await scan.save();

        analysisResult = await analyseCode(code, scan.language, preScanFindings);
        scan.progressPercent = 82;
        scan.progressStage = 'analysis';
        scan.progressMessage = 'Deep analysis complete. Building report...';
        await scan.save();
      } catch (aiError) {
        if (shouldFallbackToRegex(aiError)) {
          logger.warn(`[CodeScan] AI unavailable for ${scanId}: ${aiError.message}`);
          isLimitedScan = true;
          scan.progressPercent = 60;
          scan.progressStage = 'fallback';
          scan.progressMessage = 'AI unavailable — using local pattern results.';
          await scan.save();

          analysisResult = buildFallbackFromPreScan(
            preScanFindings,
            `AI analysis could not complete (${aiError.message}). Showing local pattern results.`
          );

          scan.progressPercent = 82;
          scan.progressStage = 'analysis';
          scan.progressMessage = 'Fallback analysis complete. Building report...';
          await scan.save();
        } else {
          throw aiError;
        }
      }
    }

    // Step 3: Map analysis to scan findings
    scan.progressPercent = 92;
    scan.progressStage = 'report';
    scan.progressMessage = 'Finalizing findings and summary...';

    scan.summary = {
      total: analysisResult.summary.total,
      critical: analysisResult.summary.critical,
      high: analysisResult.summary.high,
      medium: analysisResult.summary.medium,
      low: analysisResult.summary.low,
      info: analysisResult.summary.info,
      riskScore: analysisResult.summary.riskScore,
      grade: analysisResult.summary.grade,
      overallAssessment: analysisResult.summary.overallAssessment,
    };

    scan.findings = analysisResult.findings.map((f) => ({
      findingId: f.findingId,
      line: f.line,
      lineEnd: f.lineEnd || f.line,
      column: f.column || 1,
      severity: f.severity,
      category: f.category,
      owaspCategory: f.owaspCategory,
      cwe: f.cwe,
      title: f.title,
      description: f.description,
      vulnerableCode: f.vulnerableCode,
      fixedCode: f.fixedCode,
      explanation: f.explanation,
      remediation: f.remediation,
      references: f.references || [],
    }));

    // Step 4: Calculate metrics
    scan.aiModel = isLimitedScan ? 'regex-fallback' : process.env.OLLAMA_MODEL || 'gemma4:e4b';
    scan.scanDuration = Date.now() - startTime;
    scan.completedAt = new Date();
    scan.status = 'completed';
    scan.progressPercent = 100;
    scan.progressStage = 'completed';
    scan.progressMessage = 'Done.';

    // Save to database
    await scan.save();

    // Clear code from memory
    code = null;

    return scan;
  } catch (error) {
    // Mark scan as failed
    const scan = await CodeScan.findById(scanId);
    if (scan) {
      scan.status = 'failed';
      scan.error = error.message;
      scan.scanDuration = Date.now() - startTime;
      scan.progressStage = 'failed';
      scan.progressMessage = error.message;
      await scan.save();
    }

    throw error;
  }
}

/**
 * Get scan result
 * @param {string} scanId - Scan ID
 * @returns {Promise<Object>} - Scan record
 */
async function getScan(scanId) {
  const scan = await CodeScan.findById(scanId);
  if (!scan) {
    throw new Error('Scan not found');
  }
  return scan;
}

/**
 * List user's scans
 * @param {string} userId - User ID
 * @param {Object} options - { page, limit, language, severity }
 * @returns {Promise<Object>} - { scans, total, page, pages }
 */
async function listScans(userId, options = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const query = { userId };

  if (options.language) {
    query.language = options.language;
  }

  if (options.severity) {
    // Filter by severity - need to search in findings
    query[`summary.${options.severity}`] = { $gt: 0 };
  }

  const [scans, total] = await Promise.all([
    CodeScan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CodeScan.countDocuments(query),
  ]);

  return {
    scans,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Delete a scan
 * @param {string} scanId - Scan ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>}
 */
async function deleteScan(scanId, userId) {
  const result = await CodeScan.findOneAndDelete({ _id: scanId, userId });
  return !!result;
}

/**
 * Get file extension for language
 * @param {string} language - Language name
 * @returns {string} - File extension without dot
 */
function getExtension(language) {
  const map = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    php: 'php',
    csharp: 'cs',
    ruby: 'rb',
    go: 'go',
    java: 'java',
  };
  return map[language] || 'txt';
}

module.exports = {
  createCodeScan,
  processScan,
  getScan,
  listScans,
  deleteScan,
};
