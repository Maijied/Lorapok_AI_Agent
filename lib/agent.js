const axios = require('axios');
const NodeCache = require('node-cache');
const LorapokHistory = require('./history');
const { LorapokConfig } = require('./config');
const logger = require('./logger');

const MODELS = {
    'sonar': { name: '⚡ Sonar', tier: 'free' },
    'sonar-pro': { name: '🎯 Sonar Pro', tier: 'pro' },
    'sonar-reasoning': { name: '🧠 Sonar Reasoning', tier: 'pro' },
    'sonar-reasoning-pro': { name: '🔬 Sonar Reasoning Pro', tier: 'pro' },
    'sonar-deep-research': { name: '🔍 Sonar Deep Research', tier: 'pro' }
};

class LorapokCodingAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.perplexity.ai/chat/completions';
        this.conversationHistory = [];
        this.config = new LorapokConfig();
        this.history = new LorapokHistory(this.config);
        this.availableModels = null;
        this.cache = new NodeCache({ stdTTL: 3600 }); // Cache model results for 1 hour
    }

    validateApiKey() {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('API key is required. Get one from https://www.perplexity.ai/api-platform');
        }
    }

    /**
     * Checks which models are available for the current API key by probing them.
     * Perplexity doesn't provide a /models endpoint, so we test connectivity.
     */
    async checkAvailableModels() {
        this.validateApiKey();

        // Check cache first
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
                // Minimal request to probe access
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
                    timeout: 5000 // Fast timeout for probing
                });

                results[modelId] = { ...MODELS[modelId], available: true };
            } catch (error) {
                // If 401/403/404, it's likely not available or key is invalid
                results[modelId] = { ...MODELS[modelId], available: false };
            }
        }

        this.availableModels = results;
        this.cache.set('availableModels', results);
        return results;
    }

    async callPerplexityAPI(messages, model, options = {}) {
        this.validateApiKey();
        const mappedModel = this.mapModelName(model);

        logger.info(`Calling Perplexity API with model: ${mappedModel}`);

        try {
            const payload = {
                model: mappedModel,
                messages,
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7,
                top_p: options.topP || 0.9,
                return_citations: true
            };

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });

            logger.info('API call successful');

            return {
                success: true,
                content: response.data.choices[0].message.content,
                citations: response.data.citations || [],
                model: model
            };
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.error?.message || error.message;

            logger.error(`API call failed: ${status} - ${message}`);

            if (status === 401) {
                throw new Error('❌ Invalid API key. Check your PERPLEXITY_API_KEY');
            }
            throw new Error(message);
        }
    }

    mapModelName(model) {
        // Model IDs now match Perplexity's current API (sonar, sonar-pro, etc.)
        return model;
    }

    async chat(userMessage, model = null, context = {}) {
        model = model || this.config.getModel();

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const projectContext = context.fileTree ? `Current Project Structure:\n${context.fileTree}\n` : '';

        const systemPrompt = `You are Lorapok, an expert AI coding assistant.
${projectContext}
Language: ${context.language || this.config.getLanguage()}
Framework: ${context.framework || 'General'}
Task: ${context.task || 'General coding assistance'}

Provide clear, concise code examples with explanations. You are aware of all files in the project.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory
        ];

        const response = await this.callPerplexityAPI(messages, model);

        if (response.success) {
            this.conversationHistory.push({
                role: 'assistant',
                content: response.content
            });
            this.history.add('chat', userMessage, response.content, model);
        }

        return response;
    }

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

    clearHistory() {
        this.conversationHistory = [];
    }

    getHistory() {
        return this.conversationHistory;
    }

    getModels() {
        return MODELS;
    }
}

module.exports = { LorapokCodingAgent, MODELS };
