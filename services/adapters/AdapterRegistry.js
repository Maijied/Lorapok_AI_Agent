/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * AdapterRegistry — singleton registry of all provider adapters.
 * Resolves model IDs to the correct adapter via ModelManager provider detection.
 */
'use strict';

const { LorapokError } = require('../../lib/errors');
const { PerplexityAdapter } = require('./PerplexityAdapter');
const { OpenRouterAdapter } = require('./OpenRouterAdapter');
const { GoogleAdapter } = require('./GoogleAdapter');

/**
 * Registry mapping provider names to adapter instances.
 * Singleton — all components share one registry.
 */
class AdapterRegistry {
    constructor() {
        /** @type {Map<string, import('./BaseAdapter').BaseAdapter>} */
        this._adapters = new Map();
        this._registerDefaults();
    }

    /**
     * Register all built-in adapters.
     * @private
     */
    _registerDefaults() {
        this.register(new PerplexityAdapter());
        this.register(new OpenRouterAdapter());
        this.register(new GoogleAdapter());
    }

    /**
     * Register a new adapter.
     * @param {import('./BaseAdapter').BaseAdapter} adapter - Adapter instance
     */
    register(adapter) {
        if (!adapter || !adapter.name) {
            throw new LorapokError('Cannot register adapter without a name');
        }
        this._adapters.set(adapter.name, adapter);
    }

    /**
     * Get an adapter by provider name.
     * @param {string} providerName - Provider name (e.g., 'perplexity', 'openrouter', 'google-ai-studio')
     * @returns {import('./BaseAdapter').BaseAdapter|null} Adapter or null if not found
     */
    getAdapter(providerName) {
        return this._adapters.get(providerName) || null;
    }

    /**
     * Get an adapter for a model ID by resolving via a ModelManager instance.
     * @param {string} modelId - Model identifier
     * @param {Object} modelManager - ModelManager instance with getProviderForModel()
     * @returns {import('./BaseAdapter').BaseAdapter|null} Resolved adapter or null
     */
    getAdapterForModel(modelId, modelManager) {
        if (!modelManager || typeof modelManager.getProviderForModel !== 'function') {
            throw new LorapokError('getAdapterForModel requires a ModelManager with getProviderForModel()');
        }
        const provider = modelManager.getProviderForModel(modelId);
        return this.getAdapter(provider);
    }

    /**
     * Get all registered adapter names.
     * @returns {string[]}
     */
    getProviderNames() {
        return [...this._adapters.keys()];
    }

    /**
     * Get all adapters that support a specific capability.
     * @param {string} capability - Capability key (e.g., 'toolUse', 'vision', 'streaming')
     * @returns {import('./BaseAdapter').BaseAdapter[]} Adapters with the capability
     */
    getAdaptersWithCapability(capability) {
        const result = [];
        for (const adapter of this._adapters.values()) {
            if (adapter.capabilities[capability]) {
                result.push(adapter);
            }
        }
        return result;
    }

    /**
     * Get all available (healthy) adapters.
     * @returns {import('./BaseAdapter').BaseAdapter[]}
     */
    getAvailableAdapters() {
        const result = [];
        for (const adapter of this._adapters.values()) {
            if (adapter.isAvailable()) {
                result.push(adapter);
            }
        }
        return result;
    }

    /**
     * Get number of registered adapters.
     * @returns {number}
     */
    size() {
        return this._adapters.size;
    }

    /**
     * Serialize all adapter metadata.
     * @returns {Object[]}
     */
    toJSON() {
        return [...this._adapters.values()].map(a => a.toJSON());
    }
}

// ── Singleton Instance ───────────────────────────────────────────────

let _instance = null;

/**
 * Get the global AdapterRegistry instance.
 * @returns {AdapterRegistry}
 */
function getAdapterRegistry() {
    if (!_instance) {
        _instance = new AdapterRegistry();
    }
    return _instance;
}

/**
 * Reset the global instance (for testing).
 */
function resetAdapterRegistry() {
    _instance = null;
}

module.exports = {
    AdapterRegistry,
    getAdapterRegistry,
    resetAdapterRegistry
};
