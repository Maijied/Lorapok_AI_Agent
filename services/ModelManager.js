/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../lib/logger');

/**
 * Expertise categories definitions.
 */
const CATEGORIES = {
    CODING: { id: 'coding', name: '💻 Coding & Engineering', description: 'Specialized for code generation, debugging, refactoring, and architecture.' },
    REASONING: { id: 'reasoning', name: '🔬 Complex Logic & Reasoning', description: 'Advanced step-by-step reasoning, mathematical & algorithmic analysis.' },
    RESEARCH: { id: 'research', name: '🔍 Web Research & Search', description: 'Live web search, citation lookup, and deep topic research.' },
    FAST: { id: 'fast', name: '⚡ Fast & Lightweight', description: 'High speed, low latency, ideal for quick iterations and minor tasks.' },
    GENERAL: { id: 'general', name: '🌐 General Intelligence', description: 'All-round strong performance across versatile multimodal tasks.' }
};

/**
 * Default Perplexity models categorized by expertise.
 */
const DEFAULT_PERPLEXITY_MODELS = {
    'sonar': { name: '⚡ Sonar (Perplexity)', category: 'fast', provider: 'perplexity', description: 'Fast, lightweight model with web grounding.' },
    'sonar-pro': { name: '🎯 Sonar Pro (Perplexity)', category: 'research', provider: 'perplexity', description: 'Enhanced web search and deep query resolution.' },
    'sonar-reasoning': { name: '🧠 Sonar Reasoning (Perplexity)', category: 'reasoning', provider: 'perplexity', description: 'Reasoning model with real-time web search capabilities.' },
    'sonar-reasoning-pro': { name: '🔬 Sonar Reasoning Pro (Perplexity)', category: 'reasoning', provider: 'perplexity', description: 'Advanced chain-of-thought reasoning with deep web search.' },
    'sonar-deep-research': { name: '🔍 Sonar Deep Research (Perplexity)', category: 'research', provider: 'perplexity', description: 'Exhaustive multi-step research engine for complex domain queries.' }
};

/**
 * Service managing LLM model fetching, caching, and expertise categorization.
 */
class ModelManager {
    /**
     * @param {Object} [config=null] - LorapokConfig instance
     */
    constructor(config = null) {
        this.config = config;
        this.cache = new NodeCache({ stdTTL: 3600 });
        this.openrouterEndpoint = 'https://openrouter.ai/api/v1/models';
    }

    /**
     * Categorize a model into an expertise category based on ID, name, or description.
     * @param {string} modelId - Model ID string
     * @param {string} [name=''] - Display name
     * @param {string} [description=''] - Model description text
     * @returns {'coding'|'reasoning'|'research'|'fast'|'general'} Category ID string
     */
    categorizeModel(modelId, name = '', description = '') {
        const idLower = (modelId || '').toLowerCase();
        const text = `${modelId} ${name} ${description}`.toLowerCase();

        if (idLower.includes('sonar-deep-research') || idLower.includes('sonar-pro') || text.includes('search') || text.includes('web search')) {
            return 'research';
        }
        if (idLower.includes('r1') || idLower.includes('reasoning') || idLower.includes('o1') || idLower.includes('o3') || text.includes('reasoning') || text.includes('thinker')) {
            return 'reasoning';
        }
        if (idLower.includes('coder') || idLower.includes('sonnet') || idLower.includes('codestral') || idLower.includes('deepseek-v3') || idLower.includes('qwen-coder') || idLower.includes('starcoder') || text.includes('code') || text.includes('coding')) {
            return 'coding';
        }
        if (idLower.includes('flash') || idLower.includes('mini') || idLower.includes('haiku') || idLower.includes('sonar') || text.includes('fast') || text.includes('lightweight')) {
            return 'fast';
        }
        return 'general';
    }

    /**
     * Determine dynamic icon emoji based on model vendor, family, or category.
     * @param {string} [modelId=''] - Model ID string
     * @param {string} [name=''] - Model display name
     * @returns {string} Icon emoji string
     */
    getModelIcon(modelId = '', name = '') {
        const text = `${modelId} ${name}`.toLowerCase();

        if (text.includes('claude') || text.includes('anthropic')) return '🎭';
        if (text.includes('gpt') || text.includes('openai') || text.includes('codex') || text.includes('o1') || text.includes('o3')) return '⚡';
        if (text.includes('gemini') || text.includes('google') || text.includes('gemma')) return '✨';
        if (text.includes('deepseek') || text.includes('r1') || text.includes('v3')) return '🧬';
        if (text.includes('llama') || text.includes('meta')) return '🦙';
        if (text.includes('mistral') || text.includes('mixtral') || text.includes('ministral') || text.includes('voxtral')) return '🌪️';
        if (text.includes('sonar') || text.includes('perplexity')) return '🎯';
        if (text.includes('nova') || text.includes('amazon')) return '📦';
        if (text.includes('nvidia') || text.includes('nemotron')) return '🎮';
        if (text.includes('qwen') || text.includes('alibaba')) return '🐉';
        if (text.includes('cohere') || text.includes('command')) return '⚔️';
        if (text.includes('kimi') || text.includes('moonshot')) return '🌙';
        if (text.includes('minimax')) return '🌌';
        if (text.includes('glm') || text.includes('z.ai') || text.includes('z-ai')) return '🔮';
        if (text.includes('relace')) return '🔍';
        if (text.includes('olmo') || text.includes('allenai')) return '🧠';
        if (text.includes('cogito')) return '💡';
        if (text.includes('code') || text.includes('coder')) return '💻';
        if (text.includes('search') || text.includes('research')) return '🔍';

        return '🌐';
    }

    /**
     * Fetch all available LLM models from OpenRouter API & Perplexity defaults.
     * @param {Object} [options={}] - Options (bypassCache: boolean)
     * @returns {Promise<Object>} Dictionary of model metadata objects indexed by ID
     */
    async fetchModels(options = {}) {
        if (!options.bypassCache) {
            const cached = this.cache.get('allModels');
            if (cached) return cached;
        }

        const models = { ...DEFAULT_PERPLEXITY_MODELS };

        try {
            logger.info('ModelManager: Fetching dynamic models from OpenRouter API...');
            const response = await axios.get(this.openrouterEndpoint, { timeout: 8000 });
            if (response.data && Array.isArray(response.data.data)) {
                for (const item of response.data.data) {
                    if (!item.id) continue;
                    const cat = this.categorizeModel(item.id, item.name, item.description);
                    const icon = this.getModelIcon(item.id, item.name);
                    const displayName = item.name || item.id;
                    models[item.id] = {
                        name: `${icon} ${displayName}`,
                        category: cat,
                        icon: icon,
                        provider: 'openrouter',
                        contextLength: item.context_length || null,
                        description: item.description || '',
                        pricing: item.pricing || null
                    };
                }
            }
        } catch (error) {
            logger.error(`ModelManager: Failed to fetch OpenRouter models: ${error.message}`);
        }

        this.cache.set('allModels', models);
        return models;
    }


    /**
     * Retrieve models grouped by expertise categories.
     * @param {Object} [options={}] - Filter options
     * @returns {Promise<Object>} Object mapping category IDs to arrays of model objects
     */
    async getModelsByCategory(options = {}) {
        const allModels = await this.fetchModels(options);
        const grouped = {
            coding: [],
            reasoning: [],
            research: [],
            fast: [],
            general: []
        };

        for (const [id, meta] of Object.entries(allModels)) {
            const cat = meta.category || 'general';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push({ id, ...meta });
        }

        return grouped;
    }

    /**
     * Get curated top recommended models for each expertise domain.
     * @returns {Object} Object mapping domain names to lists of recommended models
     */
    getRecommendedModels() {
        return {
            coding: [
                { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', reason: 'Best-in-class code generation & architecture.' },
                { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', reason: 'State-of-the-art open reasoning & code logic.' },
                { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter', reason: 'Versatile code synthesis & documentation.' }
            ],
            reasoning: [
                { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', reason: 'Deep algorithmic reasoning & problem solving.' },
                { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', provider: 'perplexity', reason: 'Chain-of-thought with live web search.' }
            ],
            research: [
                { id: 'sonar-deep-research', name: 'Sonar Deep Research', provider: 'perplexity', reason: 'Exhaustive multi-source research report generation.' },
                { id: 'sonar-pro', name: 'Sonar Pro', provider: 'perplexity', reason: 'Fast grounded web search with citations.' }
            ],
            fast: [
                { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'openrouter', reason: 'Ultra-low latency for quick code edits.' },
                { id: 'sonar', name: 'Sonar', provider: 'perplexity', reason: 'Lightweight web grounded model.' }
            ]
        };
    }

    /**
     * Return expertise categories definitions.
     * @returns {Object} CATEGORIES metadata object
     */
    getCategories() {
        return CATEGORIES;
    }
}

module.exports = { ModelManager, CATEGORIES, DEFAULT_PERPLEXITY_MODELS };
