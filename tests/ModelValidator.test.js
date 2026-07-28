const modelValidator = require('../services/ModelValidator');
const modelCacheService = require('../services/ModelCacheService');

describe('ModelValidator Service', () => {
    beforeEach(() => {
        modelCacheService.clearCache();
    });

    test('should dynamically identify non-text modality models', () => {
        expect(modelValidator.isNonTextModality('gemini-2.5-flash-preview-tts')).toBe(true);
        expect(modelValidator.isNonTextModality('text-embedding-004')).toBe(true);
        expect(modelValidator.isNonTextModality('imagen-3.0-generate-002')).toBe(true);
        expect(modelValidator.isNonTextModality('veo-2.0-generate-001')).toBe(true);
        expect(modelValidator.isNonTextModality('gemini-3.6-flash')).toBe(false);
    });

    test('should validate single model usability based on dynamic checks and provider API keys', () => {
        const metaGoogle = { provider: 'google-ai-studio', name: 'Gemini Flash' };
        const metaOpenRouter = { provider: 'openrouter', name: 'GPT-4o' };
        const metaPerplexity = { provider: 'perplexity', name: 'Sonar' };

        // No keys set
        expect(modelValidator.isModelUsable('gemini-3.6-flash', metaGoogle, {})).toBe(false);
        expect(modelValidator.isModelUsable('openai/gpt-4o', metaOpenRouter, {})).toBe(false);
        expect(modelValidator.isModelUsable('sonar', metaPerplexity, {})).toBe(false);

        // Google key present
        expect(modelValidator.isModelUsable('gemini-3.6-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);

        // Audio TTS model should never be usable for coding chat
        expect(modelValidator.isModelUsable('gemini-2.5-flash-preview-tts', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
    });

    test('should filter model catalog through validateUsableModels', () => {
        const models = {
            'gemini-3.6-flash': { name: 'Gemini 3.6 Flash', provider: 'google-ai-studio' },
            'gemini-2.5-flash-preview-tts': { name: 'TTS Model', provider: 'google-ai-studio' },
            'openai/gpt-4o': { name: 'GPT-4o', provider: 'openrouter' },
            'sonar': { name: 'Sonar', provider: 'perplexity' }
        };

        const validated = modelValidator.validateUsableModels(models, {
            googleKey: 'AIzaSyGoogleKey'
        });

        expect(validated['gemini-3.6-flash'].available).toBe(true);
        expect(validated['gemini-2.5-flash-preview-tts'].available).toBe(false); // Dynamic modality filter
        expect(validated['openai/gpt-4o'].available).toBe(false); // Missing OpenRouter key
        expect(validated['sonar'].available).toBe(false); // Missing Perplexity key
    });
});
