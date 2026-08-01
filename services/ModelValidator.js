const logger = require('../lib/logger');
const modelCacheService = require('./ModelCacheService');
const modelAccessService = require('./ModelAccessService');

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

        // Models that are NOT text-chat capable:
        // - Text-to-Speech / Audio synthesis
        // - Embedding / vector models
        // - Image generation (Imagen, DALL-E, Flux)
        // - Video generation (Veo)
        // - Deprecated Bison/Gecko chat models (replaced, often 404)
        // - AQA: Answer Quality Assessment model (retrieval, not chat)
        // - Code Gecko / Code Bison: old completion-only models
        const nonTextKeywords = [
            // Audio / TTS
            'tts', 'text-to-speech', 'speech-synthesis', 'audio-only', 'lyria',
            // Embeddings
            'embedding', 'embed-content', 'embed-gecko', 'text-embedding',
            'embedding-001', 'embedding-exp',
            // Image generation (incl. Gemini *-image / nano-banana)
            'imagen', 'image-generation', 'imagegeneration',
            '-image', 'flash-image', 'nano-banana',
            // Video generation
            'veo', 'video-generation',
            // Computer-use / robotics hardware (not general chat CLI)
            'computer-use', 'robotics-er-', 'robotics-1.', 'gemini-robotics',
            // Deprecated / non-chat Google models
            'bison-001', 'gecko-001', 'gecko-002',
            'code-gecko', 'code-bison', 'text-bison',
            // AQA (Attributed Question Answering — retrieval model, NOT chat)
            '-aqa', 'aqa@',
            // Retrieval / Semantic search models
            'retrieval-',
            // Experimental non-chat / often 404 on OpenAI-compat chat
            'antigravity-', 'deep-research-max', 'deep-research-preview', 'deep-research-pro',
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

        // 1. Exclude non-text/specialized modality models (audio, tts, embedding, imagen, video)
        if (this.isNonTextModality(id, meta)) {
            return false;
        }

        // 2. Exclude models that failed at runtime (429 limit 0, 404, modality error)
        if (modelCacheService.isModelFailed(id)) {
            return false;
        }

        // 3. Verify model availability flag is not explicitly set false
        if (meta.available === false) {
            return false;
        }

        // 4. Verify provider API key presence
        const { googleKey, openRouterKey, perplexityKey } = keys;
        const provider = meta.provider || 'perplexity';

        if (provider === 'google-ai-studio') {
            const hasKey = Boolean(googleKey && String(googleKey).trim() !== '');
            if (!hasKey) return false;

            // Confirmed deprecated / closed to new users / always-error Google IDs (live probe 2026-08).
            const deprecatedOrZeroQuota = [
                // Legacy Palm-era models (always 404/deprecated)
                'gemini-1.0-pro', 'gemini-pro',
                // Gemini 1.5 — sunset
                'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b',
                // Gemini 2.5 flash family — "no longer available to new users" on chat endpoint
                'gemini-2.5-flash', 'gemini-2.5-flash-lite',
                'gemini-2.5-flash-001', 'gemini-2.5-flash-lite-001',
                // Robotics / special hardware models (not API-accessible)
                'gemini-robotics-er-1.5-preview', 'gemini-robotics-er-1.6-preview',
                'gemini-robotics-1.5-preview',
                // Audio-only / specialist models
                'lyria-3-clip-preview', 'lyria-3-pro-preview',
                // Old experimental IDs with date suffixes that no longer exist
                'gemini-2.0-flash-thinking-exp-01-21',
                'gemini-2.0-flash-lite-preview-02-05',
                'gemini-2.0-pro-exp-02-05',
            ];
            if (deprecatedOrZeroQuota.includes(id)) {
                return false;
            }
            return true;
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
            const provider = meta.provider || 'perplexity';
            let paymentRequired = meta.paymentRequired;
            let rateLimited = meta.rateLimited;
            let tier = meta.tier;
            if (typeof paymentRequired !== 'boolean') {
                if (provider === 'google-ai-studio') {
                    paymentRequired = false;
                    rateLimited = Boolean(rateLimited) || String(id).toLowerCase().includes('pro') || tier === 'pro';
                    tier = 'free';
                } else {
                    paymentRequired = tier === 'pro';
                    rateLimited = !paymentRequired;
                    tier = paymentRequired ? 'pro' : 'free';
                }
            }
            const accessState = meta.accessState || modelAccessService.getAccessState(id);
            let available = isUsable;
            if (accessState === 'unavailable') available = false;
            validated[id] = {
                ...meta,
                id,
                available,
                paymentRequired,
                rateLimited: Boolean(rateLimited),
                tier: tier || (paymentRequired ? 'pro' : 'free'),
                accessState
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
