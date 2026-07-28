/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const NodeCache = require('node-cache');
const logger = require('./logger');

/**
 * Intelligent Response & Context Cache Engine for Lorapok AI Agent.
 * Reduces API latency and token consumption across repeated queries.
 */
class LorapokCache {
    /**
     * @param {Object} [options={}] - Cache options
     * @param {number} [options.ttl=86400] - Time to live in seconds (default 24h)
     * @param {boolean} [options.enabled=true] - Initial enabled state
     */
    constructor(options = {}) {
        this.ttl = options.ttl || 86400;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.cache = new NodeCache({ stdTTL: this.ttl, checkperiod: 600 });
        
        this.statsDir = path.join(os.homedir(), '.lorapok');
        this.statsFile = path.join(this.statsDir, 'cache_stats.json');

        this.stats = {
            hits: 0,
            misses: 0,
            tokensSaved: 0,
            savedCount: 0
        };

        this.loadStats();
    }

    /**
     * Load persisted cache statistics from disk.
     */
    loadStats() {
        try {
            if (fs.existsSync(this.statsFile)) {
                const data = JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
                this.stats = { ...this.stats, ...data };
            }
        } catch (e) {
            logger.warn(`Failed to load cache stats: ${e.message}`);
        }
    }

    /**
     * Save cache statistics to disk.
     */
    saveStats() {
        try {
            if (!fs.existsSync(this.statsDir)) {
                fs.mkdirSync(this.statsDir, { recursive: true });
            }
            fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2), 'utf8');
        } catch (e) {
            logger.warn(`Failed to save cache stats: ${e.message}`);
        }
    }

    /**
     * Generate deterministic SHA-256 cache key from request parameters.
     * @param {Array<Object>} messages - Conversation messages payload
     * @param {string} model - Model identifier
     * @param {number} [temperature=0.2] - Sampling temperature
     * @returns {string} SHA-256 hexadecimal hash key
     */
    generateKey(messages, model, temperature = 0.2) {
        const payload = JSON.stringify({ messages, model, temperature });
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Retrieve cached response payload if available and valid.
     * @param {string} key - Cache key
     * @returns {Object|null} Cached response payload or null if miss
     */
    get(key) {
        if (!this.enabled) return null;

        const entry = this.cache.get(key);
        if (entry) {
            this.stats.hits++;
            const saved = entry.usage?.total_tokens || 100;
            this.stats.tokensSaved += saved;
            this.saveStats();
            logger.info(`Cache HIT for key ${key.slice(0, 8)}... Saved ${saved} tokens.`);
            return {
                ...entry,
                cached: true,
                tokensSaved: saved
            };
        }

        this.stats.misses++;
        this.saveStats();
        return null;
    }

    /**
     * Store response payload in cache.
     * @param {string} key - Cache key
     * @param {Object} data - Response payload to cache
     * @returns {boolean} True if successfully cached
     */
    set(key, data) {
        if (!this.enabled || !data || !data.success) return false;

        this.cache.set(key, data);
        this.stats.savedCount++;
        this.saveStats();
        logger.info(`Cached response for key ${key.slice(0, 8)}...`);
        return true;
    }

    /**
     * Clear all cached items and reset statistics.
     */
    clear() {
        this.cache.flushAll();
        this.stats = {
            hits: 0,
            misses: 0,
            tokensSaved: 0,
            savedCount: 0
        };
        this.saveStats();
        logger.info('Cache cleared successfully.');
    }

    /**
     * Enable or disable response caching.
     * @param {boolean} flag - Target state
     */
    setEnabled(flag) {
        this.enabled = Boolean(flag);
    }

    /**
     * Get overall cache metrics summary.
     * @returns {{ enabled: boolean, hits: number, misses: number, tokensSaved: number, itemCount: number, hitRate: string }} Metrics summary
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%';
        return {
            enabled: this.enabled,
            hits: this.stats.hits,
            misses: this.stats.misses,
            tokensSaved: this.stats.tokensSaved,
            itemCount: this.cache.keys().length,
            hitRate
        };
    }
}

module.exports = LorapokCache;
