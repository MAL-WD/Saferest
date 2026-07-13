const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

const MAX_PCAP_SIZE_MB = parseInt(process.env.PCAP_MAX_SIZE_MB || '200', 10);
const MAX_PCAP_SIZE_BYTES = MAX_PCAP_SIZE_MB * 1024 * 1024;
const DEFAULT_PCAP_API_URL = 'http://localhost:5003';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PCAP_SIZE_BYTES },
});

const uploadPcapMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum allowed size is ${MAX_PCAP_SIZE_MB}MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid PCAP upload payload.',
    });
  });
};

const ensureAllowedExtension = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return ext === '.pcap' || ext === '.pcapng';
};

const normalizePcapResult = (raw) => ({
  status: raw?.status || 'Unknown',
  attackType: raw?.type || 'Unknown',
  confidence: raw?.confidence || '0%',
  packets: raw?.packets || '0',
  recommendation: raw?.recommendation || 'No recommendation provided.',
});

const emitPcapEvent = (scanId, event, payload = {}) => {
  try {
    getIO().to(`pcap:${scanId}`).emit(event, { scanId, ...payload });
  } catch (_) {
    // Socket can be unavailable in isolated tests; API should still work.
  }
};

const uploadPcapScan = async (req, res) => {
  const scanId = crypto.randomUUID();
  emitPcapEvent(scanId, 'pcap_scan:started', { stage: 'upload_received' });

  try {
    const file = req.file;
    if (!file) {
      emitPcapEvent(scanId, 'pcap_scan:failed', { message: 'No file provided.' });
      return res.status(400).json({ success: false, message: 'PCAP file is required.' });
    }

    if (!ensureAllowedExtension(file.originalname)) {
      emitPcapEvent(scanId, 'pcap_scan:failed', { message: 'Unsupported file type.' });
      return res.status(400).json({
        success: false,
        message: 'Only .pcap or .pcapng files are supported.',
      });
    }

    emitPcapEvent(scanId, 'pcap_scan:progress', { stage: 'processing', percent: 40 });

    const baseUrl = (process.env.PCAP_AI_API_URL || DEFAULT_PCAP_API_URL).replace(/\/$/, '');
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype || 'application/octet-stream',
    });

    const headers = {
      ...formData.getHeaders(),
    };
    if (process.env.PCAP_AI_API_KEY) {
      headers.Authorization = `Bearer ${process.env.PCAP_AI_API_KEY}`;
    }

    const upstream = await axios.post(`${baseUrl}/scan`, formData, {
      headers,
      timeout: parseInt(process.env.PCAP_SCAN_TIMEOUT_MS || '600000', 10),
      maxBodyLength: Infinity,
    });

    const summary = normalizePcapResult(upstream.data || {});
    emitPcapEvent(scanId, 'pcap_scan:progress', { stage: 'finalizing', percent: 90 });
    emitPcapEvent(scanId, 'pcap_scan:completed', { summary });

    return res.status(200).json({
      success: true,
      scanId,
      summary,
      raw: upstream.data || {},
    });
  } catch (error) {
    const upstreamMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'PCAP AI service request failed.';
    logger.error(`[PCAP Scan] ${upstreamMessage}`);
    emitPcapEvent(scanId, 'pcap_scan:failed', { message: upstreamMessage });
    return res.status(502).json({
      success: false,
      message: `Failed to scan PCAP file: ${upstreamMessage}`,
    });
  }
};

module.exports = { uploadPcapMiddleware, uploadPcapScan };
