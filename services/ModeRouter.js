/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * ModeRouter — routes user input to the correct mode handler.
 * Supports explicit mode selection and optional phrasing-based inference.
 */
'use strict';

const logger = require('../lib/logger');
const { VALID_MODES } = require('./SessionManager');

// ── Mode Inference Patterns ──────────────────────────────────────────

/**
 * Pattern-based mode inference rules.
 * Each rule has a test function and a target mode.
 */
const INFERENCE_RULES = [
    {
        mode: 'plan',
        test: (input) => /^(plan|design|architect|outline|propose|draft)\s/i.test(input) ||
                         /\b(create a plan|make a plan|implementation plan)\b/i.test(input)
    },
    {
        mode: 'agentic',
        test: (input) => /^(do|execute|implement|build|fix|refactor|apply|run)\s/i.test(input) ||
                         /\b(go ahead|make it happen|apply the plan|execute the plan)\b/i.test(input)
    },
    {
        mode: 'analysis',
        test: (input) => /^(debug|analyze|diagnose|investigate|trace|explain\s+error)\s/i.test(input) ||
                         /\b(stack trace|error log|failing test|bug|root cause)\b/i.test(input)
    }
    // chat is the default fallback, no explicit pattern needed
];

// ── ModeRouter Class ─────────────────────────────────────────────────

/**
 * Routes user input to the correct mode handler.
 */
class ModeRouter {
    /**
     * @param {Object} [options={}]
     * @param {boolean} [options.inferMode=false] - Enable phrasing-based mode inference
     * @param {string} [options.defaultMode='chat'] - Default mode when no match
     */
    constructor(options = {}) {
        this.inferMode = Boolean(options.inferMode);
        this.defaultMode = VALID_MODES.has(options.defaultMode) ? options.defaultMode : 'chat';
    }

    /**
     * Route user input to a mode.
     * Checks for explicit mode commands first, then optional inference.
     *
     * @param {string} input - User input string
     * @param {string} [currentMode='chat'] - Current active mode
     * @returns {{ mode: string, isExplicit: boolean, input: string, reason: string }}
     */
    route(input, currentMode = 'chat') {
        if (!input || typeof input !== 'string') {
            return { mode: currentMode, isExplicit: false, input: '', reason: 'empty input' };
        }

        const trimmed = input.trim();

        // 1. Explicit slash command mode switching
        const explicitResult = this._checkExplicitMode(trimmed);
        if (explicitResult) {
            return explicitResult;
        }

        // 2. Phrasing-based inference (if enabled)
        if (this.inferMode) {
            const inferred = this._inferMode(trimmed);
            if (inferred) {
                return inferred;
            }
        }

        // 3. Default: stay in current mode
        return {
            mode: currentMode,
            isExplicit: false,
            input: trimmed,
            reason: `staying in ${currentMode} mode`
        };
    }

    /**
     * Check for explicit mode commands (e.g., /chat, /plan, /agent, /analyze).
     * @private
     * @param {string} input
     * @returns {{ mode: string, isExplicit: boolean, input: string, reason: string }|null}
     */
    _checkExplicitMode(input) {
        const modeMap = {
            '/chat': 'chat',
            '/plan': 'plan',
            '/agent': 'agentic',
            '/agentic': 'agentic',
            '/analyze': 'analysis',
            '/analysis': 'analysis',
            '/debug': 'analysis'
        };

        const firstWord = input.split(/\s+/)[0].toLowerCase();
        if (modeMap[firstWord]) {
            const mode = modeMap[firstWord];
            const remainingInput = input.slice(firstWord.length).trim();
            return {
                mode,
                isExplicit: true,
                input: remainingInput,
                reason: `explicit mode command: ${firstWord}`
            };
        }

        return null;
    }

    /**
     * Infer mode from input phrasing.
     * @private
     * @param {string} input
     * @returns {{ mode: string, isExplicit: boolean, input: string, reason: string }|null}
     */
    _inferMode(input) {
        for (const rule of INFERENCE_RULES) {
            if (rule.test(input)) {
                return {
                    mode: rule.mode,
                    isExplicit: false,
                    input,
                    reason: `inferred from phrasing (matched ${rule.mode} pattern)`
                };
            }
        }
        return null;
    }

    /**
     * Validate a mode transition.
     * Some transitions may require specific conditions.
     * @param {string} fromMode - Current mode
     * @param {string} toMode - Target mode
     * @returns {{ allowed: boolean, reason: string }}
     */
    validateTransition(fromMode, toMode) {
        // All transitions are currently allowed, but this is the extension point
        // for future restrictions (e.g., must have a plan before entering agentic mode)
        if (!VALID_MODES.has(toMode)) {
            return { allowed: false, reason: `Invalid target mode: "${toMode}"` };
        }
        return { allowed: true, reason: `${fromMode} → ${toMode}` };
    }

    /**
     * Get the permissions profile for a mode.
     * Different modes have different default permission levels.
     * @param {string} mode
     * @returns {{ canExecuteTools: boolean, canWriteFiles: boolean, canRunCommands: boolean, requiresPlan: boolean }}
     */
    getModePermissions(mode) {
        switch (mode) {
            case 'chat':
                return { canExecuteTools: false, canWriteFiles: false, canRunCommands: false, requiresPlan: false };
            case 'plan':
                return { canExecuteTools: false, canWriteFiles: false, canRunCommands: false, requiresPlan: false };
            case 'agentic':
                return { canExecuteTools: true, canWriteFiles: true, canRunCommands: true, requiresPlan: false };
            case 'analysis':
                return { canExecuteTools: true, canWriteFiles: false, canRunCommands: true, requiresPlan: false };
            default:
                return { canExecuteTools: false, canWriteFiles: false, canRunCommands: false, requiresPlan: false };
        }
    }

    /**
     * Enable or disable mode inference.
     * @param {boolean} enabled
     */
    setInferMode(enabled) {
        this.inferMode = Boolean(enabled);
    }
}

module.exports = {
    ModeRouter,
    INFERENCE_RULES
};
