/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const modelValidator = require('../services/ModelValidator');
const modelCacheService = require('../services/ModelCacheService');

describe('ModelValidator Service', () => {
    beforeEach(() => {
        modelCacheService.clearCache();
    });

    test('should identify non-text modality models (audio, tts, embedding, image, video, deprecated)', () => {
        // Audio / TTS
        expect(modelValidator.isNonTextModality('gemini-2.5-flash-preview-tts')).toBe(true);
        expect(modelValidator.isNonTextModality('text-to-speech-model')).toBe(true);
        expect(modelValidator.isNonTextModality('lyria-3-pro-preview')).toBe(true);
        // Embeddings
        expect(modelValidator.isNonTextModality('text-embedding-004')).toBe(true);
        expect(modelValidator.isNonTextModality('embed-content-model')).toBe(true);
        // Image generation
        expect(modelValidator.isNonTextModality('imagen-3.0-generate-002')).toBe(true);
        // Video
        expect(modelValidator.isNonTextModality('veo-2.0-generate-001')).toBe(true);
        // Deprecated code-only models
        expect(modelValidator.isNonTextModality('code-gecko@001')).toBe(true);
        expect(modelValidator.isNonTextModality('code-bison-001')).toBe(true);
        // AQA retrieval model
        expect(modelValidator.isNonTextModality('aqa@gemini')).toBe(true);

        // Real chat models must NOT be excluded by modality filter
        expect(modelValidator.isNonTextModality('gemini-2.5-flash')).toBe(false);
        expect(modelValidator.isNonTextModality('gemini-2.0-flash')).toBe(false);
        expect(modelValidator.isNonTextModality('gemini-2.5-pro')).toBe(false);
        expect(modelValidator.isNonTextModality('deepseek/deepseek-r1')).toBe(false);
        expect(modelValidator.isNonTextModality('anthropic/claude-3.5-sonnet')).toBe(false);
        expect(modelValidator.isNonTextModality('learnlm-1.5-pro-experimental')).toBe(false);
    });

    test('gemini-2.5-flash is closed to new users; flash-latest / 3.5-flash remain usable', () => {
        const metaGoogle = { provider: 'google-ai-studio', name: 'Gemini' };
        expect(modelValidator.isModelUsable('gemini-2.5-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
        expect(modelValidator.isModelUsable('gemini-2.5-flash-lite', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
        expect(modelValidator.isModelUsable('gemini-2.5-pro', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);
        expect(modelValidator.isModelUsable('gemini-2.0-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);
        expect(modelValidator.isModelUsable('gemini-flash-latest', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);
        expect(modelValidator.isModelUsable('gemini-3.5-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);
    });

    test('image / computer-use / robotics Google IDs are non-text modality', () => {
        expect(modelValidator.isNonTextModality('gemini-2.5-flash-image')).toBe(true);
        expect(modelValidator.isNonTextModality('gemini-3.1-flash-lite-image')).toBe(true);
        expect(modelValidator.isNonTextModality('nano-banana-pro-preview')).toBe(true);
        expect(modelValidator.isNonTextModality('gemini-2.5-computer-use-preview-10-2025')).toBe(true);
        expect(modelValidator.isNonTextModality('gemini-robotics-er-2-preview')).toBe(true);
    });

    test('genuinely deprecated Google models remain blocked even with a valid key', () => {
        const metaGoogle = { provider: 'google-ai-studio', name: 'Gemini Legacy' };
        expect(modelValidator.isModelUsable('gemini-1.0-pro', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
        expect(modelValidator.isModelUsable('gemini-pro', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
        expect(modelValidator.isModelUsable('gemini-1.5-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
        expect(modelValidator.isModelUsable('gemini-1.5-pro', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
    });

    test('should validate single model usability based on provider API keys', () => {
        const metaGoogle = { provider: 'google-ai-studio', name: 'Gemini Flash' };
        const metaOpenRouter = { provider: 'openrouter', name: 'GPT-4o' };
        const metaPerplexity = { provider: 'perplexity', name: 'Sonar' };

        // No keys — nothing usable
        expect(modelValidator.isModelUsable('gemini-flash-latest', metaGoogle, {})).toBe(false);
        expect(modelValidator.isModelUsable('openai/gpt-4o', metaOpenRouter, {})).toBe(false);
        expect(modelValidator.isModelUsable('sonar', metaPerplexity, {})).toBe(false);

        // Google key present — real models usable
        expect(modelValidator.isModelUsable('gemini-flash-latest', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);
        expect(modelValidator.isModelUsable('gemini-2.0-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);

        // TTS stays excluded even with key
        expect(modelValidator.isModelUsable('gemini-2.5-flash-preview-tts', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);

        // OpenRouter key
        expect(modelValidator.isModelUsable('openai/gpt-4o', metaOpenRouter, { openRouterKey: 'sk-or-v1-testkey' })).toBe(true);

        // Perplexity key
        expect(modelValidator.isModelUsable('sonar', metaPerplexity, { perplexityKey: 'pplx-testkey' })).toBe(true);
    });

    test('should filter model catalog through validateUsableModels', () => {
        const models = {
            'gemini-flash-latest': { name: 'Gemini Flash Latest', provider: 'google-ai-studio' },
            'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', provider: 'google-ai-studio' },
            'gemini-2.5-flash-preview-tts': { name: 'TTS Model', provider: 'google-ai-studio' },
            'openai/gpt-4o': { name: 'GPT-4o', provider: 'openrouter' },
            'sonar': { name: 'Sonar', provider: 'perplexity' }
        };

        const validated = modelValidator.validateUsableModels(models, {
            googleKey: 'AIzaSyGoogleKey'
        });

        expect(validated['gemini-flash-latest'].available).toBe(true);
        // Closed to new users
        expect(validated['gemini-2.5-flash'].available).toBe(false);
        // TTS excluded by modality filter
        expect(validated['gemini-2.5-flash-preview-tts'].available).toBe(false);
        // No OpenRouter key
        expect(validated['openai/gpt-4o'].available).toBe(false);
        // No Perplexity key
        expect(validated['sonar'].available).toBe(false);
    });

    test('should handle runtime model failures via ModelCacheService', () => {
        modelCacheService.addFailedModel('bad-model-xyz', '404 Not Found');
        const meta = { provider: 'openrouter', name: 'Bad Model' };
        // Even with a key, a failed model should be excluded
        expect(modelValidator.isModelUsable('bad-model-xyz', meta, { openRouterKey: 'sk-or-v1-testkey' })).toBe(false);
    });
});
