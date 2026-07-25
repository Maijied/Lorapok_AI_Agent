/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const winston = require('winston');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logDir = path.join(os.homedir(), '.lorapok', 'logs');

let transports;
if (process.env.NODE_ENV === 'test') {
    transports = [new winston.transports.Console({ silent: true })];
} else {
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        transports = [
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error'
            }),
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log')
            })
        ];
    } catch (e) {
        transports = [new winston.transports.Console({ silent: true })];
    }
}

/**
 * Winston logger instance configured for Lorapok file-based logging.
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: transports
});

module.exports = logger;
