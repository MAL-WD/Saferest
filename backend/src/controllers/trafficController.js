const axios = require('axios');
const TrafficAnalysis = require('../models/TrafficAnalysis');
const logger = require('../utils/logger');

function detectLogFormat(sample) {
  const line = sample.split('\n').find((l) => l.trim()) || '';
  if (/^\S+\s+\S+\s+\S+\s+\[[^\]]+\]\s+"/.test(line)) return 'apache';
  if (/^\d+\.\d+\.\d+\.\d+.*\[.*\]/.test(line) && line.includes('"')) return 'nginx';
  if (/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(line) && line.toLowerCase().includes('iis')) return 'iis';
  return 'custom';
}

const uploadTraffic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File required' });
    }
    const name = req.file.originalname.toLowerCase();
    let fileType = 'txt';
    if (name.endsWith('.pcap')) fileType = 'pcap';
    else if (name.endsWith('.pcapng')) fileType = 'pcapng';
    else if (name.endsWith('.log') || name.endsWith('.txt')) fileType = name.endsWith('.log') ? 'log' : 'txt';
    else if (name.endsWith('.gz')) fileType = 'gz';

    const doc = await TrafficAnalysis.create({
      user: req.user._id,
      originalName: req.file.originalname,
      fileType,
      logFormat: 'na',
      status: 'running',
    });

    let text = req.file.buffer.toString('utf8');
    if (fileType === 'gz') {
      try {
        text = require('zlib').gunzipSync(req.file.buffer).toString('utf8');
      } catch {
        text = req.file.buffer.toString('utf8');
      }
    }

    const logFormat = ['log', 'txt', 'gz'].includes(fileType) ? detectLogFormat(text.slice(0, 8000)) : 'na';
    doc.logFormat = logFormat;

    const base = (process.env.AI_SERVICE_URL || '').replace(/\/$/, '');
    const payload = {
      trafficId: doc._id.toString(),
      userId: req.user._id.toString(),
      fileType,
      logFormat,
      sample: text.slice(0, 200000),
      pcapBase64: null,
    };

    if (fileType === 'pcap' || fileType === 'pcapng') {
      const maxPcap = 4 * 1024 * 1024;
      const slice = req.file.buffer.subarray(0, Math.min(req.file.buffer.length, maxPcap));
      payload.pcapBase64 = slice.toString('base64');
      payload.sample = '';
    }

    try {
      const ai = await axios.post(`${base}/api/traffic-analyze`, payload, {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' },
      });
      doc.aiReport = ai.data;
      doc.summary = ai.data?.summary || '';
      doc.status = 'completed';
    } catch (e) {
      doc.status = 'failed';
      doc.errorMessage = e.message;
      logger.error(`Traffic AI error: ${e.message}`);
    }
    await doc.save();
    res.status(201).json({ success: true, analysis: doc });
  } catch (e) {
    next(e);
  }
};

const listTraffic = async (req, res, next) => {
  try {
    const rows = await TrafficAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('originalName fileType status summary createdAt');
    res.json({ success: true, analyses: rows });
  } catch (e) {
    next(e);
  }
};

const getTraffic = async (req, res, next) => {
  try {
    const row = await TrafficAnalysis.findOne({ _id: req.params.id, user: req.user._id });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, analysis: row });
  } catch (e) {
    next(e);
  }
};

module.exports = { uploadTraffic, listTraffic, getTraffic };
