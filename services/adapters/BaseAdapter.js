/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * BaseAdapter — abstract base class for all provider adapters.
 * Every adapter translates between UnifiedMessage and a provider's native API format.
 */
'use strict';

const { LorapokError } = require('../../lib/errors');

/**
 * Abstract base adapter that all provider adapters must extend.
 * Enforces a consistent interface for the orchestrator.
 */
class BaseAdapter {
    /**
     * @param {Object} options - Adapter configuration
     * @param {string} options.name - Provider name (e.g., 'perplexity', 'openrouter', 'google-ai-studio')
     * @param {Object} options.capabilities - Provider capability flags
     * @param {boolean} options.capabilities.toolUse - Supports tool/function calling
     * @param {boolean} options.capabilities.streaming - Supports streaming responses
     * @param {number} options.capabilities.contextWindow - Default context window size
     * @param {boolean} options.capabilities.vision - Supports image/vision input
     */
    constructor(options) {
        if (!options || typeof options !== 'object') {
            throw new LorapokError('BaseAdapter requires an options object');
        }
        if (!options.name || typeof options.name !== 'string') {
            throw new LorapokError('BaseAdapter requires a non-empty name');
        }
        if (!options.capabilities || typeof options.capabilities !== 'object') {
            throw new LorapokError('BaseAdapter requires a capabilities object');
        }

        this.name = options.name;
        this.capabilities = {
            toolUse: Boolean(options.capabilities.toolUse),
            streaming: Boolean(options.capabilities.streaming),
            contextWindow: Number(options.capabilities.contextWindow) || 128000,
            vision: Boolean(options.capabilities.vision)
        };

        // Health state
        this._lastHealthCheck = null;
        this._available = true;
        this._failureCount = 0;
    }

    /**
     * Convert UnifiedMessage array + ToolSpec array into provider-native request format.
     * @param {import('../../lib/core/UnifiedMessage').UnifiedMessage[]} messages - Unified messages
     * @param {import('../../lib/core/ToolSpec').ToolSpec[]} [tools=[]] - Available tools
     * @returns {Object} Provider-native request body
     * @abstract
     */
    toNative(messages, tools = []) {
        throw new LorapokError(`${this.name}: toNative() not implemented`);
    }

    /**
     * Convert a provider-native response into a UnifiedMessage.
     * @param {Object} response - Provider-native response object
     * @returns {import('../../lib/core/UnifiedMessage').UnifiedMessage} Unified message
     * @abstract
     */
    fromNative(response) {
        throw new LorapokError(`${this.name}: fromNative() not implemented`);
    }

    /**
     * Estimate token count for a set of messages in this provider's tokenization scheme.
     * @param {import('../../lib/core/UnifiedMessage').UnifiedMessage[]} messages - Messages to count
     * @returns {number} Estimated token count
     */
    estimateTokens(messages) {
        // Default implementation uses char-based heuristic from UnifiedMessage
        const { estimateTokensForMessages } = require('../../lib/core/UnifiedMessage');
        return estimateTokensForMessages(messages);
    }

    /**
     * Check if this adapter is currently available (healthy).
     * @returns {boolean}
     */
    isAvailable() {
        return this._available;
    }

    /**
     * Mark this adapter as unavailable after a failure.
     */
    markUnavailable() {
        this._available = false;
        this._failureCount++;
        this._lastHealthCheck = Date.now();
    }

    /**
     * Mark this adapter as available after a successful operation.
     */
    markAvailable() {
        this._available = true;
        this._failureCount = 0;
        this._lastHealthCheck = Date.now();
    }

    /**
     * Get failure statistics for routing penalty calculations.
     * @returns {{ failureCount: number, lastCheck: number|null, available: boolean }}
     */
    getHealthStats() {
        return {
            failureCount: this._failureCount,
            lastCheck: this._lastHealthCheck,
            available: this._available
        };
    }

    /**
     * Get the base URL for this provider's API.
     * @returns {string}
     * @abstract
     */
    getBaseUrl() {
        throw new LorapokError(`${this.name}: getBaseUrl() not implemented`);
    }

    /**
     * Build request headers for this provider.
     * @param {string} apiKey - API key for authentication
     * @returns {Object} Headers object
     * @abstract
     */
    buildHeaders(apiKey) {
        throw new LorapokError(`${this.name}: buildHeaders() not implemented`);
    }

    /**
     * Serialize adapter metadata (without secrets).
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
            capabilities: { ...this.capabilities },
            health: this.getHealthStats()
        };
    }
}

module.exports = { BaseAdapter };
