/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const { ModelManager, CATEGORIES, DEFAULT_GOOGLE_MODELS, DEFAULT_OPENROUTER_MODELS } = require('../services/ModelManager');
const axios = require('axios');

jest.mock('axios');

describe('ModelManager Service', () => {
    let modelManager;

    beforeEach(() => {
        jest.clearAllMocks();
        modelManager = new ModelManager();
    });

    test('should resolve dynamic model icons by vendor or family', () => {
        expect(modelManager.getModelIcon('anthropic/claude-3.5-sonnet')).toBe('🎭');
        expect(modelManager.getModelIcon('openai/gpt-4o')).toBe('⚡');
        expect(modelManager.getModelIcon('google/gemini-2.0-flash')).toBe('⚡');
        expect(modelManager.getModelIcon('google/gemini-2.5-pro')).toBe('💎');
        expect(modelManager.getModelIcon('deepseek/deepseek-r1')).toBe('🧬');
        expect(modelManager.getModelIcon('meta-llama/llama-3.3-70b')).toBe('🦙');
        expect(modelManager.getModelIcon('mistralai/ministral-3b')).toBe('🌪️');
        expect(modelManager.getModelIcon('amazon/nova-lite')).toBe('📦');
        expect(modelManager.getModelIcon('nvidia/nemotron-nano')).toBe('🎮');
        expect(modelManager.getModelIcon('moonshotai/kimi-k2')).toBe('🌙');
        expect(modelManager.getModelIcon('minimax/minimax-m2')).toBe('🌌');
        expect(modelManager.getModelIcon('z-ai/glm-4.6v')).toBe('🔮');
    });

    test('DEFAULT_GOOGLE_MODELS should only contain real verified model IDs', () => {
        // Real models that MUST exist
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.5-flash']).toBeDefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.5-pro']).toBeDefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.0-flash']).toBeDefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.0-flash-lite']).toBeDefined();
        expect(DEFAULT_GOOGLE_MODELS['learnlm-1.5-pro-experimental']).toBeDefined();

        // Fake/nonexistent models that must NOT exist
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.5-flash']).toBeDefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-3.5-flash']).toBeUndefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-3-pro-preview']).toBeUndefined();
        expect(DEFAULT_GOOGLE_MODELS['deep-research-max-preview-04-2026']).toBeUndefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.0-flash-lite-preview-02-05']).toBeUndefined();
        expect(DEFAULT_GOOGLE_MODELS['gemini-2.0-flash-thinking-exp-01-21']).toBeUndefined();
    });

    test('DEFAULT_OPENROUTER_MODELS should use verified model IDs (not fabricated ones)', () => {
        // Verified real IDs
        expect(DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet']).toBeDefined();
        expect(DEFAULT_OPENROUTER_MODELS['deepseek/deepseek-r1']).toBeDefined();
        expect(DEFAULT_OPENROUTER_MODELS['meta-llama/llama-4-maverick']).toBeDefined();
        expect(DEFAULT_OPENROUTER_MODELS['moonshotai/kimi-k2']).toBeDefined();

        // Removed fabricated IDs
        expect(DEFAULT_OPENROUTER_MODELS['anthropic/claude-sonnet-5']).toBeUndefined();
        expect(DEFAULT_OPENROUTER_MODELS['anthropic/claude-haiku-4.5']).toBeUndefined();
        expect(DEFAULT_OPENROUTER_MODELS['deepseek/deepseek-chat']).toBeUndefined();
        expect(DEFAULT_OPENROUTER_MODELS['mistralai/mistral-large-2512']).toBeUndefined();
    });

    test('gemini-2.5-flash should be free tier in DEFAULT_GOOGLE_MODELS', () => {
        const m = DEFAULT_GOOGLE_MODELS['gemini-2.5-flash'];
        expect(m).toBeDefined();
        expect(m.tier).toBe('free');
        expect(m.provider).toBe('google-ai-studio');
        expect(modelManager.isFreeTier(m)).toBe(true);
    });

    test('gemini-2.5-pro should be pro tier in DEFAULT_GOOGLE_MODELS', () => {
        const m = DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'];
        expect(m).toBeDefined();
        expect(m.tier).toBe('pro'); // capacity label in static defaults
        // Google AI Studio Pro is usable with a free API key (not payment-required)
        expect(modelManager.isFreeTier({ ...m, id: 'gemini-2.5-pro' })).toBe(true);
    });

    test('categorizeModel: thinking/thinker keywords map to reasoning', () => {
        expect(modelManager.categorizeModel('gemini-2.5-flash-thinking-mode')).toContain('reasoning');
        expect(modelManager.categorizeModel('some-thinker-model')).toContain('reasoning');
        expect(modelManager.categorizeModel('model-r1-reasoning')).toContain('reasoning');
        expect(modelManager.categorizeModel('openai/o3-mini')).toContain('reasoning');
        expect(modelManager.categorizeModel('openai/o4-mini')).toContain('reasoning');
    });

    test('categorizeModel: learnlm maps to general', () => {
        expect(modelManager.categorizeModel('learnlm-1.5-pro-experimental')).toContain('general');
    });

    test('categorizeModel: scout/maverick map to fast/openweights', () => {
        expect(modelManager.categorizeModel('meta-llama/llama-4-scout')).toContain('fast');
        expect(modelManager.categorizeModel('meta-llama/llama-4-maverick')).toContain('general');
    });

    test('categorizeModel: nemo maps to fast and openweights', () => {
        const cats = modelManager.categorizeModel('mistralai/mistral-nemo');
        expect(cats).toContain('fast');
        expect(cats).toContain('openweights');
    });

    test('categorizeModel: wizard maps to coding (and openweights)', () => {
        const cats = modelManager.categorizeModel('wizard-coder-34b');
        expect(cats).toContain('coding');
    });

    test('categorizeModel: command-r maps to coding', () => {
        const cats = modelManager.categorizeModel('cohere/command-r-plus');
        expect(cats).toContain('coding');
    });

    test('sanitizeModelId strips Google API prefix', () => {
        expect(modelManager.sanitizeModelId('models/gemini-2.5-flash')).toBe('gemini-2.5-flash');
        expect(modelManager.sanitizeModelId('gemini-2.0-flash')).toBe('gemini-2.0-flash');
        expect(modelManager.sanitizeModelId('google-ai-studio/gemini-2.5-pro')).toBe('gemini-2.5-pro');
    });

    test('getProviderForModel handles new vendor prefixes', () => {
        expect(modelManager.getProviderForModel('x-ai/grok-3-beta')).toBe('openrouter');
        expect(modelManager.getProviderForModel('moonshotai/kimi-k2')).toBe('openrouter');
        expect(modelManager.getProviderForModel('learnlm-1.5-pro-experimental')).toBe('google-ai-studio');
        expect(modelManager.getProviderForModel('gemini-2.5-flash')).toBe('google-ai-studio');
        expect(modelManager.getProviderForModel('sonar-deep-research')).toBe('perplexity');
    });

    test('should fetch and categorize dynamic models from OpenRouter API', async () => {
        axios.get.mockResolvedValue({
            data: {
                data: [
                    { 
                        id: 'anthropic/claude-3.5-sonnet', 
                        name: 'Claude 3.5 Sonnet', 
                        description: 'Coding model',
                        pricing: { prompt: "0.000003", completion: "0.000015" }
                    },
                    { 
                        id: 'deepseek/deepseek-r1', 
                        name: 'DeepSeek R1', 
                        description: 'Reasoning model',
                        pricing: { prompt: "0", completion: "0" }
                    },
                    { 
                        id: 'google/gemini-2.0-flash-001', 
                        name: 'Gemini Flash', 
                        description: 'Fast model',
                        pricing: { prompt: "0.0", completion: "0.0" }
                    }
                ]
            }
        });

        const models = await modelManager.fetchModels({ bypassCache: true });
        expect(models['anthropic/claude-3.5-sonnet']).toBeDefined();
        expect(models['anthropic/claude-3.5-sonnet'].category).toContain('coding');
        expect(models['anthropic/claude-3.5-sonnet'].tier).toBe('pro');
        
        expect(models['deepseek/deepseek-r1'].category).toContain('reasoning');
        expect(models['deepseek/deepseek-r1'].tier).toBe('free');
        
        expect(models['google/gemini-2.0-flash-001'].category).toContain('fast');
        expect(models['google/gemini-2.0-flash-001'].tier).toBe('free');
    });

    test('should group models by expertise category', async () => {
        axios.get.mockResolvedValue({
            data: {
                data: [
                    { id: 'qwen/qwen-2.5-coder-32b', name: 'Qwen Coder' }
                ]
            }
        });

        const grouped = await modelManager.getModelsByCategory({ bypassCache: true });
        expect(grouped.coding).toBeDefined();
        expect(grouped.coding.some(m => m.id === 'qwen/qwen-2.5-coder-32b')).toBe(true);
        expect(grouped.research.some(m => m.id === 'sonar-deep-research')).toBe(true);
    });

    test('should return recommended models for each domain', () => {
        const rec = modelManager.getRecommendedModels();
        expect(rec.coding.length).toBeGreaterThan(0);
        expect(rec.reasoning.length).toBeGreaterThan(0);
        expect(rec.research.length).toBeGreaterThan(0);
        expect(rec.fast.length).toBeGreaterThan(0);
        // Recommended fast should include gemini-2.5-flash (real ID)
        expect(rec.fast.some(m => m.id === 'gemini-2.5-flash')).toBe(true);
    });

    test('should return categories metadata', () => {
        const categories = modelManager.getCategories();
        expect(categories.CODING.id).toBe('coding');
        expect(categories.REASONING.id).toBe('reasoning');
        expect(categories.RESEARCH.id).toBe('research');
    });
});
