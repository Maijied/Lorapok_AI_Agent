/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const logger = require('../lib/logger');
const modelAccessService = require('./ModelAccessService');
const modelCacheService = require('./ModelCacheService');
const modelValidator = require('./ModelValidator');

/**
 * Dynamic sanitize pipeline: discover → normalize → modality → classify → probe → views.
 */
class ModelSanitizeService {
    constructor(modelManager) {
        this.modelManager = modelManager;
        this.lastResult = null;
    }

    _collectKeys(keys = {}, config = null) {
        return {
            googleKey: keys.googleKey || (config && config.getGoogleApiKey && config.getGoogleApiKey()) ||
                process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
            openRouterKey: keys.openRouterKey || (config && config.getOpenRouterApiKey && config.getOpenRouterApiKey()) ||
                process.env.OPENROUTER_API_KEY || '',
            perplexityKey: keys.perplexityKey || (config && config.getPerplexityApiKey && config.getPerplexityApiKey()) ||
                process.env.PERPLEXITY_API_KEY || ''
        };
    }

    /**
     * Run full sanitize.
     * @param {Object} [options]
     * @param {Object} [options.keys]
     * @param {Object} [options.config]
     * @param {boolean} [options.force]
     * @param {boolean} [options.probe=true]
     * @param {string} [options.selectedModel]
     * @returns {Promise<{ catalog: Object, validated: Object, views: Object, stats: Object, fallbackRank: string[] }>}
     */
    async sanitize(options = {}) {
        const mm = this.modelManager;
        if (!mm) throw new Error('ModelSanitizeService requires a ModelManager instance');

        const keys = this._collectKeys(options.keys || {}, options.config || mm.config);
        const force = Boolean(options.force);

        if (force) {
            modelCacheService.clearFailedModels();
            modelAccessService.clearCache();
        }

        // 1. Discover (API-first via ModelManager.fetchModels)
        const catalog = await mm.fetchModels({ bypassCache: force });

        // 2–4. Validate modality + keys + classify (already on catalog from normalize)
        const validated = mm.validateUsableModels(catalog, keys);

        // Merge access states from cache onto validated
        for (const [id, meta] of Object.entries(validated)) {
            const state = modelAccessService.getAccessState(id);
            meta.accessState = state;
            if (state === modelAccessService.ACCESS_STATES.UNAVAILABLE) {
                meta.available = false;
            }
        }

        // 5. Probe adaptive set
        let probeResults = [];
        if (options.probe !== false) {
            const probeIds = this._selectProbeIds(validated, options.selectedModel || (options.config && options.config.getModel && options.config.getModel()));
            probeResults = await modelAccessService.probeCatalog(probeIds, keys, validated, { force });
            for (const r of probeResults) {
                if (!validated[r.id]) continue;
                validated[r.id].accessState = r.state;
                if (r.state === modelAccessService.ACCESS_STATES.UNAVAILABLE ||
                    r.state === modelAccessService.ACCESS_STATES.ERROR) {
                    validated[r.id].available = false;
                    if (r.state === modelAccessService.ACCESS_STATES.ERROR) {
                        modelCacheService.addFailedModel(r.id, r.detail || 'probe error');
                    }
                } else if (modelAccessService.isSelectableState(r.state)) {
                    validated[r.id].available = true;
                }
            }
            modelCacheService.cacheUsableModels(validated);
        }

        // 6. Views (sorted: accessible Google first)
        const usable = mm.sortModelIdsForDisplay(mm.getUsableModelIds(validated), validated);
        const paid = mm.sortModelIdsForDisplay(mm.getPaidCatalogIds(validated), validated);
        const selectable = mm.sortModelIdsForDisplay(
            Object.keys(validated).filter(id => mm.canSelectModel(id, validated)),
            validated
        );
        const views = { usable, paid, selectable };
        const fallbackRank = mm.buildFallbackRank(validated, options.selectedModel || null);

        const stats = {
            catalogSize: Object.keys(catalog).length,
            validatedSize: Object.keys(validated).length,
            usable: views.usable.length,
            paid: views.paid.length,
            selectable: views.selectable.length,
            probed: probeResults.filter(r => !r.cached).length,
            accessible: Object.values(validated).filter(m => m.accessState === 'accessible').length,
            locked: Object.values(validated).filter(m => m.accessState === 'locked').length,
            unavailable: Object.values(validated).filter(m => m.accessState === 'unavailable').length
        };

        this.lastResult = { catalog, validated, views, stats, fallbackRank };
        logger.info(`ModelSanitizeService: usable=${stats.usable} paid=${stats.paid} selectable=${stats.selectable} probed=${stats.probed}`);
        return this.lastResult;
    }

    _selectProbeIds(validated, selectedModel) {
        const ids = new Set();
        if (selectedModel) ids.add(String(selectedModel));

        for (const [id, meta] of Object.entries(validated)) {
            if (!meta || meta.available !== true) continue;
            if (modelValidator.isNonTextModality(id, meta)) continue;
            // Always probe free-tier candidates
            const free = typeof meta.paymentRequired === 'boolean' ? !meta.paymentRequired : true;
            if (free) ids.add(id);
            // Perplexity set is small — probe all with keys
            if (meta.provider === 'perplexity') ids.add(id);
            // Google chat candidates — probe all available
            if (meta.provider === 'google-ai-studio') ids.add(id);
        }

        // Cap OpenRouter free probes already included; skip bulk paid
        return Array.from(ids);
    }

    /**
     * Ensure a model is probed before selection.
     */
    async ensureProbed(modelId, keys = {}, meta = {}) {
        const state = modelAccessService.getAccessState(modelId);
        if (state !== modelAccessService.ACCESS_STATES.UNVERIFIED) {
            return { id: modelId, state, detail: 'cached', status: null, cached: true };
        }
        return modelAccessService.probeModel(modelId, keys, meta);
    }
}

module.exports = { ModelSanitizeService };
