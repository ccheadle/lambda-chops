const winston = require('winston');

// Custom error message and stack formatter.
const errorStackFormat = winston.format((info) => {
  if (info instanceof Error) {
    return Object.assign({}, info, {
      stack: info.stack,
      message: info.message,
    });
  }
  return info;
});

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
    errorStackFormat(),
  ),
  transports: [new winston.transports.Console()],
});

module.exports = {
  errorStackFormat,
  logger,
};
