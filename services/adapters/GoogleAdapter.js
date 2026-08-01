/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * GoogleAdapter — translates UnifiedMessage ↔ Google AI Studio (Gemini) format.
 * Supports both the OpenAI-compat endpoint and native Gemini function_calling.
 */
'use strict';

const { BaseAdapter } = require('./BaseAdapter');
const { UnifiedMessage, textBlock, toolCallBlock } = require('../../lib/core/UnifiedMessage');

/**
 * Adapter for Google AI Studio / Gemini API.
 * Uses the OpenAI-compatible chat completions endpoint by default.
 */
class GoogleAdapter extends BaseAdapter {
    constructor() {
        super({
            name: 'google-ai-studio',
            capabilities: {
                toolUse: true,
                streaming: true,
                contextWindow: 1000000, // Gemini models support 1M+ context
                vision: true
            }
        });
        this._baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    }

    /**
     * Convert UnifiedMessage array to Google AI Studio (OpenAI-compat) request body.
     * @param {UnifiedMessage[]} messages - Unified messages
     * @param {import('../../lib/core/ToolSpec').ToolSpec[]} [tools=[]] - Available tools
     * @returns {Object} Google AI Studio compatible request body
     */
    toNative(messages, tools = []) {
        const nativeMessages = [];

        for (const msg of messages) {
            if (msg.role === 'tool') {
                // Tool results: Google OpenAI-compat uses same format as OpenAI
                for (const block of msg.getToolResults()) {
                    nativeMessages.push({
                        role: 'tool',
                        tool_call_id: block.tool_call_id,
                        content: block.output
                    });
                }
                continue;
            }

            if (msg.role === 'assistant' && msg.hasToolCalls()) {
                const toolCalls = msg.getToolCalls().map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.input || {})
                    }
                }));
                const textContent = msg.getText();
                nativeMessages.push({
                    role: 'assistant',
                    content: textContent || null,
                    tool_calls: toolCalls
                });
                continue;
            }

            // Standard text messages — Google uses 'model' instead of 'assistant' in native API,
            // but OpenAI-compat endpoint accepts 'assistant'
            nativeMessages.push({
                role: msg.role,
                content: msg.getText() || ''
            });
        }

        const result = { messages: nativeMessages };

        // Add tools using Google-compatible schema (stripped of unsupported fields)
        if (tools.length > 0) {
            result.tools = tools.map(t => ({
                type: 'function',
                function: t.toProviderSchema('google')
            }));
        }

        return result;
    }

    /**
     * Convert Google AI Studio API response to UnifiedMessage.
     * @param {Object} response - Google AI Studio API response
     * @returns {UnifiedMessage} Unified message
     */
    fromNative(response) {
        if (!response || !response.choices || !response.choices.length) {
            return UnifiedMessage.assistantText('');
        }

        const choice = response.choices[0];
        const message = choice.message || {};
        const blocks = [];

        // Text content
        if (message.content) {
            blocks.push(textBlock(message.content));
        }

        // Tool calls (OpenAI-compat format from Google)
        if (Array.isArray(message.tool_calls)) {
            for (const tc of message.tool_calls) {
                let input = {};
                try {
                    input = JSON.parse(tc.function.arguments || '{}');
                } catch (_) {
                    input = { _raw: tc.function.arguments };
                }
                blocks.push(toolCallBlock(
                    tc.id || `gtc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    tc.function.name,
                    input
                ));
            }
        }

        if (blocks.length === 0) {
            blocks.push(textBlock(''));
        }

        return new UnifiedMessage('assistant', blocks);
    }

    /**
     * @returns {string} Google AI Studio API base URL
     */
    getBaseUrl() {
        return this._baseUrl;
    }

    /**
     * Build Google AI Studio API request headers.
     * Uses API key as a query parameter (Google convention), but also supports Bearer.
     * @param {string} apiKey - Google AI Studio API key
     * @returns {Object} Headers
     */
    buildHeaders(apiKey) {
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get the full URL with API key as query parameter (Google's preferred auth method).
     * @param {string} apiKey - Google API key
     * @param {string} [model=''] - Model name for URL construction
     * @returns {string} Full URL with key parameter
     */
    getUrlWithKey(apiKey, model = '') {
        return `${this._baseUrl}?key=${apiKey}`;
    }
}

module.exports = { GoogleAdapter };
