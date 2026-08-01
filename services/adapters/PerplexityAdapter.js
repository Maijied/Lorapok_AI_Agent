/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * PerplexityAdapter — translates UnifiedMessage ↔ Perplexity API format.
 * Perplexity does NOT support tool/function calling (toolUse: false).
 */
'use strict';

const { BaseAdapter } = require('./BaseAdapter');
const { UnifiedMessage, textBlock } = require('../../lib/core/UnifiedMessage');

/**
 * Adapter for the Perplexity AI API.
 * Handles citation extraction and enforces no-tool-use constraint.
 */
class PerplexityAdapter extends BaseAdapter {
    constructor() {
        super({
            name: 'perplexity',
            capabilities: {
                toolUse: false,
                streaming: true,
                contextWindow: 127000,
                vision: false
            }
        });
        this._baseUrl = 'https://api.perplexity.ai/chat/completions';
    }

    /**
     * Convert UnifiedMessage array to Perplexity API request body.
     * Strips tool_call and tool_result blocks since Perplexity doesn't support them.
     * @param {UnifiedMessage[]} messages - Unified messages
     * @param {import('../../lib/core/ToolSpec').ToolSpec[]} [tools=[]] - Ignored (Perplexity has no tool support)
     * @returns {Object} Perplexity-compatible request body (messages array only, caller adds model/params)
     */
    toNative(messages, tools = []) {
        const nativeMessages = [];

        for (const msg of messages) {
            const textContent = msg.getText();
            if (!textContent && msg.role !== 'assistant') continue;

            // Perplexity uses simple {role, content} format
            nativeMessages.push({
                role: msg.role === 'tool' ? 'user' : msg.role, // tool → user fallback
                content: textContent || ''
            });
        }

        return { messages: nativeMessages };
    }

    /**
     * Convert Perplexity API response to UnifiedMessage.
     * Extracts citations from the response if present.
     * @param {Object} response - Perplexity API response
     * @returns {UnifiedMessage} Unified assistant message
     */
    fromNative(response) {
        if (!response) {
            return UnifiedMessage.assistantText('');
        }

        let text = '';
        let citations = [];

        // Standard chat completion format
        if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
            const choice = response.choices[0];
            if (choice.message && choice.message.content) {
                text = choice.message.content;
            }
        }

        // Perplexity-specific citations
        if (Array.isArray(response.citations)) {
            citations = response.citations;
        }

        // Append citations as footnotes if present
        if (citations.length > 0) {
            text += '\n\n---\n**Sources:**\n';
            citations.forEach((url, i) => {
                text += `[${i + 1}] ${url}\n`;
            });
        }

        return UnifiedMessage.assistantText(text);
    }

    /**
     * @returns {string} Perplexity API base URL
     */
    getBaseUrl() {
        return this._baseUrl;
    }

    /**
     * Build Perplexity API request headers.
     * @param {string} apiKey - Perplexity API key
     * @returns {Object} Headers
     */
    buildHeaders(apiKey) {
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }
}

module.exports = { PerplexityAdapter };
