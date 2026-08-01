/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * Orchestrator — the central coordination brain.
 * Ties together ModelRouter, PolicyEngine, ToolRuntime,
 * and manages task decomposition, loop guards, and cost budgets.
 */
'use strict';

const logger = require('../lib/logger');
const { LorapokError, BudgetExhaustedError, LoopGuardError } = require('../lib/errors');
const { UnifiedMessage } = require('../lib/core/UnifiedMessage');

// ── Orchestrator Class ───────────────────────────────────────────────

/**
 * Central orchestration engine coordinating models, tools, and policies.
 */
class Orchestrator {
    /**
     * @param {Object} options
     * @param {import('./ModelRouter').ModelRouter} options.modelRouter - Model selection engine
     * @param {import('./PolicyEngine').PolicyEngine} options.policyEngine - Permission engine
     * @param {import('./ToolRuntime').ToolRuntime} options.toolRuntime - Tool execution engine
     * @param {Object} [options.budget={}] - Budget configuration
     * @param {number} [options.budget.maxToolCalls=25] - Max tool calls per task
     * @param {number} [options.budget.maxTokens=0] - Max tokens per task (0 = unlimited)
     * @param {number} [options.budget.maxCostUsd=0] - Max cost in USD per task (0 = unlimited)
     * @param {number} [options.maxRepeatedFailures=3] - Max consecutive identical failures
     */
    constructor(options) {
        if (!options || typeof options !== 'object') {
            throw new LorapokError('Orchestrator requires an options object');
        }

        this.modelRouter = options.modelRouter || null;
        this.policyEngine = options.policyEngine || null;
        this.toolRuntime = options.toolRuntime || null;

        // Budget
        this.budget = {
            maxToolCalls: (options.budget && options.budget.maxToolCalls) || 25,
            maxTokens: (options.budget && options.budget.maxTokens) || 0,
            maxCostUsd: (options.budget && options.budget.maxCostUsd) || 0
        };
        this.maxRepeatedFailures = options.maxRepeatedFailures || 3;

        // Runtime state
        this._state = {
            toolCallCount: 0,
            tokensUsed: 0,
            costUsd: 0,
            failureHistory: [],  // { toolName, target, errorMessage }
            isRunning: false,
            aborted: false
        };
    }

    /**
     * Process a single tool call through the full pipeline:
     * policy check → execute → result capture.
     *
     * @param {Object} toolCall - Tool call descriptor
     * @param {string} toolCall.id - Call identifier
     * @param {string} toolCall.name - Tool name
     * @param {Object} toolCall.input - Tool input
     * @returns {Promise<{ state: string, result: Object, policyDecision: Object }>}
     */
    async processToolCall(toolCall) {
        // Budget guard: max tool calls
        if (this.budget.maxToolCalls > 0 && this._state.toolCallCount >= this.budget.maxToolCalls) {
            throw new BudgetExhaustedError(
                `Max tool calls exceeded (${this.budget.maxToolCalls})`,
                'calls',
                this.budget.maxToolCalls,
                this._state.toolCallCount
            );
        }

        // Loop guard: repeated failures
        this._checkRepeatedFailures(toolCall);

        // 1. Get tool spec for policy tier
        const tool = this.toolRuntime ? this.toolRuntime.getTool(toolCall.name) : null;
        const policyTier = tool ? tool.spec.policyTier : 'confirm';

        // 2. Policy check
        const policyDecision = this.policyEngine
            ? this.policyEngine.evaluate({ ...toolCall, policyTier })
            : { state: 'auto_approved', reason: 'No policy engine', requiresUserInput: false };

        if (policyDecision.state === 'denied') {
            return {
                state: 'denied',
                result: { success: false, output: `Denied: ${policyDecision.reason}` },
                policyDecision
            };
        }

        if (policyDecision.state === 'needs_confirm') {
            return {
                state: 'needs_confirm',
                result: null,
                policyDecision
            };
        }

        // 3. Execute
        this._state.toolCallCount++;
        try {
            const result = this.toolRuntime
                ? await this.toolRuntime.execute(toolCall.name, toolCall.input)
                : { success: false, output: 'No tool runtime configured' };

            if (!result.success) {
                this._recordFailure(toolCall, result.output);
            } else {
                // Clear failure history for this tool+target combo on success
                this._clearFailureHistory(toolCall);
            }

            return {
                state: result.success ? 'succeeded' : 'failed',
                result,
                policyDecision
            };
        } catch (err) {
            this._recordFailure(toolCall, err.message);
            return {
                state: 'failed',
                result: { success: false, output: `Execution error: ${err.message}` },
                policyDecision
            };
        }
    }

    /**
     * Process multiple tool calls from an assistant message.
     * @param {UnifiedMessage} assistantMsg - Assistant message containing tool calls
     * @returns {Promise<Array<{ callId: string, state: string, result: Object }>>}
     */
    async processToolCalls(assistantMsg) {
        const toolCalls = assistantMsg.getToolCalls();
        const results = [];

        for (const tc of toolCalls) {
            const processed = await this.processToolCall({
                id: tc.id,
                name: tc.name,
                input: tc.input
            });
            results.push({
                callId: tc.id,
                ...processed
            });

            // Stop processing further calls if one is denied or needs confirmation
            if (processed.state === 'denied' || processed.state === 'needs_confirm') {
                break;
            }
        }

        return results;
    }

    /**
     * Check for repeated identical failures (same tool + same target failing consecutively).
     * @private
     * @param {Object} toolCall
     * @throws {LoopGuardError}
     */
    _checkRepeatedFailures(toolCall) {
        const target = toolCall.input ? (toolCall.input.path || toolCall.input.command || toolCall.input.target || '') : '';
        const key = `${toolCall.name}:${target}`;

        const recentFailures = this._state.failureHistory.filter(f =>
            f.key === key
        );

        if (recentFailures.length >= this.maxRepeatedFailures) {
            throw new LoopGuardError(
                `Same action "${toolCall.name}" on "${target}" has failed ${recentFailures.length} times consecutively. Stopping to prevent infinite loop.`,
                'repeated_failure',
                recentFailures.length
            );
        }
    }

    /**
     * Record a failure in the history.
     * @private
     * @param {Object} toolCall
     * @param {string} errorMessage
     */
    _recordFailure(toolCall, errorMessage) {
        const target = toolCall.input ? (toolCall.input.path || toolCall.input.command || toolCall.input.target || '') : '';
        this._state.failureHistory.push({
            key: `${toolCall.name}:${target}`,
            toolName: toolCall.name,
            target,
            errorMessage,
            timestamp: Date.now()
        });
    }

    /**
     * Clear failure history for a successful tool+target combo.
     * @private
     * @param {Object} toolCall
     */
    _clearFailureHistory(toolCall) {
        const target = toolCall.input ? (toolCall.input.path || toolCall.input.command || toolCall.input.target || '') : '';
        const key = `${toolCall.name}:${target}`;
        this._state.failureHistory = this._state.failureHistory.filter(f => f.key !== key);
    }

    /**
     * Track token usage.
     * @param {number} tokens - Tokens consumed
     */
    addTokenUsage(tokens) {
        this._state.tokensUsed += tokens;
        if (this.budget.maxTokens > 0 && this._state.tokensUsed >= this.budget.maxTokens) {
            throw new BudgetExhaustedError(
                `Token budget exhausted (${this._state.tokensUsed}/${this.budget.maxTokens})`,
                'tokens',
                this.budget.maxTokens,
                this._state.tokensUsed
            );
        }
    }

    /**
     * Track cost usage.
     * @param {number} costUsd - Cost in USD
     */
    addCostUsage(costUsd) {
        this._state.costUsd += costUsd;
        if (this.budget.maxCostUsd > 0 && this._state.costUsd >= this.budget.maxCostUsd) {
            throw new BudgetExhaustedError(
                `Cost budget exhausted ($${this._state.costUsd.toFixed(4)}/$${this.budget.maxCostUsd})`,
                'cost',
                this.budget.maxCostUsd,
                this._state.costUsd
            );
        }
    }

    /**
     * Get current runtime state and budget consumption.
     * @returns {Object}
     */
    getState() {
        return {
            toolCallCount: this._state.toolCallCount,
            tokensUsed: this._state.tokensUsed,
            costUsd: this._state.costUsd,
            failureCount: this._state.failureHistory.length,
            budget: { ...this.budget },
            isRunning: this._state.isRunning,
            aborted: this._state.aborted
        };
    }

    /**
     * Reset runtime state for a new task.
     */
    reset() {
        this._state = {
            toolCallCount: 0,
            tokensUsed: 0,
            costUsd: 0,
            failureHistory: [],
            isRunning: false,
            aborted: false
        };
    }

    /**
     * Abort the current orchestration run.
     */
    abort() {
        this._state.aborted = true;
        this._state.isRunning = false;
        logger.warn('Orchestrator: run aborted');
    }

    /**
     * Check if the orchestrator has been aborted.
     * @returns {boolean}
     */
    isAborted() {
        return this._state.aborted;
    }

    /**
     * Check remaining budget.
     * @returns {{ toolCallsRemaining: number, tokensRemaining: number, costRemaining: number }}
     */
    getRemainingBudget() {
        return {
            toolCallsRemaining: this.budget.maxToolCalls > 0
                ? Math.max(0, this.budget.maxToolCalls - this._state.toolCallCount) : Infinity,
            tokensRemaining: this.budget.maxTokens > 0
                ? Math.max(0, this.budget.maxTokens - this._state.tokensUsed) : Infinity,
            costRemaining: this.budget.maxCostUsd > 0
                ? Math.max(0, this.budget.maxCostUsd - this._state.costUsd) : Infinity
        };
    }
}

module.exports = { Orchestrator };
