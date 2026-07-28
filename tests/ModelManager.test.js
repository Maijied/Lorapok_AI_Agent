/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const { ModelManager, CATEGORIES } = require('../services/ModelManager');
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
        expect(models['anthropic/claude-3.5-sonnet'].category).toBe('coding');
        expect(models['anthropic/claude-3.5-sonnet'].tier).toBe('pro');
        
        expect(models['deepseek/deepseek-r1'].category).toBe('reasoning');
        expect(models['deepseek/deepseek-r1'].tier).toBe('free');
        
        expect(models['google/gemini-2.0-flash-001'].category).toBe('fast');
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
    });

    test('should return categories metadata', () => {
        const categories = modelManager.getCategories();
        expect(categories.CODING.id).toBe('coding');
        expect(categories.REASONING.id).toBe('reasoning');
        expect(categories.RESEARCH.id).toBe('research');
    });
});
