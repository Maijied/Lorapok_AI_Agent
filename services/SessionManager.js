/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * SessionManager — tracks mode state, conversation history,
 * context window budgets, cost accumulation, and working-set files.
 */
'use strict';

const logger = require('../lib/logger');
const { UnifiedMessage, estimateTokensForMessages } = require('../lib/core/UnifiedMessage');

// ── Valid Modes ──────────────────────────────────────────────────────

const VALID_MODES = new Set(['chat', 'plan', 'agentic', 'analysis']);

// ── SessionManager Class ─────────────────────────────────────────────

/**
 * Manages session-level state: mode, history, budgets, and working-set files.
 */
class SessionManager {
    /**
     * @param {Object} [options={}]
     * @param {string} [options.sessionId] - Unique session identifier
     * @param {string} [options.mode='chat'] - Initial mode
     * @param {number} [options.contextBudget=128000] - Max tokens for context window
     * @param {number} [options.maxHistoryMessages=100] - Max messages to retain before summarization
     */
    constructor(options = {}) {
        this.sessionId = options.sessionId || `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.mode = VALID_MODES.has(options.mode) ? options.mode : 'chat';
        this.contextBudget = options.contextBudget || 128000;
        this.maxHistoryMessages = options.maxHistoryMessages || 100;

        /** @type {UnifiedMessage[]} */
        this.history = [];

        /** @type {Set<string>} */
        this.workingSetFiles = new Set();

        // Cost/token tracking
        this.metrics = {
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalCostUsd: 0,
            modelUsage: {},  // { modelId: { calls: n, tokens: n } }
            startTime: Date.now()
        };

        // Mode switch history
        this._modeSwitchLog = [];
    }

    /**
     * Switch the session mode.
     * Preserves conversation history but logs the switch.
     * @param {string} newMode - Target mode
     * @returns {{ previousMode: string, newMode: string }}
     * @throws {Error} If mode is invalid
     */
    switchMode(newMode) {
        if (!VALID_MODES.has(newMode)) {
            throw new Error(`Invalid mode: "${newMode}". Must be one of: ${[...VALID_MODES].join(', ')}`);
        }
        const previousMode = this.mode;
        this.mode = newMode;
        this._modeSwitchLog.push({
            from: previousMode,
            to: newMode,
            timestamp: Date.now(),
            historyLength: this.history.length
        });
        logger.info(`SessionManager: mode switch ${previousMode} → ${newMode}`);
        return { previousMode, newMode };
    }

    /**
     * Add a message to the conversation history.
     * Auto-trims if history exceeds maxHistoryMessages.
     * @param {UnifiedMessage} message - Message to add
     */
    addMessage(message) {
        if (!(message instanceof UnifiedMessage)) {
            throw new TypeError('addMessage requires a UnifiedMessage instance');
        }
        this.history.push(message);

        // Auto-trim oldest messages if we exceed the limit
        if (this.history.length > this.maxHistoryMessages) {
            this._trimHistory();
        }
    }

    /**
     * Get the current conversation history.
     * @returns {UnifiedMessage[]}
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Get history messages that fit within a token budget.
     * Returns the most recent messages that fit.
     * @param {number} [budget] - Token budget (defaults to this.contextBudget)
     * @returns {UnifiedMessage[]}
     */
    getHistoryWithinBudget(budget) {
        const maxTokens = budget || this.contextBudget;
        const result = [];
        let totalTokens = 0;

        // Walk backwards from most recent
        for (let i = this.history.length - 1; i >= 0; i--) {
            const msg = this.history[i];
            const msgTokens = msg.estimateTokens();
            if (totalTokens + msgTokens > maxTokens) break;
            result.unshift(msg);
            totalTokens += msgTokens;
        }

        return result;
    }

    /**
     * Estimate total token usage of the current history.
     * @returns {number}
     */
    estimateHistoryTokens() {
        return estimateTokensForMessages(this.history);
    }

    /**
     * Get context utilization percentage.
     * @returns {number} 0–100
     */
    getContextUtilization() {
        const used = this.estimateHistoryTokens();
        return Math.round((used / this.contextBudget) * 100);
    }

    /**
     * Add a file to the working set.
     * @param {string} filePath
     */
    addWorkingFile(filePath) {
        this.workingSetFiles.add(filePath);
    }

    /**
     * Remove a file from the working set.
     * @param {string} filePath
     */
    removeWorkingFile(filePath) {
        this.workingSetFiles.delete(filePath);
    }

    /**
     * Get all files in the working set.
     * @returns {string[]}
     */
    getWorkingFiles() {
        return [...this.workingSetFiles];
    }

    /**
     * Record model usage metrics.
     * @param {string} modelId - Model used
     * @param {Object} usage - Token/cost usage { promptTokens, completionTokens, costUsd }
     */
    recordUsage(modelId, usage) {
        const prompt = usage.promptTokens || 0;
        const completion = usage.completionTokens || 0;
        const cost = usage.costUsd || 0;

        this.metrics.promptTokens += prompt;
        this.metrics.completionTokens += completion;
        this.metrics.totalTokens += prompt + completion;
        this.metrics.totalCostUsd += cost;

        if (!this.metrics.modelUsage[modelId]) {
            this.metrics.modelUsage[modelId] = { calls: 0, tokens: 0 };
        }
        this.metrics.modelUsage[modelId].calls++;
        this.metrics.modelUsage[modelId].tokens += prompt + completion;
    }

    /**
     * Get session metrics summary.
     * @returns {Object}
     */
    getMetrics() {
        return {
            ...this.metrics,
            durationMs: Date.now() - this.metrics.startTime,
            historyLength: this.history.length,
            workingFiles: this.workingSetFiles.size,
            mode: this.mode,
            contextUtilization: this.getContextUtilization()
        };
    }

    /**
     * Trim history by removing oldest messages, keeping a summary placeholder.
     * @private
     */
    _trimHistory() {
        const excess = this.history.length - this.maxHistoryMessages;
        if (excess <= 0) return;

        // Remove oldest messages and insert a summary placeholder
        const removed = this.history.splice(0, excess);
        const summaryText = `[Session history trimmed: ${removed.length} older messages removed for context budget]`;
        this.history.unshift(UnifiedMessage.systemText(summaryText));
        logger.info(`SessionManager: trimmed ${removed.length} messages from history`);
    }

    /**
     * Clear conversation history.
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Serialize session state for persistence.
     * @returns {Object}
     */
    toJSON() {
        return {
            sessionId: this.sessionId,
            mode: this.mode,
            contextBudget: this.contextBudget,
            history: this.history.map(m => m.toJSON()),
            workingSetFiles: [...this.workingSetFiles],
            metrics: { ...this.metrics },
            modeSwitchLog: [...this._modeSwitchLog]
        };
    }

    /**
     * Restore session state from a serialized object.
     * @param {Object} obj
     * @returns {SessionManager}
     */
    static fromJSON(obj) {
        const session = new SessionManager({
            sessionId: obj.sessionId,
            mode: obj.mode,
            contextBudget: obj.contextBudget
        });
        session.history = (obj.history || []).map(m => UnifiedMessage.fromJSON(m));
        session.workingSetFiles = new Set(obj.workingSetFiles || []);
        session.metrics = { ...session.metrics, ...obj.metrics };
        session._modeSwitchLog = obj.modeSwitchLog || [];
        return session;
    }
}

module.exports = {
    SessionManager,
    VALID_MODES
};
