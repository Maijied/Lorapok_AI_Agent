const modelCacheService = require('../services/ModelCacheService');

describe('ModelCacheService', () => {
    beforeEach(() => {
        modelCacheService.clearCache();
    });

    test('should cache and retrieve usable models', () => {
        const mockUsable = {
            'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', provider: 'google-ai-studio', available: true }
        };

        modelCacheService.cacheUsableModels(mockUsable);
        const cached = modelCacheService.getCachedUsableModels();
        expect(cached).toEqual(mockUsable);
    });

    test('should dynamically track failed models and invalidate cached usable models', () => {
        const mockUsable = {
            'gemini-2.5-flash-preview-tts': { name: 'TTS Model', available: true }
        };

        modelCacheService.cacheUsableModels(mockUsable);
        expect(modelCacheService.getCachedUsableModels()).toEqual(mockUsable);

        // Dynamically add failed model
        modelCacheService.addFailedModel('gemini-2.5-flash-preview-tts', 'Audio modality only');

        expect(modelCacheService.isModelFailed('gemini-2.5-flash-preview-tts')).toBe(true);
        expect(modelCacheService.getFailedModels()).toContain('gemini-2.5-flash-preview-tts');
        
        // Usable cache should be invalidated
        expect(modelCacheService.getCachedUsableModels()).toBeNull();
    });

    test('clearFailedModels resets failure tracking', () => {
        modelCacheService.addFailedModel('gemini-2.0-flash', '429');
        expect(modelCacheService.isModelFailed('gemini-2.0-flash')).toBe(true);
        modelCacheService.clearFailedModels();
        expect(modelCacheService.isModelFailed('gemini-2.0-flash')).toBe(false);
        expect(modelCacheService.getFailedModels()).toHaveLength(0);
    });
});
