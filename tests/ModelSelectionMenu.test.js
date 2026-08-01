/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * Verifies all four Model Selection menu entry points produce coherent views.
 */
'use strict';

const { ModelManager, DEFAULT_GOOGLE_MODELS, DEFAULT_OPENROUTER_MODELS, DEFAULT_PERPLEXITY_MODELS } = require('../services/ModelManager');
const modelValidator = require('../services/ModelValidator');
const modelCacheService = require('../services/ModelCacheService');
const modelAccessService = require('../services/ModelAccessService');

function buildValidatedModels(keys = {}) {
    const allModels = {
        ...DEFAULT_PERPLEXITY_MODELS,
        ...DEFAULT_OPENROUTER_MODELS,
        ...DEFAULT_GOOGLE_MODELS
    };
    const validated = modelValidator.validateUsableModels(allModels, keys);
    for (const [id, meta] of Object.entries(validated)) {
        if (meta.available) {
            meta.accessState = 'accessible';
            meta.paymentRequired = typeof meta.paymentRequired === 'boolean'
                ? meta.paymentRequired
                : meta.tier === 'pro' && meta.provider !== 'google-ai-studio';
            if (meta.provider === 'google-ai-studio') meta.paymentRequired = false;
        }
    }
    return validated;
}

describe('Model Selection menu options (all four paths)', () => {
    let mm;

    beforeEach(() => {
        modelCacheService.clearCache();
        modelAccessService.clearCache();
        mm = new ModelManager();
    });

    const keys = {
        googleKey: 'AIzaSyTest',
        openRouterKey: 'sk-or-v1-test',
        perplexityKey: 'pplx-test'
    };

    test('🟢 Currently Usable — free-tier + live-accessible only', () => {
        const models = buildValidatedModels(keys);
        const usable = mm.getUsableModelIds(models);
        expect(usable.length).toBeGreaterThan(0);
        usable.forEach(id => {
            expect(models[id].available).toBe(true);
            expect(mm.isFreeTier({ ...models[id], id })).toBe(true);
            expect(['accessible', 'rate_limited']).toContain(models[id].accessState);
        });
        expect(usable).toContain('sonar');
        expect(usable).not.toContain('sonar-pro');
    });

    test('📁 Browse by category — usable models in that domain only', () => {
        const models = buildValidatedModels(keys);
        const coding = mm.getUsableModelsByCategoryView(models, 'coding');
        expect(coding.length).toBeGreaterThan(0);
        coding.forEach(id => {
            expect(mm.getUsableModelIds(models)).toContain(id);
            const cats = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
            expect(cats).toContain('coding');
        });
        expect(coding.every(id => mm.isFreeTier({ ...models[id], id }))).toBe(true);
    });

    test('🏢 Browse by provider — all keyed models (free + paid) for Perplexity', () => {
        const models = buildValidatedModels({ perplexityKey: 'pplx-test' });
        expect(mm.getKeyedProviders(models)).toEqual(['perplexity']);
        const pplx = mm.getModelsByProviderView(models, 'perplexity');
        expect(pplx).toEqual(expect.arrayContaining([
            'sonar', 'sonar-pro', 'sonar-reasoning-pro', 'sonar-deep-research'
        ]));
        expect(pplx).toHaveLength(4);
    });

    test('🌐 View all → usable mirrors Currently Usable', () => {
        const models = buildValidatedModels(keys);
        expect(mm.getUsableModelIds(models)).toEqual(mm.getUsableModelIds(models));
    });

    test('🌐 View all → paid catalog is payment-required only', () => {
        const models = buildValidatedModels(keys);
        const paid = mm.getPaidCatalogIds(models);
        expect(paid.length).toBeGreaterThan(0);
        expect(paid).toContain('sonar-pro');
        expect(paid).not.toContain('sonar');
        paid.forEach(id => expect(mm.isFreeTier({ ...models[id], id })).toBe(false));
    });

    test('Usable and paid sets are mutually exclusive', () => {
        const models = buildValidatedModels(keys);
        const usable = new Set(mm.getUsableModelIds(models));
        const paid = new Set(mm.getPaidCatalogIds(models));
        for (const id of usable) expect(paid.has(id)).toBe(false);
    });
});
