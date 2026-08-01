/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const logger = require('../lib/logger');
const modelCacheService = require('./ModelCacheService');

const ACCESS_STATES = Object.freeze({
    ACCESSIBLE: 'accessible',
    LOCKED: 'locked',
    UNAVAILABLE: 'unavailable',
    RATE_LIMITED: 'rate_limited',
    UNVERIFIED: 'unverified',
    ERROR: 'error'
});

const ENDPOINTS = {
    perplexity: 'https://api.perplexity.ai/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    'google-ai-studio': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
};

/** Perplexity (and safe shared default) rejects probes below this floor. */
const PROBE_MAX_TOKENS = 16;

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Live mini-chat probes + persisted access-state cache.
 */
class ModelAccessService {
    constructor(options = {}) {
        this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
        this.concurrency = options.concurrency || 4;
        this.cacheFile = options.cacheFile || path.join(os.homedir(), '.lorapok', 'model_access_cache.json');
        this.memory = new Map();
        this._loadDiskCache();
    }

    _ensureDir() {
        const dir = path.dirname(this.cacheFile);
        if (!fs.existsSync(dir)) {
            try { fs.mkdirSync(dir, { recursive: true }); } catch (_) { /* ignore */ }
        }
    }

    _loadDiskCache() {
        try {
            if (!fs.existsSync(this.cacheFile)) return;
            const raw = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
            const entries = raw.entries || raw;
            for (const [id, entry] of Object.entries(entries)) {
                if (entry && entry.state && entry.checkedAt) {
                    this.memory.set(id, entry);
                }
            }
        } catch (err) {
            logger.warn(`ModelAccessService: failed to load access cache — ${err.message}`);
        }
    }

    _persistDiskCache() {
        try {
            this._ensureDir();
            const entries = {};
            for (const [id, entry] of this.memory.entries()) {
                entries[id] = entry;
            }
            fs.writeFileSync(this.cacheFile, JSON.stringify({
                version: 1,
                updatedAt: Date.now(),
                entries
            }, null, 2), 'utf8');
        } catch (err) {
            logger.warn(`ModelAccessService: failed to write access cache — ${err.message}`);
        }
    }

    clearCache() {
        this.memory.clear();
        try {
            if (fs.existsSync(this.cacheFile)) fs.unlinkSync(this.cacheFile);
        } catch (_) { /* ignore */ }
    }

    getAccessState(modelId) {
        if (!modelId) return ACCESS_STATES.UNVERIFIED;
        const id = String(modelId).trim();
        const entry = this.memory.get(id);
        if (!entry) return ACCESS_STATES.UNVERIFIED;
        if (Date.now() - entry.checkedAt > this.ttlMs) return ACCESS_STATES.UNVERIFIED;
        return entry.state;
    }

    getEntry(modelId) {
        return this.memory.get(String(modelId || '').trim()) || null;
    }

    setAccessState(modelId, state, detail = '') {
        if (!modelId || !state) return;
        const id = String(modelId).trim();
        this.memory.set(id, {
            state,
            detail: String(detail || '').slice(0, 300),
            checkedAt: Date.now()
        });
        if (state === ACCESS_STATES.UNAVAILABLE) {
            modelCacheService.addFailedModel(id, detail || 'Unavailable');
        }
        this._persistDiskCache();
    }

    isSelectableState(state) {
        return state === ACCESS_STATES.ACCESSIBLE || state === ACCESS_STATES.RATE_LIMITED;
    }

    canSelect(modelId) {
        return this.isSelectableState(this.getAccessState(modelId));
    }

    _resolveProvider(modelId, meta = {}) {
        if (meta.provider) return meta.provider;
        const id = String(modelId || '');
        if (id.startsWith('gemini-') || id.startsWith('gemma') || id.startsWith('learnlm-')) return 'google-ai-studio';
        if (id.includes('/')) return 'openrouter';
        return 'perplexity';
    }

    _resolveKey(provider, keys = {}) {
        if (provider === 'google-ai-studio') return keys.googleKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (provider === 'openrouter') return keys.openRouterKey || process.env.OPENROUTER_API_KEY;
        return keys.perplexityKey || process.env.PERPLEXITY_API_KEY;
    }

    classifyHttpResult(status, message = '') {
        const msg = String(message || '').toLowerCase();
        if (status >= 200 && status < 300) return ACCESS_STATES.ACCESSIBLE;
        if (status === 429) return ACCESS_STATES.RATE_LIMITED;
        // Client misconfig (e.g. max_tokens too low) — not a model lock
        if (status === 400 && (msg.includes('max_tokens') || msg.includes('max tokens'))) {
            return ACCESS_STATES.ERROR;
        }
        if (status === 404 || msg.includes('no longer available') || msg.includes('not found')) {
            return ACCESS_STATES.UNAVAILABLE;
        }
        if (status === 401 || status === 402 || status === 403 ||
            msg.includes('credit') || msg.includes('billing') || msg.includes('payment') ||
            msg.includes('insufficient') || msg.includes('upgrade')) {
            return ACCESS_STATES.LOCKED;
        }
        return ACCESS_STATES.ERROR;
    }

    /**
     * Mini chat probe for a single model.
     * @returns {Promise<{ id: string, state: string, detail: string, status: number|null }>}
     */
    async probeModel(modelId, keys = {}, meta = {}) {
        const id = String(modelId || '').trim();
        if (!id) {
            return { id, state: ACCESS_STATES.ERROR, detail: 'Missing model id', status: null };
        }

        const provider = this._resolveProvider(id, meta);
        const apiKey = this._resolveKey(provider, keys);
        if (!apiKey || !String(apiKey).trim()) {
            const result = { id, state: ACCESS_STATES.LOCKED, detail: 'No API key', status: null };
            this.setAccessState(id, result.state, result.detail);
            return result;
        }

        const url = ENDPOINTS[provider] || ENDPOINTS.perplexity;
        const headers = {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        if (provider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://lorapok.tech';
            headers['X-Title'] = 'Lorapok AI Agent';
        }

        const payload = {
            model: id,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: PROBE_MAX_TOKENS,
            temperature: 0
        };

        try {
            const response = await axios.post(url, payload, { headers, timeout: 12000 });
            const state = this.classifyHttpResult(response.status, '');
            const result = { id, state, detail: 'OK', status: response.status };
            this.setAccessState(id, state, result.detail);
            return result;
        } catch (error) {
            const status = error.response?.status || null;
            const data = error.response?.data;
            let message = error.message;
            if (data?.error?.message) message = data.error.message;
            else if (typeof data === 'string') message = data;
            const state = this.classifyHttpResult(status || 0, message);
            const result = { id, state, detail: String(message).slice(0, 300), status };
            this.setAccessState(id, state, result.detail);
            return result;
        }
    }

    /**
     * Live auth check for a provider API key (does not print the key).
     * @param {'perplexity'|'openrouter'|'google-ai-studio'} provider
     * @param {string} apiKey
     * @returns {Promise<{ ok: boolean, connected: boolean, state: string, detail: string, status: number|null, provider: string }>}
     */
    async verifyProviderKey(provider, apiKey) {
        const key = String(apiKey || '').trim();
        const prov = String(provider || '').trim();
        if (!key) {
            return {
                ok: false,
                connected: false,
                state: ACCESS_STATES.LOCKED,
                detail: 'No API key provided',
                status: null,
                provider: prov
            };
        }

        try {
            if (prov === 'google-ai-studio') {
                const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=1`;
                const response = await axios.get(url, { timeout: 12000 });
                const state = this.classifyHttpResult(response.status, '');
                return {
                    ok: this.isSelectableState(state),
                    connected: state === ACCESS_STATES.ACCESSIBLE || state === ACCESS_STATES.RATE_LIMITED,
                    state,
                    detail: 'Google AI Studio accepted the key',
                    status: response.status,
                    provider: prov
                };
            }

            if (prov === 'openrouter') {
                const response = await axios.get('https://openrouter.ai/api/v1/models', {
                    headers: {
                        Authorization: `Bearer ${key}`,
                        'HTTP-Referer': 'https://lorapok.tech',
                        'X-Title': 'Lorapok AI Agent'
                    },
                    timeout: 12000
                });
                const state = this.classifyHttpResult(response.status, '');
                const count = Array.isArray(response.data?.data) ? response.data.data.length : 0;
                return {
                    ok: this.isSelectableState(state),
                    connected: state === ACCESS_STATES.ACCESSIBLE || state === ACCESS_STATES.RATE_LIMITED,
                    state,
                    detail: count > 0
                        ? `OpenRouter accepted the key (${count} models visible)`
                        : 'OpenRouter accepted the key',
                    status: response.status,
                    provider: prov
                };
            }

            // Perplexity — mini chat with a stable free/default model
            // API requires max_tokens >= 16 (validated 2026-08).
            const probeModel = 'sonar';
            const response = await axios.post(
                ENDPOINTS.perplexity,
                {
                    model: probeModel,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: PROBE_MAX_TOKENS,
                    temperature: 0
                },
                {
                    headers: {
                        Authorization: `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );
            const state = this.classifyHttpResult(response.status, '');
            const result = {
                ok: this.isSelectableState(state),
                connected: state === ACCESS_STATES.ACCESSIBLE || state === ACCESS_STATES.RATE_LIMITED,
                state,
                detail: 'Perplexity accepted the key',
                status: response.status,
                provider: prov
            };
            if (result.connected) {
                this.setAccessState(probeModel, state, result.detail);
            }
            return result;
        } catch (error) {
            const status = error.response?.status || null;
            const data = error.response?.data;
            let message = error.message;
            if (data?.error?.message) message = data.error.message;
            else if (typeof data?.error === 'string') message = data.error;
            else if (typeof data === 'string') message = data;
            const state = this.classifyHttpResult(status || 0, message);
            const connected = state === ACCESS_STATES.ACCESSIBLE || state === ACCESS_STATES.RATE_LIMITED;
            return {
                ok: this.isSelectableState(state),
                connected,
                state,
                detail: String(message).slice(0, 300),
                status,
                provider: prov
            };
        }
    }

    /**
     * Probe many models with bounded concurrency.
     * @param {string[]} ids
     * @param {Object} keys
     * @param {Object} [catalog={}] modelId -> meta
     * @param {Object} [options={}]
     */
    async probeCatalog(ids = [], keys = {}, catalog = {}, options = {}) {
        const list = [...new Set((ids || []).filter(Boolean).map(String))];
        const concurrency = options.concurrency || this.concurrency;
        const force = Boolean(options.force);
        const results = [];

        const queue = list.filter(id => {
            if (force) return true;
            const state = this.getAccessState(id);
            return state === ACCESS_STATES.UNVERIFIED;
        });

        // Preserve already-known entries in results
        for (const id of list) {
            if (!queue.includes(id)) {
                results.push({
                    id,
                    state: this.getAccessState(id),
                    detail: (this.getEntry(id) || {}).detail || 'cached',
                    status: null,
                    cached: true
                });
            }
        }

        let idx = 0;
        const workers = Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
            while (idx < queue.length) {
                const current = queue[idx++];
                const meta = catalog[current] || {};
                const r = await this.probeModel(current, keys, meta);
                results.push({ ...r, cached: false });
            }
        });
        await Promise.all(workers);
        return results;
    }
}

const instance = new ModelAccessService();
instance.ModelAccessService = ModelAccessService;
instance.ACCESS_STATES = ACCESS_STATES;
instance.PROBE_MAX_TOKENS = PROBE_MAX_TOKENS;
module.exports = instance;
