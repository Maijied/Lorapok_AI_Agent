const NodeCache = require('node-cache');
const logger = require('../lib/logger');

/**
 * Service for caching validated usable models and dynamically recording runtime failed / zero-quota models.
 */
class ModelCacheService {
    constructor(ttlSeconds = 3600) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: 600 });
        this.failedModels = new Map(); // modelId -> { reason, timestamp }
    }

    /**
     * Cache validated usable models dictionary.
     * @param {Object} models - Validated models dictionary
     * @returns {void}
     */
    cacheUsableModels(models) {
        if (!models || typeof models !== 'object') return;
        this.cache.set('usable_models', models);
        logger.info(`ModelCacheService: Cached ${Object.keys(models).length} usable models.`);
    }

    /**
     * Get cached usable models dictionary.
     * @returns {Object|null} Cached usable models or null
     */
    getCachedUsableModels() {
        return this.cache.get('usable_models') || null;
    }

    /**
     * Dynamically register a failed model (e.g. 429 quota 0, 404, modality mismatch).
     * @param {string} modelId - Model ID string
     * @param {string} [reason='API failure'] - Reason for exclusion
     * @returns {void}
     */
    addFailedModel(modelId, reason = 'API failure') {
        if (!modelId) return;
        const normalizedId = String(modelId).trim();
        this.failedModels.set(normalizedId, {
            reason,
            timestamp: Date.now()
        });
        logger.warn(`ModelCacheService: Dynamically excluded failed model '${normalizedId}'. Reason: ${reason}`);
        
        // Invalidate cached usable models so UI refresh reflects dynamic exclusion
        this.cache.del('usable_models');
        this.cache.del('availableModels');
    }

    /**
     * Check if a model is dynamically marked as failed/excluded.
     * @param {string} modelId - Model ID
     * @returns {boolean} True if failed/excluded
     */
    isModelFailed(modelId) {
        if (!modelId) return false;
        return this.failedModels.has(String(modelId).trim());
    }

    /**
     * Get list of dynamically excluded model IDs.
     * @returns {Array<string>} Array of model IDs
     */
    getFailedModels() {
        return Array.from(this.failedModels.keys());
    }

    /**
     * Clear all cached models and reset dynamic failure tracking.
     * @returns {void}
     */
    clearCache() {
        this.cache.flushAll();
        this.failedModels.clear();
        logger.info('ModelCacheService: Cache and failure tracking cleared.');
    }
}

const instance = new ModelCacheService();
instance.ModelCacheService = ModelCacheService;
module.exports = instance;
