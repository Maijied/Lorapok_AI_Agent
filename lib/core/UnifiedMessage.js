/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * UnifiedMessage — the canonical internal message format.
 * Every component above the Provider Adapter Layer speaks this schema exclusively.
 */
'use strict';

const crypto = require('crypto');

// ── Content Block Factories ──────────────────────────────────────────

/**
 * Create a text content block.
 * @param {string} text - The text content
 * @returns {{ type: 'text', text: string }}
 */
function textBlock(text) {
    if (typeof text !== 'string') {
        throw new TypeError('textBlock requires a string argument');
    }
    return { type: 'text', text };
}

/**
 * Create a tool-call content block.
 * @param {string} id - Unique call identifier
 * @param {string} name - Tool name
 * @param {Object} input - Tool input arguments
 * @returns {{ type: 'tool_call', id: string, name: string, input: Object }}
 */
function toolCallBlock(id, name, input) {
    if (!id || typeof id !== 'string') throw new TypeError('toolCallBlock requires a non-empty string id');
    if (!name || typeof name !== 'string') throw new TypeError('toolCallBlock requires a non-empty string name');
    if (input !== null && typeof input !== 'object') throw new TypeError('toolCallBlock input must be an object or null');
    return { type: 'tool_call', id, name, input: input || {} };
}

/**
 * Create a tool-result content block.
 * @param {string} toolCallId - ID of the tool_call this responds to
 * @param {string} output - Result output string
 * @param {boolean} [isError=false] - Whether the result represents an error
 * @returns {{ type: 'tool_result', tool_call_id: string, output: string, is_error: boolean }}
 */
function toolResultBlock(toolCallId, output, isError = false) {
    if (!toolCallId || typeof toolCallId !== 'string') throw new TypeError('toolResultBlock requires a non-empty string toolCallId');
    if (typeof output !== 'string') throw new TypeError('toolResultBlock output must be a string');
    return { type: 'tool_result', tool_call_id: toolCallId, output, is_error: Boolean(isError) };
}

// ── Content Block Validation ─────────────────────────────────────────

const VALID_BLOCK_TYPES = new Set(['text', 'tool_call', 'tool_result']);

/**
 * Validate a single content block.
 * @param {Object} block - Content block to validate
 * @returns {boolean} True if valid
 * @throws {TypeError} If block is malformed
 */
function validateBlock(block) {
    if (!block || typeof block !== 'object') {
        throw new TypeError('Content block must be a non-null object');
    }
    if (!VALID_BLOCK_TYPES.has(block.type)) {
        throw new TypeError(`Invalid content block type: ${block.type}. Must be one of: ${[...VALID_BLOCK_TYPES].join(', ')}`);
    }
    switch (block.type) {
        case 'text':
            if (typeof block.text !== 'string') throw new TypeError('text block requires a string "text" field');
            break;
        case 'tool_call':
            if (!block.id || typeof block.id !== 'string') throw new TypeError('tool_call block requires a non-empty string "id"');
            if (!block.name || typeof block.name !== 'string') throw new TypeError('tool_call block requires a non-empty string "name"');
            if (block.input !== null && typeof block.input !== 'object') throw new TypeError('tool_call block "input" must be an object or null');
            break;
        case 'tool_result':
            if (!block.tool_call_id || typeof block.tool_call_id !== 'string') throw new TypeError('tool_result block requires a non-empty string "tool_call_id"');
            if (typeof block.output !== 'string') throw new TypeError('tool_result block requires a string "output"');
            break;
    }
    return true;
}

// ── Unified Message Class ────────────────────────────────────────────

const VALID_ROLES = new Set(['user', 'assistant', 'tool', 'system']);

/**
 * The canonical message format used across the entire system.
 * Every provider adapter translates to/from this representation.
 */
class UnifiedMessage {
    /**
     * @param {string} role - 'user' | 'assistant' | 'tool' | 'system'
     * @param {Array<Object>} content - Array of ContentBlock objects
     */
    constructor(role, content) {
        if (!VALID_ROLES.has(role)) {
            throw new TypeError(`Invalid role: "${role}". Must be one of: ${[...VALID_ROLES].join(', ')}`);
        }
        if (!Array.isArray(content)) {
            throw new TypeError('content must be an array of ContentBlock objects');
        }
        for (const block of content) {
            validateBlock(block);
        }
        this.role = role;
        this.content = content;
    }

    // ── Factory Helpers ──────────────────────────────────────────────

    /**
     * Create a user message with text content.
     * @param {string} text - User text
     * @returns {UnifiedMessage}
     */
    static userText(text) {
        return new UnifiedMessage('user', [textBlock(text)]);
    }

    /**
     * Create an assistant message with text content.
     * @param {string} text - Assistant text
     * @returns {UnifiedMessage}
     */
    static assistantText(text) {
        return new UnifiedMessage('assistant', [textBlock(text)]);
    }

    /**
     * Create a system message with text content.
     * @param {string} text - System instruction text
     * @returns {UnifiedMessage}
     */
    static systemText(text) {
        return new UnifiedMessage('system', [textBlock(text)]);
    }

    /**
     * Create an assistant message containing tool call(s).
     * @param {Array<{id: string, name: string, input: Object}>} calls - Tool call descriptors
     * @returns {UnifiedMessage}
     */
    static assistantToolCalls(calls) {
        if (!Array.isArray(calls) || calls.length === 0) {
            throw new TypeError('assistantToolCalls requires a non-empty array of call descriptors');
        }
        const blocks = calls.map(c => toolCallBlock(c.id, c.name, c.input));
        return new UnifiedMessage('assistant', blocks);
    }

    /**
     * Create a tool result message.
     * @param {string} toolCallId - ID of the originating tool_call
     * @param {string} output - Tool execution result
     * @param {boolean} [isError=false] - Whether result is an error
     * @returns {UnifiedMessage}
     */
    static toolResult(toolCallId, output, isError = false) {
        return new UnifiedMessage('tool', [toolResultBlock(toolCallId, output, isError)]);
    }

    // ── Accessors ────────────────────────────────────────────────────

    /**
     * Get concatenated text from all text blocks in the message.
     * @returns {string}
     */
    getText() {
        return this.content
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('\n');
    }

    /**
     * Get all tool_call blocks from the message.
     * @returns {Array<Object>}
     */
    getToolCalls() {
        return this.content.filter(b => b.type === 'tool_call');
    }

    /**
     * Get all tool_result blocks from the message.
     * @returns {Array<Object>}
     */
    getToolResults() {
        return this.content.filter(b => b.type === 'tool_result');
    }

    /**
     * Check if this message contains any tool calls.
     * @returns {boolean}
     */
    hasToolCalls() {
        return this.content.some(b => b.type === 'tool_call');
    }

    // ── Serialization ────────────────────────────────────────────────

    /**
     * Serialize to a plain JSON-safe object.
     * @returns {{ role: string, content: Array<Object> }}
     */
    toJSON() {
        return { role: this.role, content: this.content };
    }

    /**
     * Deserialize from a plain object.
     * @param {Object} obj - Plain object with role and content
     * @returns {UnifiedMessage}
     */
    static fromJSON(obj) {
        if (!obj || typeof obj !== 'object') {
            throw new TypeError('fromJSON requires a non-null object');
        }
        return new UnifiedMessage(obj.role, obj.content || []);
    }

    // ── Token Estimation ─────────────────────────────────────────────

    /**
     * Estimate token count for this message using char-based heuristic.
     * Roughly 4 characters per token for English text.
     * @returns {number} Estimated token count
     */
    estimateTokens() {
        return estimateTokensForMessages([this]);
    }
}

// ── Standalone Utilities ─────────────────────────────────────────────

/**
 * Estimate total tokens for an array of UnifiedMessages.
 * Uses ~4 chars/token heuristic (close to tiktoken cl100k for English).
 * @param {UnifiedMessage[]} messages - Messages to estimate
 * @returns {number} Total estimated token count
 */
function estimateTokensForMessages(messages) {
    let totalChars = 0;
    for (const msg of messages) {
        // Role overhead (~4 tokens)
        totalChars += 16;
        for (const block of msg.content) {
            switch (block.type) {
                case 'text':
                    totalChars += (block.text || '').length;
                    break;
                case 'tool_call':
                    totalChars += (block.name || '').length;
                    totalChars += JSON.stringify(block.input || {}).length;
                    totalChars += 40; // structural overhead
                    break;
                case 'tool_result':
                    totalChars += (block.output || '').length;
                    totalChars += 20; // structural overhead
                    break;
            }
        }
    }
    return Math.ceil(totalChars / 4);
}

/**
 * Generate a deterministic hash for a message array (cache keying).
 * @param {UnifiedMessage[]} messages - Messages to hash
 * @returns {string} SHA-256 hex digest
 */
function hashMessages(messages) {
    const serialized = JSON.stringify(messages.map(m => m.toJSON()));
    return crypto.createHash('sha256').update(serialized).digest('hex');
}

module.exports = {
    UnifiedMessage,
    textBlock,
    toolCallBlock,
    toolResultBlock,
    validateBlock,
    estimateTokensForMessages,
    hashMessages,
    VALID_ROLES,
    VALID_BLOCK_TYPES
};
