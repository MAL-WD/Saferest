const { Queue } = require('bullmq');
const multer = require('multer');
const logger = require('../utils/logger');
const { getRedisConnection } = require('../config/redis');
const { createCodeScan, getScan, listScans, deleteScan, processScan } = require('../services/codeScanService');
const { detectLanguage } = require('../utils/languageDetector');
const { parseGitHubUrl, getFileContent, getDirectoryFiles, checkRateLimit } = require('../services/githubService');
const { testAIConnection } = require('../services/aiCodeService');

const codeScanQueue = new Queue('code-scan', { connection: getRedisConnection() });

const maxCodeLen = () => parseInt(process.env.CODE_SCAN_MAX_SIZE_KB || '50', 10) * 1024;

/** Queue job when Redis is healthy; otherwise process in-process so scans still complete. */
async function scheduleCodeAnalysis(jobPayload) {
  const { scanId, code } = jobPayload;
  const inline = process.env.CODE_SCAN_INLINE === '1' || process.env.CODE_SCAN_INLINE === 'true';

  if (inline) {
    logger.info(`[CodeScan] CODE_SCAN_INLINE: processing ${scanId} without BullMQ`);
    setImmediate(() => {
      processScan(scanId, code).catch((e) => {
        logger.error(`[CodeScan] Inline processScan failed for ${scanId}: ${e.message}`);
      });
    });
    return;
  }

  try {
    await codeScanQueue.add('analyze', jobPayload, {
      jobId: scanId,
      delay: 1000,
    });
  } catch (err) {
    logger.warn(`[CodeScan] Queue add failed (${err.message}); processing ${scanId} inline.`);
    setImmediate(() => {
      processScan(scanId, code).catch((e) => {
        logger.error(`[CodeScan] Inline processScan failed for ${scanId}: ${e.message}`);
      });
    });
  }
}

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.CODE_SCAN_UPLOAD_MAX_KB || 500) * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(js|ts|tsx|jsx|mjs|py|php|java|go|rb|cs|vue)$/i.test(file.originalname);
    cb(null, ok);
  },
});

const createCodeScanHandler = async (req, res, next) => {
  try {
    const { code, language, filename } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const maxLen = maxCodeLen();
    if (code.length > maxLen) {
      return res.status(400).json({
        success: false,
        message: `Code exceeds maximum size of ${Math.round(maxLen / 1024)}KB`,
      });
    }

    // Detect language if not provided
    const detectedLanguage = detectLanguage(filename, code);
    if (!detectedLanguage && !language) {
      return res.status(400).json({ success: false, message: 'Could not detect language. Please specify it explicitly.' });
    }

    // Create scan record
    const scanResult = await createCodeScan(req.user._id, code, language || detectedLanguage, 'paste', { filename });

    // Enqueue or run inline (see scheduleCodeAnalysis)
    await scheduleCodeAnalysis({
      scanId: scanResult.scanId,
      code,
      language: scanResult.language,
      userId: req.user._id.toString(),
    });

    res.status(201).json({
      success: true,
      scanId: scanResult.scanId,
      status: 'queued',
      language: scanResult.language,
      message: 'Code submitted for analysis',
    });
  } catch (e) {
    logger.error('Error in createCodeScan:', e);
    next(e);
  }
};

const uploadCodeScan = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File required' });
    }

    const code = req.file.buffer.toString('utf8');
    
    if (code.includes('\x00')) {
      return res.status(400).json({ success: false, message: 'Binary files not supported' });
    }

    const maxLen = maxCodeLen();
    if (code.length > maxLen) {
      return res.status(400).json({
        success: false,
        message: `File exceeds ${Math.round(maxLen / 1024)}KB limit`,
      });
    }

    const language = detectLanguage(req.file.originalname, code);
    if (!language) {
      return res.status(400).json({ success: false, message: 'Could not detect language from file extension' });
    }

    const scanResult = await createCodeScan(req.user._id, code, language, 'upload', {
      filename: req.file.originalname,
    });

    await scheduleCodeAnalysis({
      scanId: scanResult.scanId,
      code,
      language: scanResult.language,
      userId: req.user._id.toString(),
    });

    req.file.buffer = null;

    res.status(201).json({
      success: true,
      scanId: scanResult.scanId,
      status: 'queued',
      language: scanResult.language,
      filename: req.file.originalname,
    });
  } catch (e) {
    logger.error('Error in uploadCodeScan:', e);
    next(e);
  }
};

const githubCodeScan = async (req, res, next) => {
  try {
    const { repoUrl, branch, path, token } = req.body;
    const userId = req.user._id;

    if (!repoUrl) {
      return res.status(400).json({ success: false, message: 'Repository URL is required' });
    }

    // Parse GitHub URL
    const { owner, repo, path: urlPath } = parseGitHubUrl(repoUrl);
    const filePath = path || urlPath || '';
    const branch_name = branch || 'main';

    // Check rate limit
    try {
      const rateLimit = await checkRateLimit(token);
      if (rateLimit.remaining < 10) {
        return res.status(429).json({
          success: false,
          message: 'GitHub API rate limit exceeded',
          resetAt: rateLimit.reset,
        });
      }
    } catch (error) {
      logger.warn('Rate limit check failed:', error.message);
    }

    let filesToScan = [];

    try {
      const fileData = await getFileContent(owner, repo, filePath, branch_name, token);
      filesToScan = [fileData];
    } catch (fileError) {
      try {
        const files = await getDirectoryFiles(owner, repo, filePath, branch_name, token);

        if (files.length === 0) {
          return res.status(400).json({ success: false, message: 'No supported code files found in directory' });
        }

        if (files.length > parseInt(process.env.GITHUB_MAX_FILES_PER_REPO || 20)) {
          return res.status(400).json({
            success: false,
            message: `Directory contains ${files.length} files. Maximum is ${process.env.GITHUB_MAX_FILES_PER_REPO || 20}`,
            files: files.slice(0, 20),
          });
        }

        // Fetch file contents
        for (const file of files) {
          const fileData = await getFileContent(owner, repo, file.path, branch_name, token);
          filesToScan.push(fileData);
        }
      } catch (dirError) {
        return res.status(400).json({ success: false, message: `Could not fetch from GitHub: ${dirError.message}` });
      }
    }

    // Create scans for each file
    const scans = [];

    for (const fileData of filesToScan) {
      const scanResult = await createCodeScan(userId, fileData.content, fileData.language, 'github', {
        filename: fileData.filename,
        githubRepo: `${owner}/${repo}`,
        githubBranch: branch_name,
        githubPath: fileData.path,
      });

      await scheduleCodeAnalysis({
        scanId: scanResult.scanId,
        code: fileData.content,
        language: fileData.language,
        userId: userId.toString(),
      });

      scans.push({
        scanId: scanResult.scanId,
        filename: fileData.filename,
        language: fileData.language,
      });
    }

    res.status(201).json({
      success: true,
      scans,
      status: 'queued',
      message: `${scans.length} file(s) submitted for analysis`,
    });
  } catch (e) {
    logger.error('Error in githubCodeScan:', e);
    next(e);
  }
};

const getCodeScanHandler = async (req, res, next) => {
  try {
    const scan = await getScan(req.params.id);

    // Authorization check
    if (scan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, codeScan: scan });
  } catch (e) {
    logger.error('Error in getCodeScan:', e);
    res.status(404).json({ success: false, message: e.message });
  }
};

const listCodeScans = async (req, res, next) => {
  try {
    const result = await listScans(req.user._id, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      language: req.query.language,
      severity: req.query.severity,
    });

    res.json({ success: true, ...result });
  } catch (e) {
    logger.error('Error in listCodeScans:', e);
    next(e);
  }
};

const deleteCodeScan = async (req, res, next) => {
  try {
    const deleted = await deleteScan(req.params.id, req.user._id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    res.json({ success: true, deleted: true });
  } catch (e) {
    logger.error('Error in deleteCodeScan:', e);
    next(e);
  }
};

const exportJSON = async (req, res, next) => {
  try {
    const scan = await getScan(req.params.id);

    if (scan.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=codescan-${req.params.id}.json`);
    res.json(scan);
  } catch (e) {
    logger.error('Error in exportJSON:', e);
    res.status(404).json({ success: false, message: e.message });
  }
};

const testAI = async (req, res, next) => {
  try {
    const result = await testAIConnection();
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  createCodeScan: createCodeScanHandler,
  uploadCodeScan,
  githubCodeScan,
  getCodeScan: getCodeScanHandler,
  listCodeScans,
  deleteCodeScan,
  exportJSON,
  testAI,
  upload,
};
