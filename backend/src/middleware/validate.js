// src/middleware/validate.js
// Request body validation middleware using Joi schemas.
// Usage: router.post('/route', validate(schema), controller)

const logger = require('../utils/logger');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false, // return all validation errors, not just the first
    stripUnknown: true, // remove unknown keys from req.body/params
  });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, '')).join('. ');
    logger.debug(`Validation failed for ${req.originalUrl} (${property}): ${messages}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => ({
        field: d.context?.label || d.path?.join('.'),
        message: d.message.replace(/['"]/g, ''),
      })),
    });
  }

  req[property] = value; // replace with sanitized/stripped values
  next();
};

module.exports = validate;
