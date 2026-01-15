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
                temperature: options.temperature || 0.2, // Lower temperature for stricter persona following
                top_p: options.topP || 0.9,
                return_citations: false
            };

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000,
                signal: options.signal // Support for AbortController
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
                const maskedKey = this.apiKey ? `${this.apiKey.substring(0, 8)}...${this.apiKey.slice(-4)}` : 'EMPTY';
                throw new Error(`Invalid API key. Perplexity rejected the key: ${maskedKey}\nPlease ensure you have credits in your Perplexity account.`);
            }
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                throw new Error('ABORTED');
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

        // Local Identity Intercept for "Who are you?" type questions
        const q = userMessage.trim();

        // Strict Regex Patterns to avoid false positives (e.g. "what is your project path")
        const identityPatterns = [
            /^who\s+(are|is)\s+(you|lorapok)/i,             // "who are you", "who is lorapok"
            /^what\s+(are|is)\s+you/i,                      // "what are you"
            /^what('s|\s+is)\s+your\s+name/i,               // "what is your name"
            /^identify\s+yourself/i,                        // "identify yourself"
            /^tell\s+me\s+about\s+yourself/i,               // "tell me about yourself"
            /^who\s+made\s+you/i,                           // "who made you"
            /^who\s+created\s+you/i,                        // "who created you"
            /^are\s+you\s+(an?|the)?\s*ai/i,                // "are you an ai"
            /^who\s+am\s+i\s+talking\s+to/i,                // "who am i talking to"
            /^(hi|hello|hey|greetings)(\s+lorapok)?/i       // "hi", "hello", "hey lorapok"
        ];

        const isIdentityQuery = identityPatterns.some(pattern => pattern.test(q));

        if (isIdentityQuery) { // Always intercept potential identity queries
            const intro = `I'm 🐛 Lorapok, your expert AI coding agent. I'm specialized in advanced project management using Node.js, Docker, and Git. 

I can help you with:
- 📝 **Planning & Architecture**: Detailed technical implementation plans.
- 📁 **Proactive File Ops**: Creating, updating, and deleting files with your permission.
- 🧬 **Project Analysis**: Understanding your entire codebase and dependencies.
- 🔗 **Git Automation**: Smart commits and workflow management.
- 🐳 **Isolated Execution**: Running everything safely inside a Docker environment.

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
When you want to modify files or run commands, you MUST use the following syntax:

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

Project Context:
${projectContext}
Language: ${context.language || this.config.getLanguage()}
Framework: ${context.framework || 'General'}
Task: ${context.task || 'General coding assistance'}

Interaction Rules:
1. Always introduce yourself as Lorapok if asked who you are.
2. Provide direct, high-quality code solutions without preamble if it's a code task.
3. Use your file and git management knowledge to provide accurate advice.
4. Strictly avoid numerical citations like [1], [2].
5. ALWAYS maintain the 🐛 Lorapok persona.`;

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
            // Rollback: Remove the user message if the API call fails or is aborted.
            // This prevents the "alternating roles" error on the next attempt.
            this.conversationHistory.pop();
            throw error;
        }
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
