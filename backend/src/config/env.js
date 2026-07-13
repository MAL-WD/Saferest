// src/config/env.js
// Validates all required environment variables at startup using Joi.
// The app will throw immediately if any required variable is missing or invalid.

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(20).required(),
  JWT_REFRESH_SECRET: Joi.string().min(20).required(),
  REDIS_URL: Joi.string().uri().required(),
  PCAP_AI_API_URL: Joi.string().uri().optional(),
  PCAP_AI_API_KEY: Joi.string().allow('').optional(),
  PCAP_MAX_SIZE_MB: Joi.number().integer().min(1).max(1024).optional(),
  AI_SERVICE_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(100),
}).unknown(true); // allow other env vars like PATH, etc.

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(` Environment validation failed: ${error.message}`);
}

module.exports = value;
