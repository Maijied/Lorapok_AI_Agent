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
const { ModelManager } = require('../services/ModelManager');

const MODELS = {
    'sonar': { name: '⚡ Sonar (Perplexity)', tier: 'free', provider: 'perplexity' },
    'sonar-pro': { name: '🎯 Sonar Pro (Perplexity)', tier: 'pro', provider: 'perplexity' },
    'sonar-reasoning': { name: '🧠 Sonar Reasoning (Perplexity)', tier: 'pro', provider: 'perplexity' },
    'sonar-reasoning-pro': { name: '🔬 Sonar Reasoning Pro (Perplexity)', tier: 'pro', provider: 'perplexity' },
    'sonar-deep-research': { name: '🔍 Sonar Deep Research (Perplexity)', tier: 'pro', provider: 'perplexity' },
    'openrouter/auto': { name: '🤖 OpenRouter Auto', tier: 'pro', provider: 'openrouter' },
    'anthropic/claude-3.5-sonnet': { name: '🎭 Claude 3.5 Sonnet (OpenRouter)', tier: 'pro', provider: 'openrouter' },
    'openai/gpt-4o': { name: '⚡ GPT-4o (OpenRouter)', tier: 'pro', provider: 'openrouter' },
    'deepseek/deepseek-r1': { name: '🧬 DeepSeek R1 (OpenRouter)', tier: 'pro', provider: 'openrouter' },
    'meta-llama/llama-3.3-70b-instruct': { name: '🦙 Llama 3.3 70B (OpenRouter)', tier: 'pro', provider: 'openrouter' },
    'google/gemini-2.0-flash-001': { name: '✨ Gemini 2.0 Flash (OpenRouter)', tier: 'pro', provider: 'openrouter' },
    'gemini-3.6-flash': { name: '⚡ Gemini 3.6 Flash (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-3.5-flash-lite': { name: '🚀 Gemini 3.5 Flash-Lite (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-3.5-flash': { name: '⚡ Gemini 3.5 Flash (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-3.1-flash-lite': { name: '🚀 Gemini 3.1 Flash-Lite (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-3-pro-preview': { name: '✨ Gemini 3 Pro Preview (Google AI Studio)', tier: 'pro', provider: 'google-ai-studio' },
    'gemini-3-flash-preview': { name: '⚡ Gemini 3 Flash Preview (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-2.5-pro': { name: '✨ Gemini 2.5 Pro (Google AI Studio)', tier: 'pro', provider: 'google-ai-studio' },
    'gemini-2.5-flash-lite': { name: '🚀 Gemini 2.5 Flash-Lite (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-2.0-flash': { name: '⚡ Gemini 2.0 Flash (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemini-2.0-flash-lite': { name: '🚀 Gemini 2.0 Flash-Lite (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemma-4-31b-it': { name: '🦙 Gemma 4 31B IT (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'gemma-4-26b-a4b-it': { name: '🦙 Gemma 4 26B IT (Google AI Studio)', tier: 'free', provider: 'google-ai-studio' },
    'antigravity-preview-05-2026': { name: '🧠 Antigravity Agent Preview (Google AI Studio)', tier: 'pro', provider: 'google-ai-studio' },
    'deep-research-max-preview-04-2026': { name: '🔍 Deep Research Max Preview (Google AI Studio)', tier: 'pro', provider: 'google-ai-studio' }
};

/**
 * Base coding agent interfacing with Perplexity AI and OpenRouter APIs.
 */
class LorapokCodingAgent {
    /**
     * @param {string} [apiKey] - API Key (Perplexity or OpenRouter)
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.perplexityBaseUrl = 'https://api.perplexity.ai/chat/completions';
        this.openrouterBaseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.googleBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        this.baseUrl = this.perplexityBaseUrl;
        this.conversationHistory = [];
        this.config = new LorapokConfig();
        this.history = new LorapokHistory(this.config);
        this.responseCache = new LorapokCache({ enabled: this.config.getCacheEnabled() });
        this.modelManager = new ModelManager(this.config);
        this.availableModels = null;
        this.cache = new NodeCache({ stdTTL: 3600 });
    }


    /**
     * Determine provider for a given model ID or string.
     * @param {string} [model] - Model ID
     * @returns {'openrouter'|'perplexity'} Provider type string
     */
    getProviderForModel(model) {
        if (!model) return 'perplexity';
        if (MODELS[model]?.provider) return MODELS[model].provider;
        if (this.availableModels && this.availableModels[model]?.provider) {
            return this.availableModels[model].provider;
        }
        if (
            model.startsWith('gemini-') || 
            model.startsWith('models/gemini-') || 
            model.startsWith('google-ai-studio/') ||
            model.startsWith('gemma-') ||
            model.startsWith('nano-banana') ||
            model.startsWith('antigravity-') ||
            model.startsWith('deep-research-')
        ) {
            return 'google-ai-studio';
        }
        if (
            model.startsWith('openrouter/') ||
            model.startsWith('anthropic/') ||
            model.startsWith('openai/') ||
            model.startsWith('deepseek/') ||
            model.startsWith('meta-llama/') ||
            model.startsWith('google/')
        ) {
            return 'openrouter';
        }
        return 'perplexity';
    }

    /**
     * Get appropriate API Key for target model/provider.
     * @param {string} [model] - Model ID
     * @returns {string|null} Resolved API Key
     */
    getApiKeyForModel(model) {
        const provider = this.getProviderForModel(model);
        if (provider === 'google-ai-studio') {
            return this.config.getGoogleApiKey();
        }
        if (provider === 'openrouter') {
            return this.config.getOpenRouterApiKey();
        }
        return this.apiKey || this.config.getPerplexityApiKey();
    }

    /**
     * Validate active API key presence for specific provider.
     * @param {string} [provider='perplexity'] - Target provider
     * @throws {Error} If API key is missing or empty
     * @returns {string} Key string
     */
    validateApiKey(provider = 'perplexity') {
        let key = null;
        if (provider === 'google-ai-studio') {
            key = this.config.getGoogleApiKey();
            if (!key || key.trim() === '') {
                throw new Error('Google AI Studio API key is required. Get one from https://aistudio.google.com/app/apikey');
            }
        } else if (provider === 'openrouter') {
            key = this.config.getOpenRouterApiKey();
            if (!key || key.trim() === '') {
                throw new Error('OpenRouter API key is required. Get one from https://openrouter.ai/keys');
            }
        } else {
            key = this.apiKey || this.config.getPerplexityApiKey();
            if (!key || key.trim() === '') {
                throw new Error('Perplexity API key is required. Get one from https://www.perplexity.ai/settings/api');
            }
        }
        return key;
    }

    /**
     * Dynamically fetch available models directly from OpenRouter API endpoint.
     * @returns {Promise<Object|null>} Dictionary of models fetched from OpenRouter API or null on error
     */
    async fetchDynamicOpenRouterModels() {
        try {
            logger.info('Fetching dynamic models from OpenRouter API...');
            const response = await axios.get('https://openrouter.ai/api/v1/models', { timeout: 8000 });
            if (response.data && Array.isArray(response.data.data)) {
                const dynamicModels = {};
                for (const item of response.data.data) {
                    if (item.id) {
                        dynamicModels[item.id] = {
                            name: item.name ? `🌐 ${item.name}` : `🌐 ${item.id}`,
                            tier: 'pro',
                            provider: 'openrouter',
                            contextLength: item.context_length || null,
                            pricing: item.pricing || null
                        };
                    }
                }
                logger.info(`Successfully loaded ${Object.keys(dynamicModels).length} dynamic models from OpenRouter`);
                return dynamicModels;
            }
        } catch (error) {
            logger.error(`Failed to fetch dynamic models from OpenRouter API: ${error.message}`);
        }
        return null;
    }

    /**
     * Check which models are available for configured API keys by dynamically fetching & probing them.
     * @returns {Promise<Object>} Object mapping model IDs to model availability metadata
     */
    async checkAvailableModels() {
        const cachedResults = this.cache.get('availableModels');
        if (cachedResults) {
            logger.info('Using cached model availability');
            this.availableModels = cachedResults;
            return cachedResults;
        }

        logger.info('Probing model availability with ModelValidator Service...');
        const rawModels = await this.modelManager.fetchModels();

        const googleKey = this.config.getGoogleApiKey();
        const openRouterKey = this.config.getOpenRouterApiKey();
        const perplexityKey = this.apiKey || this.config.getPerplexityApiKey();

        // Probe Perplexity availability if key present
        if (perplexityKey) {
            for (const modelId of Object.keys(rawModels)) {
                if (rawModels[modelId]?.provider === 'perplexity') {
                    try {
                        const payload = {
                            model: modelId,
                            messages: [{ role: 'user', content: 'hi' }],
                            max_tokens: 1
                        };
                        await axios.post(this.perplexityBaseUrl, payload, {
                            headers: {
                                'Authorization': `Bearer ${perplexityKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 3000
                        });
                        rawModels[modelId].available = true;
                    } catch (e) {
                        rawModels[modelId].available = false;
                    }
                }
            }
        }

        // Apply Model Validator Middleware to filter out un-usable models
        const validatedModels = this.modelManager.validateUsableModels(rawModels, {
            googleKey,
            openRouterKey,
            perplexityKey
        });

        this.availableModels = validatedModels;
        this.cache.set('availableModels', validatedModels);
        return validatedModels;
    }

    /**
     * Execute raw API call to LLM Provider API (Perplexity or OpenRouter).
     * @param {Array<Object>} messages - Messages array for chat completion
     * @param {string} model - Target model ID
     * @param {Object} [options={}] - Options (maxTokens, temperature, topP, signal)
     * @returns {Promise<{ success: boolean, content: string, citations: Array<any>, model: string }>} API response payload
     * @throws {Error} If API call fails or is aborted
     */
    async callPerplexityAPI(messages, model, options = {}) {
        const provider = this.getProviderForModel(model);
        const apiKey = this.validateApiKey(provider);
        const mappedModel = this.mapModelName(model);

        const cacheKey = this.responseCache.generateKey(messages, mappedModel, options.temperature || 0.2);
        if (!options.bypassCache && this.config.getCacheEnabled()) {
            const cachedResult = this.responseCache.get(cacheKey);
            if (cachedResult) {
                logger.info(`Returning cached response for model ${mappedModel}`);
                return cachedResult;
            }
        }

        const isGoogle = provider === 'google-ai-studio';
        const isOpenRouter = provider === 'openrouter';
        const isPerplexity = provider === 'perplexity';
        let targetUrl = this.perplexityBaseUrl;
        if (isGoogle) {
            targetUrl = this.googleBaseUrl;
        } else if (isOpenRouter) {
            targetUrl = this.openrouterBaseUrl;
        }

        logger.info(`Calling ${provider.toUpperCase()} API with model: ${mappedModel}`);

        try {
            const payload = {
                model: mappedModel,
                messages,
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.2,
                top_p: options.topP || 0.9
            };

            if (!isOpenRouter && !isGoogle) {
                payload.return_citations = false;
            }

            const headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };

            if (isOpenRouter) {
                headers['HTTP-Referer'] = 'https://lorapok.tech';
                headers['X-Title'] = 'Lorapok AI Agent';
            }

            const response = await axios.post(targetUrl, payload, {
                headers,
                timeout: 60000,
                signal: options.signal
            });

            logger.info('API call successful');

            const contentText = response.data?.choices?.[0]?.message?.content || '';
            const resultPayload = {
                success: true,
                content: contentText.replace(/\[\d+\]/g, '').trim(),
                citations: [],
                model: model,
                usage: response.data.usage || null
            };

            this.responseCache.set(cacheKey, resultPayload);
            return resultPayload;
        } catch (error) {

            const status = error.response?.status;
            const responseData = error.response?.data;
            let message = null;

            if (Array.isArray(responseData) && responseData[0]?.error?.message) {
                message = responseData[0].error.message;
            } else if (responseData?.error?.message) {
                message = responseData.error.message;
            } else if (typeof responseData === 'string' && responseData.trim()) {
                message = responseData;
            } else {
                message = error.message;
            }

            logger.error(`API call failed: ${status} - ${message}`);

            if (status === 401) {
                const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'EMPTY';
                let provName = 'Perplexity (https://www.perplexity.ai/settings/api)';
                if (isGoogle) provName = 'Google AI Studio (https://aistudio.google.com/app/apikey)';
                if (isOpenRouter) provName = 'OpenRouter (https://openrouter.ai/keys)';
                throw new Error(`Invalid API key. ${provName} rejected the key: ${maskedKey}\nPlease ensure your API key is valid and has sufficient credits.`);
            }
            if ((status === 429 || status === 404) && !options.isFallbackAttempt) {
                let fallbackModel = 'gemini-3.6-flash';
                if (isOpenRouter) fallbackModel = 'deepseek/deepseek-r1';
                if (isPerplexity) fallbackModel = 'sonar';

                if (fallbackModel !== mappedModel) {
                    logger.warn(`API call failed for '${mappedModel}' (${status}). Automatically routing fallback to '${fallbackModel}'...`);
                    console.log(chalk.yellow(`\n⚠️ Model '${mappedModel}' ${status === 429 ? 'quota exceeded / rate limited' : 'unavailable'} (${status}).`));
                    console.log(chalk.cyan(`🔄 Automatically routing request to fallback model: '${fallbackModel}'...\n`));

                    if (this.config && typeof this.config.setModel === 'function') {
                        this.config.setModel(fallbackModel);
                    }

                    return await this.callPerplexityAPI(messages, fallbackModel, { ...options, isFallbackAttempt: true });
                }
            }

            if (status === 429) {
                const headers = error.response?.headers || {};
                const retryHeader = headers['retry-after'] || headers['x-ratelimit-reset'] || headers['x-ratelimit-reset-requests'] || headers['x-ratelimit-reset-tokens'];
                let retryNotice = '';
                if (retryHeader) {
                    const secs = parseInt(retryHeader, 10);
                    retryNotice = !isNaN(secs) ? ` [Retry in ${secs}s]` : ` [Retry: ${retryHeader}]`;
                }

                let provName = 'Perplexity';
                let resetInfo = ' (Rate limits reset per minute)';
                if (isGoogle) {
                    provName = 'Google AI Studio';
                    resetInfo = ' (Quotas reset every 1m for RPM or 00:00 UTC for RPD)';
                } else if (isOpenRouter) {
                    provName = 'OpenRouter';
                    resetInfo = ' (Free models reset every 1m/24h)';
                }

                throw new Error(`${provName} API Rate Limit / Quota Exceeded (${status})${retryNotice}: ${message}\n💡 Tip:${resetInfo}. Switch model with /model or wait briefly.`);
            }
            if (status === 404) {
                throw new Error(`Model '${mappedModel}' Unavailable (${status}): ${message}`);
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
