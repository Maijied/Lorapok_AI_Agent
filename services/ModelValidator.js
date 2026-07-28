const logger = require('../lib/logger');

/**
 * Service for validating LLM model usability, API key presence, and rate limit / quota eligibility.
 */
class ModelValidator {
    constructor() {
        // Models known to have 0 free tier quota or deprecated/unavailable status
        this.excludedModels = [
            'gemini-2.5-pro',
            'gemini-1.5-pro',
            'gemini-2.5-flash',
            'gemini-1.5-flash',
            'gemini-3.1-pro'
        ];
    }

    /**
     * Get list of excluded zero-quota or unavailable model IDs.
     * @returns {Array<string>} Excluded model IDs
     */
    getExcludedModels() {
        return [...this.excludedModels];
    }

    /**
     * Check if a single model is usable given active provider API keys.
     * @param {string} modelId - Model ID string
     * @param {Object} [meta={}] - Model metadata object
     * @param {Object} [keys={}] - Active API keys { googleKey, openRouterKey, perplexityKey }
     * @returns {boolean} True if usable, false otherwise
     */
    isModelUsable(modelId, meta = {}, keys = {}) {
        if (!modelId) return false;
        if (this.excludedModels.includes(modelId)) return false;
        if (meta.available === false) return false;

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
     * Filter a dictionary of models and mark usability status.
     * @param {Object} models - Dictionary of model metadata objects keyed by model ID
     * @param {Object} keys - Active API keys { googleKey, openRouterKey, perplexityKey }
     * @returns {Object} Validated model metadata dictionary
     */
    validateUsableModels(models = {}, keys = {}) {
        const validated = {};

        for (const [id, meta] of Object.entries(models)) {
            if (this.excludedModels.includes(id)) continue;

            const isUsable = this.isModelUsable(id, meta, keys);
            validated[id] = {
                ...meta,
                available: isUsable
            };
        }

        return validated;
    }
}

const instance = new ModelValidator();
instance.ModelValidator = ModelValidator;
module.exports = instance;
