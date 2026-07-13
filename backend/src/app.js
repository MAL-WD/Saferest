// src/app.js
// Express application setup — configures all global middleware.
// Does NOT start the server; that's done in server.js.

require('dotenv').config();
require('./config/env'); // validate env vars at startup

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { apiLimiter, scanPollLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const targetRoutes = require('./routes/targets');
const scanRoutes = require('./routes/scans');
const reportRoutes = require('./routes/reports');
const emailScanRoutes = require('./routes/email-scan');
const codeScanRoutes = require('./routes/code-scan');
const scoresRoutes = require('./routes/scores');
const trafficRoutes = require('./routes/traffic');
const firewallRoutes = require('./routes/firewall');
const reconRoutes = require('./routes/recon');
const pcapScanRoutes = require('./routes/pcap-scan');
const automationRoutes = require('./routes/automation');

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    logger.debug(`OPTIONS request received path=${req.url} origin=${req.headers.origin}`);
  }
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, origin || '*');
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api/code-scan', express.json({ limit: '600kb' }));
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Scan status polling gets a much higher rate-limit ceiling to avoid 429 during background polling
app.use('/api/code-scan', scanPollLimiter);
app.use('/api', apiLimiter);

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'saferest-backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/recon', reconRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email-scan', emailScanRoutes);
app.use('/api/code-scan', codeScanRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/firewall', firewallRoutes);
app.use('/api/pcap-scan', pcapScanRoutes);
app.use('/api/automations', automationRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;
