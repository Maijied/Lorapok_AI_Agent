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
 * Policy engine denied a tool call or action.
 * @extends LorapokError
 */
class PolicyDeniedError extends LorapokError {
    /**
     * @param {string} message - Denial reason
     * @param {string} [toolName=''] - Tool that was denied
     * @param {string} [tier=''] - Policy tier that triggered denial
     */
    constructor(message, toolName = '', tier = '') {
        super(message, 'POLICY_DENIED', { toolName, tier });
        this.toolName = toolName;
        this.tier = tier;
    }
}

/**
 * Cost or token budget exhausted for a session or task.
 * @extends LorapokError
 */
class BudgetExhaustedError extends LorapokError {
    /**
     * @param {string} message - Budget description
     * @param {string} [budgetType='tokens'] - 'tokens' | 'cost' | 'calls'
     * @param {number} [limit=0] - Budget limit value
     * @param {number} [used=0] - Amount consumed
     */
    constructor(message, budgetType = 'tokens', limit = 0, used = 0) {
        super(message, 'BUDGET_EXHAUSTED', { budgetType, limit, used });
        this.budgetType = budgetType;
        this.limit = limit;
        this.used = used;
    }
}

/**
 * Agentic loop guard triggered (max iterations, repeated failures, etc.).
 * @extends LorapokError
 */
class LoopGuardError extends LorapokError {
    /**
     * @param {string} message - Guard trigger description
     * @param {string} [guardType='max_calls'] - 'max_calls' | 'repeated_failure' | 'circular'
     * @param {number} [iterations=0] - Number of iterations before trigger
     */
    constructor(message, guardType = 'max_calls', iterations = 0) {
        super(message, 'LOOP_GUARD', { guardType, iterations });
        this.guardType = guardType;
        this.iterations = iterations;
    }
}

/**
 * All providers for a required capability are unavailable.
 * @extends LorapokError
 */
class ProviderUnavailableError extends LorapokError {
    /**
     * @param {string} message - Unavailability description
     * @param {string} [capability=''] - Required capability (e.g., 'tool_use', 'vision')
     * @param {string[]} [triedProviders=[]] - Provider names that were attempted
     */
    constructor(message, capability = '', triedProviders = []) {
        super(message, 'PROVIDER_UNAVAILABLE', { capability, triedProviders });
        this.capability = capability;
        this.triedProviders = triedProviders;
    }
}

/**
 * Plan step is stale because referenced files changed since plan generation.
 * @extends LorapokError
 */
class PlanStaleError extends LorapokError {
    /**
     * @param {string} message - Staleness description
     * @param {string} [planId=''] - Plan identifier
     * @param {number[]} [staleSteps=[]] - Step numbers that are stale
     */
    constructor(message, planId = '', staleSteps = []) {
        super(message, 'PLAN_STALE', { planId, staleSteps });
        this.planId = planId;
        this.staleSteps = staleSteps;
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
    PolicyDeniedError,
    BudgetExhaustedError,
    LoopGuardError,
    ProviderUnavailableError,
    PlanStaleError,
    ErrorBoundary
};
