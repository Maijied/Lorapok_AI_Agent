const modelValidator = require('../services/ModelValidator');

describe('ModelValidator Service', () => {
    test('should identify zero-quota / unusable excluded models', () => {
        const excluded = modelValidator.getExcludedModels();
        expect(excluded).toContain('gemini-2.5-pro');
        expect(excluded).toContain('gemini-1.5-pro');
    });

    test('should validate single model usability based on provider API keys', () => {
        const metaGoogle = { provider: 'google-ai-studio', name: 'Gemini Flash' };
        const metaOpenRouter = { provider: 'openrouter', name: 'GPT-4o' };
        const metaPerplexity = { provider: 'perplexity', name: 'Sonar' };

        // No keys set
        expect(modelValidator.isModelUsable('gemini-3.6-flash', metaGoogle, {})).toBe(false);
        expect(modelValidator.isModelUsable('openai/gpt-4o', metaOpenRouter, {})).toBe(false);
        expect(modelValidator.isModelUsable('sonar', metaPerplexity, {})).toBe(false);

        // Google key present
        expect(modelValidator.isModelUsable('gemini-3.6-flash', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(true);

        // Excluded model should never be usable
        expect(modelValidator.isModelUsable('gemini-2.5-pro', metaGoogle, { googleKey: 'AIzaSyGoogleKey' })).toBe(false);
    });

    test('should filter model catalog through validateUsableModels', () => {
        const models = {
            'gemini-3.6-flash': { name: 'Gemini 3.6 Flash', provider: 'google-ai-studio' },
            'gemini-2.5-pro': { name: 'Gemini 2.5 Pro', provider: 'google-ai-studio' },
            'openai/gpt-4o': { name: 'GPT-4o', provider: 'openrouter' },
            'sonar': { name: 'Sonar', provider: 'perplexity' }
        };

        const validated = modelValidator.validateUsableModels(models, {
            googleKey: 'AIzaSyGoogleKey'
        });

        expect(validated['gemini-3.6-flash'].available).toBe(true);
        expect(validated['gemini-2.5-pro']).toBeUndefined(); // Excluded zero-quota model
        expect(validated['openai/gpt-4o'].available).toBe(false); // Missing OpenRouter key
        expect(validated['sonar'].available).toBe(false); // Missing Perplexity key
    });
});
