const axios = require('axios');
const LorapokHistory = require('./history');
const { LorapokConfig } = require('./config');

const MODELS = {
    'sonar-small': { name: '🚀 Sonar Small', tier: 'free' },
    'sonar': { name: '⚡ Sonar', tier: 'free' },
    'sonar-pro': { name: '🎯 Sonar Pro', tier: 'free' },
    'claude-3-5-sonnet': { name: '✨ Claude 3.5 Sonnet', tier: 'pro' },
    'gemini-3-flash': { name: '⚡ Gemini 3 Flash', tier: 'pro' },
    'gemini-3-pro': { name: '🧠 Gemini 3 Pro', tier: 'pro' },
    'gpt-4o': { name: '🤖 GPT-4o', tier: 'pro' },
    'gpt-4-turbo': { name: '⚙️ GPT-4 Turbo', tier: 'pro' },
    'claude-opus-4-5': { name: '👑 Claude Opus 4.5', tier: 'pro' },
    'grok-4-1': { name: '🔮 Grok 4.1', tier: 'pro' },
    'kimi-k2-thinking': { name: '💭 Kimi K2 Thinking', tier: 'pro' }
};

class LorapokCodingAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.perplexity.ai/chat/completions';
        this.conversationHistory = [];
        this.config = new LorapokConfig();
        this.history = new LorapokHistory();
    }

    validateApiKey() {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('API key is required. Get one from https://www.perplexity.ai/api-platform');
        }
    }

    async callPerplexityAPI(messages, model, options = {}) {
        this.validateApiKey();

        try {
            const payload = {
                model: this.mapModelName(model),
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

            return {
                success: true,
                content: response.data.choices[0].message.content,
                citations: response.data.citations || [],
                model: model
            };
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('❌ Invalid API key. Check your PERPLEXITY_API_KEY');
            }
            throw new Error(error.response?.data?.error?.message || error.message);
        }
    }

    mapModelName(model) {
        const mapping = {
            'sonar-small': 'sonar-small-online',
            'sonar': 'sonar-online',
            'sonar-pro': 'sonar-pro-online'
        };
        return mapping[model] || model;
    }

    async chat(userMessage, model = null, context = {}) {
        model = model || this.config.getModel();

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const systemPrompt = `You are Lorapok, an expert AI coding assistant.
Language: ${context.language || this.config.getLanguage()}
Framework: ${context.framework || 'General'}
Task: ${context.task || 'General coding assistance'}

Provide clear, concise code examples with explanations.`;

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
