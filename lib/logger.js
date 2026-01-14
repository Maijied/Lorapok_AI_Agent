const winston = require('winston');
const path = require('path');
const os = require('os');

const logDir = path.join(os.homedir(), '.lorapok', 'logs');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log')
        })
    ]
});

// Console logging is disabled to keep the interactive CLI UI clean.
// Use combined.log for debugging.

module.exports = logger;
