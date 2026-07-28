/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Proprietary & Confidential. All Rights Reserved.
 */
'use strict';

const axios = require('axios');
const NodeCache = require('node-cache');
const LorapokHistory = require('./history');
const { LorapokConfig } = require('./config');
const logger = require('./logger');

const LorapokCache = require('./cache');

const MODELS = {
    'sonar': { name: '⚡ Sonar', tier: 'free' },
    'sonar-pro': { name: '🎯 Sonar Pro', tier: 'pro' },
    'sonar-reasoning': { name: '🧠 Sonar Reasoning', tier: 'pro' },
    'sonar-reasoning-pro': { name: '🔬 Sonar Reasoning Pro', tier: 'pro' },
    'sonar-deep-research': { name: '🔍 Sonar Deep Research', tier: 'pro' }
};

/**
 * Base coding agent interfacing with Perplexity AI API.
 */
class LorapokCodingAgent {
    /**
     * @param {string} apiKey - Perplexity API Key
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.perplexity.ai/chat/completions';
        this.conversationHistory = [];
        this.config = new LorapokConfig();
        this.history = new LorapokHistory(this.config);
        this.responseCache = new LorapokCache({ enabled: this.config.getCacheEnabled() });
        this.availableModels = null;
        this.cache = new NodeCache({ stdTTL: 3600 });
    }


    /**
     * Validate active API key presence.
     * @throws {Error} If API key is missing or empty
     * @returns {void}
     */
    validateApiKey() {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('API key is required. Get one from https://www.perplexity.ai/api-platform');
        }
    }

    /**
     * Check which models are available for the current API key by probing them.
     * @returns {Promise<Object>} Object mapping model IDs to model availability metadata
     */
    async checkAvailableModels() {
        this.validateApiKey();

        const cachedResults = this.cache.get('availableModels');
        if (cachedResults) {
            logger.info('Using cached model availability');
            this.availableModels = cachedResults;
            return cachedResults;
        }

        logger.info('Probing model availability...');
        const results = {};
        const modelsToProbe = Object.keys(MODELS);

        for (const modelId of modelsToProbe) {
            try {
                const payload = {
                    model: modelId,
                    messages: [{ role: 'user', content: 'hi' }],
                    max_tokens: 1
                };

                await axios.post(this.baseUrl, payload, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });

                results[modelId] = { ...MODELS[modelId], available: true };
            } catch (error) {
                results[modelId] = { ...MODELS[modelId], available: false };
            }
        }

        this.availableModels = results;
        this.cache.set('availableModels', results);
        return results;
    }

    /**
     * Execute raw API call to Perplexity API.
     * @param {Array<Object>} messages - Messages array for chat completion
     * @param {string} model - Target model ID
     * @param {Object} [options={}] - Options (maxTokens, temperature, topP, signal)
     * @returns {Promise<{ success: boolean, content: string, citations: Array<any>, model: string }>} API response payload
     * @throws {Error} If API call fails or is aborted
     */
    async callPerplexityAPI(messages, model, options = {}) {
        this.validateApiKey();
        const mappedModel = this.mapModelName(model);

        const cacheKey = this.responseCache.generateKey(messages, mappedModel, options.temperature || 0.2);
        if (!options.bypassCache && this.config.getCacheEnabled()) {
            const cachedResult = this.responseCache.get(cacheKey);
            if (cachedResult) {
                logger.info(`Returning cached response for model ${mappedModel}`);
                return cachedResult;
            }
        }

        logger.info(`Calling Perplexity API with model: ${mappedModel}`);

        try {
            const payload = {
                model: mappedModel,
                messages,
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.2,
                top_p: options.topP || 0.9,
                return_citations: false
            };

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000,
                signal: options.signal
            });

            logger.info('API call successful');

            const resultPayload = {
                success: true,
                content: response.data.choices[0].message.content.replace(/\[\d+\]/g, '').trim(),
                citations: [],
                model: model,
                usage: response.data.usage || null
            };

            this.responseCache.set(cacheKey, resultPayload);
            return resultPayload;
        } catch (error) {

            const status = error.response?.status;
            const message = error.response?.data?.error?.message || error.message;

            logger.error(`API call failed: ${status} - ${message}`);

            if (status === 401) {
                const maskedKey = this.apiKey ? `${this.apiKey.substring(0, 8)}...${this.apiKey.slice(-4)}` : 'EMPTY';
                throw new Error(`Invalid API key. Perplexity rejected the key: ${maskedKey}\nPlease ensure you have credits in your Perplexity account.`);
            }
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                throw new Error('ABORTED');
            }
            throw new Error(message);
        }
    }

    /**
     * Map model alias to canonical API model name.
     * @param {string} model - Input model name
     * @returns {string} Mapped API model name
     */
    mapModelName(model) {
        return model;
    }

    /**
     * Send user chat message and receive AI response with history management.
     * @param {string} userMessage - Message prompt string
     * @param {string|null} [model=null] - Optional target model override
     * @param {Object} [context={}] - Context metadata options
     * @returns {Promise<{ success: boolean, content: string, citations?: Array<any>, model?: string }>} Chat response object
     */
    async chat(userMessage, model = null, context = {}) {
        model = model || this.config.getModel();

        const q = userMessage.trim();
        const identityPatterns = [
            /^who\s+(are|is)\s+(you|lorapok)/i,
            /^what\s+(are|is)\s+you/i,
            /^what('s|\s+is)\s+your\s+name/i,
            /^identify\s+yourself/i,
            /^tell\s+me\s+about\s+yourself/i,
            /^who\s+made\s+you/i,
            /^who\s+created\s+you/i,
            /^are\s+you\s+(an?|the)?\s*ai/i,
            /^who\s+am\s+i\s+talking\s+to/i,
            /^(hi|hello|hey|greetings)(\s+lorapok)?/i
        ];

        const isIdentityQuery = identityPatterns.some(pattern => pattern.test(q));

        if (isIdentityQuery) {
            const intro = `I'm 🐛 Lorapok, your expert AI coding agent. I'm specialized in advanced project management and full-stack development across **all programming languages**.

I can help you with:
- 📝 **Planning & Architecture**: Detailed technical implementation plans for any stack.
- 📁 **Proactive File Ops**: Creating, updating, and deleting files with your permission.
- 💻 **Bash Command Execution**: Running shell toolchains (Docker, Git, Node, etc.) directly.
- 🧬 **Project Analysis**: Understanding your entire codebase and dependencies.
- 🐳 **Isolated Execution**: Running everything safely inside a persistent Docker environment.

How can I assist you today?`;
            this.conversationHistory.push({ role: 'user', content: userMessage });
            this.conversationHistory.push({ role: 'assistant', content: intro });
            return { success: true, content: intro, model: model };
        }

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const projectContext = context.fileTree ? `Current Project Structure:\n${context.fileTree}\n` : '';

        const systemPrompt = `Identity: You are the 🐛 Lorapok coding agent, a highly specialized expert AI assistant. 

Your Persona:
- Name: Lorapok
- Status: v1.0.0 Expert Coding Agent
- Traits: Professional, direct, action-oriented, and project-aware.
- Expertise: Node.js, Docker, Git, and automated implementation using your action-parsing engine.

Identity Rule: NEVER identify as Perplexity, Claude, or any generic AI. You are a standalone product called Lorapok.

Proactive Actions:
When you want to modify files or run commands, you MUST use the following syntax exactly. Do NOT use markdown bold stars (**) in these action headers:

1. Create/Update File:
ACTION: CREATE FILE: path/to/file
\`\`\`language
code here
\`\`\`

2. Delete File:
ACTION: DELETE FILE: path/to/file

3. Run Bash Command:
ACTION: RUN COMMAND: description of what the command does
\`\`\`bash
command here
\`\`\`

IMPORTANT: Only use one space after colons and keep paths/descriptions clean.

Project Context:
${projectContext}
Language: ${context.language || this.config.getLanguage()}
Framework: ${context.framework || 'General'}
Task: ${context.task || 'General coding assistance'}

Interaction Rules:
1. Always introduce yourself as Lorapok if asked who you are.
2. Provide direct, high-quality code solutions without preamble if it's a code task.
3. Use your file and git management knowledge to provide accurate advice.
4. Strictly avoid ALL numerical citations like [1], [2], [3], etc. 
5. NEVER include a "Citations" or "Sources" section at the end of your response.
6. ALWAYS maintain the 🐛 Lorapok persona.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory
        ];

        try {
            const response = await this.callPerplexityAPI(messages, model, context);

            if (response.success) {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: response.content
                });
                this.history.add('chat', userMessage, response.content, model);
            }

            return response;
        } catch (error) {
            this.conversationHistory.pop();
            throw error;
        }
    }

    /**
     * Generate code snippet based on requirements description.
     * @param {string} requirements - Target code specification
     * @param {string|null} [language=null] - Target language override
     * @param {string} [framework=''] - Framework override
     * @returns {Promise<Object>} Chat response object
     */
    async generateCode(requirements, language = null, framework = '') {
        language = language || this.config.getLanguage();
        const prompt = `Generate production-ready ${language} code for: ${requirements}${framework ? ` using ${framework}` : ''}

Requirements:
- Clean, well-structured code
- Include comments
- Error handling
- Type hints if applicable`;

        return this.chat(prompt, null, { language, framework, task: 'generate' });
    }

    /**
     * Analyze code for quality, performance, and security issues.
     * @param {string} code - Source code snippet
     * @param {string|null} [language=null] - Language identifier
     * @returns {Promise<Object>} Analysis response object
     */
    async analyzeCode(code, language = null) {
        language = language || this.config.getLanguage();
        const prompt = `Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide insights on:
1. Code quality
2. Performance
3. Security concerns
4. Best practices
5. Refactoring suggestions`;

        return this.chat(prompt, null, { language, task: 'analyze' });
    }

    /**
     * Debug given code and error output.
     * @param {string} code - Source code snippet
     * @param {string} error - Error message or stack trace
     * @param {string|null} [language=null] - Language identifier
     * @returns {Promise<Object>} Debug response object
     */
    async debugCode(code, error, language = null) {
        language = language || this.config.getLanguage();
        const prompt = `Debug this ${language} code:

Code:
\`\`\`${language}
${code}
\`\`\`

Error:
${error}

Please:
1. Identify root cause
2. Explain why
3. Provide fix
4. Show corrected code`;

        return this.chat(prompt, null, { language, task: 'debug' });
    }

    /**
     * Clear in-memory conversation history buffer.
     * @returns {void}
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Get active in-memory conversation history.
     * @returns {Array<Object>} History array
     */
    getHistory() {
        return this.conversationHistory;
    }

    /**
     * Get available model definitions catalog object.
     * @returns {Object} MODELS dictionary
     */
    getModels() {
        return MODELS;
    }
}

module.exports = { LorapokCodingAgent, MODELS };
