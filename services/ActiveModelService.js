/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const modelAccessService = require('./ModelAccessService');

/**
 * Professional active-model status for headers, prompts, and footers.
 */
class ActiveModelService {
    constructor(modelManager) {
        this.modelManager = modelManager;
    }

    getIcon(meta = {}) {
        if (this.modelManager && typeof this.modelManager.getModelIcon === 'function') {
            return this.modelManager.getModelIcon(meta.id || '', meta.name || '');
        }
        return '\u25C6';
    }

    /** Clean display name without emoji / provider suffix — for compact prompts. */
    cleanDisplayName(meta = {}, id = '') {
        const raw = meta.name
            ? String(meta.name).replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '').trim()
            : (id || 'No model');
        return raw.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim() || id || 'No model';
    }

    /**
     * Remaining context budget for the active model.
     * @param {Object} [meta]
     * @param {Object} [sessionData]
     * @returns {{ maxCtx: number, used: number, remaining: number, pctLeft: number, label: string }}
     */
    getContextBudget(meta = {}, sessionData = null) {
        const maxCtx = Number(meta.contextLength) || 1000000;
        const id = meta.id || '';
        const used = (sessionData && sessionData.modelUsage && sessionData.modelUsage[id]
            ? sessionData.modelUsage[id].total
            : 0) || (sessionData && sessionData.tokens ? sessionData.tokens.total : 0) || 0;
        const remaining = Math.min(maxCtx, Math.max(0, maxCtx - used));
        const pctLeft = Math.min(100, Math.max(0, Math.round((remaining / maxCtx) * 100)));
        return { maxCtx, used, remaining, pctLeft, label: `${pctLeft}%` };
    }

    /**
     * @param {Object} config - LorapokConfig
     * @param {Object} [validated={}]
     * @param {Object|null} [sessionData=null]
     * @returns {Object}
     */
    getStatus(config, validated = {}, sessionData = null) {
        const id = config && typeof config.getModel === 'function' ? (config.getModel() || '') : '';
        const mm = this.modelManager;
        const meta = { id, ...((validated && validated[id]) || (mm && mm.getModelMetadata && mm.getModelMetadata(id)) || {}) };
        const displayName = this.cleanDisplayName(meta, id);
        const icon = this.getIcon(meta);
        const provider = meta.provider || (mm && mm.getProviderForModel(id)) || 'unknown';
        const accessState = meta.accessState || modelAccessService.getAccessState(id);
        const hasKey = meta.available !== false;
        const showCatalog = Boolean(meta.paymentRequired);
        const tierLabel = mm && typeof mm.getTierLabel === 'function'
            ? mm.getTierLabel({ ...meta, id }, hasKey, showCatalog && !modelAccessService.isSelectableState(accessState))
            : '';
        const budget = this.getContextBudget(meta, sessionData);
        const shortName = displayName.length > 28 ? displayName.slice(0, 26) + '\u2026' : displayName;
        const shortLine = `${icon} ${displayName}`;
        const promptBadge = shortName;
        const promptRight = `${icon} ${shortName}  \u00b7  ${budget.label}`;
        const ctxTone = budget.pctLeft >= 50 ? 'success' : budget.pctLeft >= 20 ? 'warning' : 'error';

        return {
            id,
            displayName,
            shortName,
            icon,
            provider,
            tierLabel,
            accessState,
            shortLine,
            promptBadge,
            promptRight,
            contextPct: budget.pctLeft,
            contextLabel: budget.label,
            contextBudget: budget,
            ctxTone,
            paymentRequired: Boolean(meta.paymentRequired),
            rateLimited: Boolean(meta.rateLimited)
        };
    }
}

module.exports = { ActiveModelService };
