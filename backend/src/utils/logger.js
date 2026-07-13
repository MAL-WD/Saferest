// src/utils/logger.js
// Winston logger with Console + File transports, used across the entire backend

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, colorize, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      handleExceptions: true,
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
