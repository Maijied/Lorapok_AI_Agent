/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * OpenRouterAdapter — translates UnifiedMessage ↔ OpenRouter (OpenAI-compatible) format.
 * OpenRouter supports function_call / tool_use in the OpenAI style.
 */
'use strict';

const { BaseAdapter } = require('./BaseAdapter');
const { UnifiedMessage, textBlock, toolCallBlock, toolResultBlock } = require('../../lib/core/UnifiedMessage');

/**
 * Adapter for the OpenRouter API (OpenAI-compatible format).
 * Supports tool calling via the OpenAI function_call / tools mechanism.
 */
class OpenRouterAdapter extends BaseAdapter {
    constructor() {
        super({
            name: 'openrouter',
            capabilities: {
                toolUse: true,
                streaming: true,
                contextWindow: 128000,
                vision: true
            }
        });
        this._baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    /**
     * Convert UnifiedMessage array to OpenRouter (OpenAI-compatible) request body.
     * @param {UnifiedMessage[]} messages - Unified messages
     * @param {import('../../lib/core/ToolSpec').ToolSpec[]} [tools=[]] - Available tools
     * @returns {Object} OpenRouter-compatible request body
     */
    toNative(messages, tools = []) {
        const nativeMessages = [];

        for (const msg of messages) {
            if (msg.role === 'tool') {
                // Tool results become role:"tool" messages in OpenAI format
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
                // Assistant with tool calls → OpenAI tool_calls format
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

            // Standard text messages
            nativeMessages.push({
                role: msg.role,
                content: msg.getText() || ''
            });
        }

        const result = { messages: nativeMessages };

        // Add tools if provided
        if (tools.length > 0) {
            result.tools = tools.map(t => ({
                type: 'function',
                function: t.toProviderSchema('openrouter')
            }));
        }

        return result;
    }

    /**
     * Convert OpenRouter API response to UnifiedMessage.
     * @param {Object} response - OpenRouter API response
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

        // Tool calls (OpenAI format)
        if (Array.isArray(message.tool_calls)) {
            for (const tc of message.tool_calls) {
                let input = {};
                try {
                    input = JSON.parse(tc.function.arguments || '{}');
                } catch (_) {
                    input = { _raw: tc.function.arguments };
                }
                blocks.push(toolCallBlock(
                    tc.id,
                    tc.function.name,
                    input
                ));
            }
        }

        // Legacy function_call fallback
        if (!message.tool_calls && message.function_call) {
            let input = {};
            try {
                input = JSON.parse(message.function_call.arguments || '{}');
            } catch (_) {
                input = { _raw: message.function_call.arguments };
            }
            const callId = `fc_${Date.now()}`;
            blocks.push(toolCallBlock(callId, message.function_call.name, input));
        }

        if (blocks.length === 0) {
            blocks.push(textBlock(''));
        }

        return new UnifiedMessage('assistant', blocks);
    }

    /**
     * @returns {string} OpenRouter API base URL
     */
    getBaseUrl() {
        return this._baseUrl;
    }

    /**
     * Build OpenRouter API request headers.
     * @param {string} apiKey - OpenRouter API key
     * @returns {Object} Headers
     */
    buildHeaders(apiKey) {
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lorapok.tech',
            'X-Title': 'Lorapok AI Agent'
        };
    }
}

module.exports = { OpenRouterAdapter };
