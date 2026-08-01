/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * ModelRouter — scoring-based model selection engine.
 * Implements auto/manual/on-demand selection modes with
 * capability matching, cost optimization, and failure penalty.
 */
'use strict';

const logger = require('../lib/logger');
const { ProviderUnavailableError } = require('../lib/errors');

// ── Selection Modes ──────────────────────────────────────────────────

/**
 * @enum {string}
 */
const SELECTION_MODES = {
    /** User pins a specific model — no scoring */
    MANUAL: 'manual',
    /** Router scores all candidates and picks the best */
    AUTO: 'auto',
    /** Each sub-step independently asks the router */
    ON_DEMAND: 'on_demand'
};

// ── Task Tags ────────────────────────────────────────────────────────

const TASK_TAGS = new Set([
    'code_gen', 'debugging', 'reasoning', 'web_grounding',
    'image_gen', 'transcription', 'classification', 'summarization',
    'tool_use', 'analysis', 'planning', 'fast_response'
]);

// ── Scoring Weights (Defaults) ───────────────────────────────────────

const DEFAULT_WEIGHTS = {
    w1: 0.40,  // capability_match
    w2: 0.20,  // cost efficiency (1/cost)
    w3: 0.15,  // latency efficiency (1/latency)
    w4: 0.25   // context_fit
};

// ── ModelRouter Class ────────────────────────────────────────────────

/**
 * Scoring-based model selection engine.
 * Routes tasks to the best available model based on capability, cost, latency, and context fit.
 */
class ModelRouter {
    /**
     * @param {Object} [options={}]
     * @param {Object} [options.weights] - Custom scoring weights
     * @param {string} [options.mode='auto'] - Default selection mode
     * @param {string} [options.pinnedModel=null] - Pinned model for manual mode
     */
    constructor(options = {}) {
        this.weights = { ...DEFAULT_WEIGHTS, ...options.weights };
        this.mode = options.mode || SELECTION_MODES.AUTO;
        this.pinnedModel = options.pinnedModel || null;

        /** @type {Map<string, { failures: number, lastFailure: number }>} */
        this._failureTracking = new Map();
    }

    /**
     * Select the best model for a task.
     *
     * @param {Object} options
     * @param {string[]} options.taskTags - Required capability tags (e.g., ['code_gen', 'tool_use'])
     * @param {number} options.estimatedTokens - Estimated context + output tokens needed
     * @param {Object} options.modelProfiles - Map of model ID → ModelProfile objects
     * @param {string} [options.modality='text'] - Required modality
     * @param {string} [options.preferredModel=null] - User-preferred model (soft preference)
     * @returns {{ modelId: string, profile: Object, score: number, reason: string }}
     * @throws {ProviderUnavailableError} If no candidates match
     */
    select(options) {
        const { taskTags = [], estimatedTokens = 0, modelProfiles = {}, modality = 'text', preferredModel = null } = options;

        // Manual mode: use pinned model
        const pinned = preferredModel || this.pinnedModel;
        if (this.mode === SELECTION_MODES.MANUAL && pinned) {
            const profile = modelProfiles[pinned];
            if (profile) {
                if (this._isAvailable(profile)) {
                    return { modelId: pinned, profile, score: 1.0, reason: 'User-pinned model' };
                }
                logger.warn(`ModelRouter: pinned model "${pinned}" is unavailable`);
            }
        }

        // Score all candidates
        const candidates = this._scoreCandidates(taskTags, estimatedTokens, modelProfiles, modality);

        if (candidates.length === 0) {
            throw new ProviderUnavailableError(
                `No available models for task [${taskTags.join(', ')}] with modality "${modality}"`,
                taskTags.join(','),
                Object.keys(modelProfiles)
            );
        }

        const best = candidates[0];
        logger.info(`ModelRouter: selected "${best.modelId}" (score: ${best.score.toFixed(3)}, reason: ${best.reason})`);
        return best;
    }

    /**
     * Score all candidate models and return sorted list (best first).
     * @private
     * @param {string[]} taskTags
     * @param {number} estimatedTokens
     * @param {Object} modelProfiles
     * @param {string} modality
     * @returns {Array<{ modelId: string, profile: Object, score: number, reason: string }>}
     */
    _scoreCandidates(taskTags, estimatedTokens, modelProfiles, modality) {
        const candidates = [];

        for (const [modelId, profile] of Object.entries(modelProfiles)) {
            // Hard disqualifiers
            if (!this._isAvailable(profile)) continue;
            if (!this._matchesModality(profile, modality)) continue;
            if (estimatedTokens > 0 && !this._fitsContext(profile, estimatedTokens)) continue;

            // Scoring
            const capabilityScore = this._scoreCapability(profile, taskTags);
            const costScore = this._scoreCost(profile);
            const latencyScore = this._scoreLatency(profile);
            const contextScore = this._scoreContextFit(profile, estimatedTokens);
            const failurePenalty = this._getFailurePenalty(modelId);

            const score = (
                this.weights.w1 * capabilityScore +
                this.weights.w2 * costScore +
                this.weights.w3 * latencyScore +
                this.weights.w4 * contextScore -
                failurePenalty
            );

            const reasons = [];
            if (capabilityScore > 0.5) reasons.push('strong capability match');
            if (costScore > 0.7) reasons.push('cost-efficient');
            if (latencyScore > 0.7) reasons.push('low latency');

            candidates.push({
                modelId,
                profile,
                score: Math.max(0, score),
                reason: reasons.join(', ') || 'baseline match'
            });
        }

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);
        return candidates;
    }

    /**
     * Score capability match (intersection of task tags with model strengths).
     * @private
     * @param {Object} profile
     * @param {string[]} taskTags
     * @returns {number} 0.0–1.0
     */
    _scoreCapability(profile, taskTags) {
        if (!taskTags || taskTags.length === 0) return 0.5; // neutral if no requirements
        const strengths = profile.strengths || profile.category || [];
        const strengthSet = new Set(Array.isArray(strengths) ? strengths : [strengths]);
        let matches = 0;
        for (const tag of taskTags) {
            if (strengthSet.has(tag)) matches++;
        }
        return taskTags.length > 0 ? matches / taskTags.length : 0.5;
    }

    /**
     * Score cost efficiency (cheaper = higher score).
     * @private
     * @param {Object} profile
     * @returns {number} 0.0–1.0
     */
    _scoreCost(profile) {
        const cost = profile.costPerMTokIn || 0;
        if (cost === 0) return 1.0; // free models get max cost score
        // Normalize: $0.10/M → 0.9, $1/M → 0.5, $10/M → 0.1
        return Math.max(0.05, 1.0 - (Math.log10(cost + 0.01) + 1) / 3);
    }

    /**
     * Score latency (faster = higher score).
     * @private
     * @param {Object} profile
     * @returns {number} 0.0–1.0
     */
    _scoreLatency(profile) {
        const latencyClass = profile.latencyClass || 'standard';
        switch (latencyClass) {
            case 'fast': return 1.0;
            case 'standard': return 0.5;
            case 'slow': return 0.2;
            default: return 0.5;
        }
    }

    /**
     * Score context fit (how well the model's context window accommodates the task).
     * @private
     * @param {Object} profile
     * @param {number} estimatedTokens
     * @returns {number} 0.0–1.0
     */
    _scoreContextFit(profile, estimatedTokens) {
        const window = profile.contextWindow || profile.contextLength || 128000;
        if (estimatedTokens <= 0) return 0.8; // generous default
        const utilization = estimatedTokens / window;
        if (utilization > 0.95) return 0.0; // too tight
        if (utilization > 0.80) return 0.3; // risky
        if (utilization > 0.50) return 0.7; // reasonable
        return 1.0; // plenty of room
    }

    /**
     * Check if model is available (not marked down).
     * @private
     * @param {Object} profile
     * @returns {boolean}
     */
    _isAvailable(profile) {
        const availability = profile.availability || 'online';
        return availability !== 'down';
    }

    /**
     * Check if model supports the required modality.
     * @private
     * @param {Object} profile
     * @param {string} modality
     * @returns {boolean}
     */
    _matchesModality(profile, modality) {
        if (modality === 'text') return true; // all models support text
        const modelModality = profile.modality || 'text';
        return modelModality === modality || modelModality === 'multimodal';
    }

    /**
     * Check if model's context window fits the estimated tokens.
     * @private
     * @param {Object} profile
     * @param {number} tokens
     * @returns {boolean}
     */
    _fitsContext(profile, tokens) {
        const window = profile.contextWindow || profile.contextLength || 128000;
        return tokens <= window * 0.95; // 5% safety margin
    }

    /**
     * Get failure penalty for a model (exponential backoff on recent failures).
     * @private
     * @param {string} modelId
     * @returns {number} Penalty value (0 = no penalty)
     */
    _getFailurePenalty(modelId) {
        const tracking = this._failureTracking.get(modelId);
        if (!tracking || tracking.failures === 0) return 0;

        // Exponential penalty: 0.1 * 2^(failures-1), capped at 1.0
        const basePenalty = 0.1 * Math.pow(2, tracking.failures - 1);

        // Decay over time (halve penalty every 5 minutes)
        const elapsed = Date.now() - tracking.lastFailure;
        const decayFactor = Math.pow(0.5, elapsed / (5 * 60 * 1000));

        return Math.min(1.0, basePenalty * decayFactor);
    }

    /**
     * Record a failure for a model (increases future penalty).
     * @param {string} modelId
     */
    recordFailure(modelId) {
        const existing = this._failureTracking.get(modelId) || { failures: 0, lastFailure: 0 };
        this._failureTracking.set(modelId, {
            failures: existing.failures + 1,
            lastFailure: Date.now()
        });
        logger.warn(`ModelRouter: recorded failure #${existing.failures + 1} for "${modelId}"`);
    }

    /**
     * Record a success for a model (resets failure tracking).
     * @param {string} modelId
     */
    recordSuccess(modelId) {
        this._failureTracking.delete(modelId);
    }

    /**
     * Set the selection mode.
     * @param {string} mode - One of SELECTION_MODES values
     */
    setMode(mode) {
        if (!Object.values(SELECTION_MODES).includes(mode)) {
            throw new Error(`Invalid selection mode: "${mode}"`);
        }
        this.mode = mode;
    }

    /**
     * Pin a specific model for manual mode.
     * @param {string|null} modelId
     */
    pinModel(modelId) {
        this.pinnedModel = modelId;
    }

    /**
     * Get current failure tracking stats.
     * @returns {Object}
     */
    getFailureStats() {
        const stats = {};
        for (const [modelId, tracking] of this._failureTracking) {
            stats[modelId] = { ...tracking };
        }
        return stats;
    }

    /**
     * Reset all failure tracking.
     */
    resetFailures() {
        this._failureTracking.clear();
    }
}

module.exports = {
    ModelRouter,
    SELECTION_MODES,
    TASK_TAGS,
    DEFAULT_WEIGHTS
};
