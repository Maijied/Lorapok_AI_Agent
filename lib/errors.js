/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

/**
 * Base custom error for Lorapok AI Coding Agent.
 * @extends Error
 */
class LorapokError extends Error {
    /**
     * @param {string} message - Error description
     * @param {string} [code='INTERNAL_ERROR'] - Unique error code
     * @param {any} [details=null] - Additional diagnostic metadata
     */
    constructor(message, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * API communication and HTTP response errors.
 * @extends LorapokError
 */
class APIError extends LorapokError {
    /**
     * @param {string} message - Error message
     * @param {number} [statusCode=500] - HTTP status code
     * @param {string} [endpoint=''] - API endpoint target
     */
    constructor(message, statusCode = 500, endpoint = '') {
        super(message, 'API_ERROR', { statusCode, endpoint });
        this.statusCode = statusCode;
        this.endpoint = endpoint;
    }
}

/**
 * Input and parameter validation errors.
 * @extends LorapokError
 */
class ValidationError extends LorapokError {
    /**
     * @param {string} message - Validation error description
     * @param {string} [field=''] - Invalid field name
     */
    constructor(message, field = '') {
        super(message, 'VALIDATION_ERROR', { field });
        this.field = field;
    }
}

/**
 * File system operation and I/O errors.
 * @extends LorapokError
 */
class FileSystemError extends LorapokError {
    /**
     * @param {string} message - Error description
     * @param {string} [path=''] - Targeted file system path
     */
    constructor(message, path = '') {
        super(message, 'FILE_SYSTEM_ERROR', { path });
        this.path = path;
    }
}

/**
 * Git version control operation errors.
 * @extends LorapokError
 */
class GitError extends LorapokError {
    /**
     * @param {string} message - Error description
     * @param {string} [command=''] - Executed Git command
     */
    constructor(message, command = '') {
        super(message, 'GIT_ERROR', { command });
        this.command = command;
    }
}

/**
 * Error boundary helper for wrapping async execution into standard result shapes.
 */
class ErrorBoundary {
    /**
     * Wraps an async function to catch errors and return standard `{ success, data, error }`.
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Wrapped async function
     */
    static wrap(fn) {
        return async (...args) => {
            try {
                const data = await fn(...args);
                return { success: true, data };
            } catch (err) {
                const error = err instanceof LorapokError 
                    ? err 
                    : new LorapokError(err.message || String(err));
                return { success: false, error: error.message, code: error.code, details: error.details };
            }
        };
    }
}

module.exports = {
    LorapokError,
    APIError,
    ValidationError,
    FileSystemError,
    GitError,
    ErrorBoundary
};
