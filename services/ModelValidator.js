const logger = require('../lib/logger');
const modelCacheService = require('./ModelCacheService');

/**
 * Service for dynamically validating LLM model usability, response modality compatibility, and key availability.
 */
class ModelValidator {
    /**
     * Dynamically check if a model ID or description represents a specialized non-text modality (TTS, Embedding, Imagen, Veo).
     * @param {string} modelId - Model identifier
     * @param {Object} [meta={}] - Model metadata
     * @returns {boolean} True if non-chat specialized modality model
     */
    isNonTextModality(modelId, meta = {}) {
        const idStr = String(modelId || '').toLowerCase();
        const descStr = String(meta.description || '').toLowerCase();
        const nameStr = String(meta.name || '').toLowerCase();

        const nonTextKeywords = [
            'tts', 'text-to-speech', 'speech', 'audio-only',
            'embedding', 'embed-content', 'embed-gecko',
            'imagen', 'image-generation',
            'veo', 'video-generation',
            'bison-001', 'gecko-001'
        ];

        return nonTextKeywords.some(kw => idStr.includes(kw) || nameStr.includes(kw) || descStr.includes(kw));
    }

    /**
     * Get list of dynamically excluded model IDs (from ModelCacheService).
     * @returns {Array<string>} Excluded model IDs
     */
    getExcludedModels() {
        return modelCacheService.getFailedModels();
    }

    /**
     * Dynamically check if a model is usable based on modality, runtime health, and provider keys.
     * @param {string} modelId - Model ID string
     * @param {Object} [meta={}] - Model metadata object
     * @param {Object} [keys={}] - Active API keys { googleKey, openRouterKey, perplexityKey }
     * @returns {boolean} True if usable for chat/coding, false otherwise
     */
    isModelUsable(modelId, meta = {}, keys = {}) {
        if (!modelId) return false;
        const id = String(modelId).trim();

        // 1. Dynamic check: exclude non-text/specialized modality models (audio, tts, embedding, imagen)
        if (this.isNonTextModality(id, meta)) {
            return false;
        }

        // 2. Dynamic check: exclude models that failed at runtime (429 limit 0, 404, modality error)
        if (modelCacheService.isModelFailed(id)) {
            return false;
        }

        // 3. Dynamic check: verify model availability flag
        if (meta.available === false) {
            return false;
        }

        // 4. Dynamic check: provider API key presence
        const { googleKey, openRouterKey, perplexityKey } = keys;
        const provider = meta.provider || 'perplexity';

        if (provider === 'google-ai-studio') {
            return Boolean(googleKey && String(googleKey).trim() !== '');
        }
        if (provider === 'openrouter') {
            return Boolean(openRouterKey && String(openRouterKey).trim() !== '');
        }
        if (provider === 'perplexity') {
            return Boolean(perplexityKey && String(perplexityKey).trim() !== '');
        }

        return true;
    }

    /**
     * Filter a dictionary of models dynamically and return usable models cached via ModelCacheService.
     * @param {Object} models - Dictionary of model metadata objects
     * @param {Object} keys - Active API keys { googleKey, openRouterKey, perplexityKey }
     * @returns {Object} Validated model metadata dictionary
     */
    validateUsableModels(models = {}, keys = {}) {
        const validated = {};

        for (const [id, meta] of Object.entries(models)) {
            const isUsable = this.isModelUsable(id, meta, keys);
            validated[id] = {
                ...meta,
                available: isUsable
            };
        }

        // Cache the validated models dictionary
        modelCacheService.cacheUsableModels(validated);
        return validated;
    }
}

const instance = new ModelValidator();
instance.ModelValidator = ModelValidator;
module.exports = instance;
