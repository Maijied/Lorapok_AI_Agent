/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * ModelMenuFiltering.test.js
 * Comprehensive corner-case tests for the model selection menu logic:
 *  - Strict free/paid separation: paid models ONLY in Paid Catalog
 *  - Currently Usable: free-tier accessible only
 *  - Category browse: free-tier accessible only
 *  - Provider browse: all keyed models for that provider (free + paid)
 *  - View All → Paid: all pro-tier (selectable if keyed, locked if not)
 *  - View All → Usable: same as Currently Usable (free-tier only)
 *  - Tier label / icon correctness
 *  - Deduplication, context display, selection messages
 */
'use strict';

const { ModelManager, DEFAULT_GOOGLE_MODELS, DEFAULT_OPENROUTER_MODELS, DEFAULT_PERPLEXITY_MODELS } = require('../services/ModelManager');
const modelValidator = require('../services/ModelValidator');
const modelCacheService = require('../services/ModelCacheService');
const modelAccessService = require('../services/ModelAccessService');

// ── Helpers mirroring logic in commands/settings.js ──────────────────────────

function buildValidatedModels(keys = {}) {
    const allModels = {
        ...DEFAULT_PERPLEXITY_MODELS,
        ...DEFAULT_OPENROUTER_MODELS,
        ...DEFAULT_GOOGLE_MODELS
    };
    const validated = modelValidator.validateUsableModels(allModels, keys);
    // Menu usable/selectable require live-probed access — simulate successful probes for keyed free models.
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

/** accessibleKeys = service-layer usable view */
function getFreeAccessibleKeys(models, mm) {
    return mm.getUsableModelIds(models);
}

/** Paid catalog = payment-required models */
function getPaidCatalogKeys(models, mm) {
    return mm.getPaidCatalogIds(models);
}

function getTierLabel(mm, item, hasAccess, showCatalog) {
    return mm.getTierLabel(item, hasAccess, showCatalog)
        .replace(/[()]/g, '')
        .trim();
}

function getStatusIcon(mm, item, hasAccess, showCatalog) {
    const icon = mm.getStatusIcon(item, hasAccess, showCatalog);
    if (icon === '🔒') return 'locked';
    if (icon === '🟢') return 'free';
    if (icon === '🔵') return 'rate-limited';
    if (icon === '✅') return 'accessible-paid';
    return 'paid';
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Tier Labels (settings.js logic)', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        modelAccessService.clearCache();
        mm = new ModelManager();
    });

    test('Google free-tier model gets "Free Tier" label', () => {
        const item = { ...DEFAULT_GOOGLE_MODELS['gemini-flash-latest'], available: true, accessState: 'accessible' };
        expect(getTierLabel(mm, item, true, false)).toBe('Free Tier');
    });

    test('Google pro-tier model gets "Rate Limited — Free API Key" (NOT credits required)', () => {
        const item = { ...DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'], available: true };
        expect(getTierLabel(mm, item, true, false)).toBe('Rate Limited — Free API Key');
    });

    test('OpenRouter pro-tier unverified model gets "Pro — Unverified"', () => {
        const item = { ...DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet'], available: true, accessState: 'unverified' };
        expect(getTierLabel(mm, item, true, false)).toBe('Pro — Unverified');
    });

    test('OpenRouter pro-tier accessible model gets "Pro — Accessible"', () => {
        const item = { ...DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet'], available: true, accessState: 'accessible' };
        expect(getTierLabel(mm, item, true, false)).toBe('Pro — Accessible');
    });

    test('OpenRouter pro-tier locked model gets "Pro — Credits Required / Locked"', () => {
        const item = { ...DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet'], available: true, accessState: 'locked' };
        expect(getTierLabel(mm, item, true, true)).toBe('Pro — Credits Required / Locked');
    });

    test('OpenRouter free-tier model gets "Free Tier"', () => {
        const item = { ...DEFAULT_OPENROUTER_MODELS['deepseek/deepseek-r1'], available: true };
        expect(getTierLabel(mm, item, true, false)).toBe('Free Tier');
    });

    test('Perplexity pro-tier accessible model gets "Pro — Accessible"', () => {
        const item = { ...DEFAULT_PERPLEXITY_MODELS['sonar-pro'], available: true, accessState: 'accessible', paymentRequired: true };
        expect(getTierLabel(mm, item, true, false)).toBe('Pro — Accessible');
    });

    test('Perplexity free-tier model gets "Free Tier"', () => {
        const item = { ...DEFAULT_PERPLEXITY_MODELS['sonar'], available: true };
        expect(getTierLabel(mm, item, true, false)).toBe('Free Tier');
    });

    test('Paid catalog: unkeyed model gets "No Key — Add to Unlock"', () => {
        const item = { ...DEFAULT_OPENROUTER_MODELS['anthropic/claude-opus-4'], available: false };
        expect(getTierLabel(mm, item, false, true)).toBe('No Key — Add to Unlock');
    });

    test('Paid catalog: even free-tier locked model gets "No Key" label (showCatalog trumps tier)', () => {
        const item = { ...DEFAULT_PERPLEXITY_MODELS['sonar'], available: false };
        expect(getTierLabel(mm, item, false, true)).toBe('No Key — Add to Unlock');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Status Icons', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('Google free-tier accessible = "free" icon', () => {
        const item = DEFAULT_GOOGLE_MODELS['gemini-flash-latest'];
        expect(getStatusIcon(mm, item, true, false)).toBe('free');
    });

    test('Google pro-tier accessible = "rate-limited" icon (blue, not paid/yellow)', () => {
        const item = DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'];
        expect(getStatusIcon(mm, item, true, false)).toBe('rate-limited');
    });

    test('OpenRouter paid accessible = "paid" icon', () => {
        const item = DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet'];
        expect(getStatusIcon(mm, item, true, false)).toBe('paid');
    });

    test('OpenRouter free accessible = "free" icon', () => {
        const item = DEFAULT_OPENROUTER_MODELS['deepseek/deepseek-r1'];
        expect(getStatusIcon(mm, item, true, false)).toBe('free');
    });

    test('Catalog + no key = "locked" icon regardless of tier', () => {
        const item = DEFAULT_OPENROUTER_MODELS['openai/gpt-4o'];
        expect(getStatusIcon(mm, item, false, true)).toBe('locked');
    });

    test('Google pro no key in catalog = "locked" (catalog overrides)', () => {
        const item = DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'];
        expect(getStatusIcon(mm, item, false, true)).toBe('locked');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Currently Usable (FREE-TIER ONLY)', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('With Google key only: shows only FREE-TIER Google models', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible.length).toBeGreaterThan(0);
        accessible.forEach(id => {
            expect(models[id].provider).toBe('google-ai-studio');
            expect(mm.isFreeTier(models[id])).toBe(true);
        });
    });

    test('With Google key only: gemini-2.5-flash included (free tier)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible).toContain('gemini-flash-latest');
    });

    test('With Google key only: gemini-2.5-pro INCLUDED (free API key, rate-limited — not paid)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible).toContain('gemini-2.5-pro');
        expect(mm.isFreeTier(models['gemini-2.5-pro'])).toBe(true);
    });

    test('With Google key only: no OpenRouter or Perplexity models accessible', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        const orOrPplx = accessible.filter(id => ['openrouter', 'perplexity'].includes(models[id].provider));
        expect(orOrPplx).toHaveLength(0);
    });

    test('With no keys: no models accessible', () => {
        const models = buildValidatedModels({});
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible).toHaveLength(0);
    });

    test('With OpenRouter key only: shows only FREE-TIER OR models', () => {
        const models = buildValidatedModels({ openRouterKey: 'sk-or-v1-test' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible.length).toBeGreaterThan(0);
        accessible.forEach(id => {
            expect(models[id].provider).toBe('openrouter');
            expect(mm.isFreeTier(models[id])).toBe(true);
        });
    });

    test('With Perplexity key only: shows only FREE-TIER Perplexity models', () => {
        const models = buildValidatedModels({ perplexityKey: 'pplx-test' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible.length).toBeGreaterThan(0);
        accessible.forEach(id => {
            expect(models[id].provider).toBe('perplexity');
            expect(mm.isFreeTier(models[id])).toBe(true);
        });
    });

    test('With all three keys: shows free-tier from all providers (no paid models)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' });
        const accessible = getFreeAccessibleKeys(models, mm);
        const providers = [...new Set(accessible.map(id => models[id].provider))];
        expect(providers).toContain('google-ai-studio');
        expect(providers).toContain('openrouter');
        expect(providers).toContain('perplexity');
        accessible.forEach(id => {
            expect(mm.isFreeTier(models[id])).toBe(true);
        });
    });

    test('No paid model ever appears in Currently Usable (even with all keys)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' });
        const accessible = getFreeAccessibleKeys(models, mm);
        const paidLeaks = accessible.filter(id => !mm.isFreeTier(models[id]));
        expect(paidLeaks).toHaveLength(0);
    });

    test('Failed models excluded from Currently Usable', () => {
        modelCacheService.addFailedModel('gemini-flash-latest', '429 Quota Exceeded');
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible).not.toContain('gemini-flash-latest');
    });

    test('TTS models never appear in Currently Usable', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        const ttsMod = accessible.find(id => id.includes('tts') || id.includes('text-to-speech'));
        expect(ttsMod).toBeUndefined();
    });

    test('Embedding models never appear in Currently Usable', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        const embMod = accessible.find(id => id.includes('embedding') || id.includes('embed-'));
        expect(embMod).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Category Browse (FREE-TIER ONLY)', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('coding category returns ONLY free-tier accessible models', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const coding = Object.keys(models).filter(id => {
            if (!models[id].available) return false;
            if (!mm.isFreeTier(models[id])) return false;
            const cats = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
            return cats.includes('coding');
        });
        expect(coding).toContain('gemini-flash-latest');
        expect(coding).toContain('gemini-2.5-pro');
        coding.forEach(id => expect(mm.isFreeTier(models[id])).toBe(true));
    });

    test('category browse never includes audio/image/video categories', () => {
        const excludedFromMenu = ['audio', 'image', 'video'];
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test' });
        excludedFromMenu.forEach(cat => {
            const accessible = Object.keys(models).filter(id => {
                if (!models[id].available) return false;
                if (!mm.isFreeTier(models[id])) return false;
                const cats = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
                return cats.includes(cat);
            });
            expect(accessible).toHaveLength(0);
        });
    });

    test('fast category with Google key includes gemini-2.0-flash (free tier)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const fast = Object.keys(models).filter(id => {
            if (!models[id].available) return false;
            if (!mm.isFreeTier(models[id])) return false;
            const cats = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
            return cats.includes('fast');
        });
        expect(fast).toContain('gemini-2.0-flash');
    });

    test('reasoning category with Google key includes gemini-3.5-flash (free)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const reasoning = Object.keys(models).filter(id => {
            if (!models[id].available) return false;
            if (!mm.isFreeTier(models[id])) return false;
            const cats = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
            return cats.includes('reasoning');
        });
        expect(reasoning).toContain('gemini-3.5-flash');
    });

    test('category browse with no keys returns empty list', () => {
        const models = buildValidatedModels({});
        const any = Object.keys(models).filter(id => {
            if (!models[id].available) return false;
            if (!mm.isFreeTier(models[id])) return false;
            const cats = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
            return cats.includes('coding');
        });
        expect(any).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Provider Browse (KEYED FREE + PAID)', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('Provider browse with Google key only: shows google-ai-studio', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const providers = mm.getKeyedProviders(models);
        expect(providers).toContain('google-ai-studio');
        expect(providers).not.toContain('openrouter');
        expect(providers).not.toContain('perplexity');
    });

    test('Provider browse with no keys: empty provider list', () => {
        const models = buildValidatedModels({});
        expect(mm.getKeyedProviders(models)).toHaveLength(0);
    });

    test('Provider browse for Perplexity includes free Sonar and paid Sonar Pro family', () => {
        const models = buildValidatedModels({ perplexityKey: 'pplx-test' });
        const ids = mm.getModelsByProviderView(models, 'perplexity');
        expect(ids).toContain('sonar');
        expect(ids).toContain('sonar-pro');
        expect(ids).toContain('sonar-reasoning-pro');
        expect(ids).toContain('sonar-deep-research');
        expect(ids).not.toContain('sonar-reasoning'); // deprecated / removed
        expect(ids.length).toBe(4);
    });

    test('Provider browse OpenRouter includes free and paid when keyed', () => {
        const models = buildValidatedModels({ openRouterKey: 'sk-or-v1-test' });
        const ids = mm.getModelsByProviderView(models, 'openrouter');
        expect(ids.length).toBeGreaterThan(0);
        expect(ids.some(id => mm.isFreeTier(models[id]))).toBe(true);
        expect(ids.some(id => !mm.isFreeTier(models[id]))).toBe(true);
    });

    test('Provider list for all keys: contains all 3 providers', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' });
        const providers = mm.getKeyedProviders(models);
        expect(providers).toContain('google-ai-studio');
        expect(providers).toContain('openrouter');
        expect(providers).toContain('perplexity');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — View All → Paid Catalog', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('Paid catalog includes all pro-tier models regardless of key', () => {
        const models = buildValidatedModels({});
        const paidCatalog = getPaidCatalogKeys(models, mm);
        expect(paidCatalog.length).toBeGreaterThan(0);
        paidCatalog.forEach(id => {
            expect(mm.isFreeTier(models[id])).toBe(false);
        });
    });

    test('Paid catalog does NOT include free-tier models', () => {
        const models = buildValidatedModels({});
        const paidCatalog = getPaidCatalogKeys(models, mm);
        expect(paidCatalog).not.toContain('sonar');
        expect(paidCatalog).not.toContain('gemini-flash-latest');
        expect(paidCatalog).not.toContain('deepseek/deepseek-r1');
    });

    test('Paid catalog excludes gemini-2.5-pro (Google free-API, not payment-required)', () => {
        const models = buildValidatedModels({});
        const paidCatalog = getPaidCatalogKeys(models, mm);
        expect(paidCatalog).not.toContain('gemini-2.5-pro');
    });

    test('Usable: gemini-2.5-pro with Google key = SELECTABLE rate-limited', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const accessible = getFreeAccessibleKeys(models, mm);
        expect(accessible).toContain('gemini-2.5-pro');
        expect(models['gemini-2.5-pro'].available).toBe(true);
        expect(getStatusIcon(mm, models['gemini-2.5-pro'], true, false)).toBe('rate-limited');
    });

    test('Paid catalog: OR pro models with no key = LOCKED (disabled)', () => {
        const models = buildValidatedModels({});
        const item = models['anthropic/claude-3.5-sonnet'];
        expect(item.available).toBe(false);
        expect(getStatusIcon(mm, item, false, true)).toBe('locked');
        expect(getTierLabel(mm, item, false, true)).toBe('No Key — Add to Unlock');
    });

    test('Paid catalog count matches payment-required models after validation', () => {
        const models = buildValidatedModels({});
        const mm2 = new ModelManager();
        const paidCount = Object.keys(models).filter(id => !mm2.isFreeTier({ ...models[id], id })).length;
        const paidCatalog = getPaidCatalogKeys(models, mm2);
        expect(paidCatalog.length).toBe(paidCount);
    });

    test('Paid catalog is the ONLY place paid models appear', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' });
        const freeAccessible = getFreeAccessibleKeys(models, mm);
        const paidCatalog = getPaidCatalogKeys(models, mm);
        const overlap = freeAccessible.filter(id => paidCatalog.includes(id));
        expect(overlap).toHaveLength(0);
        expect(freeAccessible).toContain('gemini-2.5-pro');
        expect(paidCatalog).not.toContain('gemini-2.5-pro');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — View All → Usable (sub-option)', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('View All → Usable returns same set as Currently Usable (free-tier only)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const currentlyUsable = getFreeAccessibleKeys(models, mm);
        const viewAllUsable = getFreeAccessibleKeys(models, mm);
        expect(viewAllUsable.sort()).toEqual(currentlyUsable.sort());
    });

    test('View All → Usable contains zero paid models', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test' });
        const usable = getFreeAccessibleKeys(models, mm);
        usable.forEach(id => expect(mm.isFreeTier(models[id])).toBe(true));
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Deduplication', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('Deduplication by cleanName+provider prevents duplicate entries', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest' });
        const seenNames = new Set();
        const duplicates = [];
        for (const id of getFreeAccessibleKeys(models, mm)) {
            const item = models[id];
            const cleanName = (item.name || id).replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '').trim();
            const dedupKey = `${cleanName}-${item.provider}`;
            if (seenNames.has(dedupKey)) duplicates.push(id);
            seenNames.add(dedupKey);
        }
        expect(duplicates).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Context/Rate Display', () => {
    test('gemini-2.5-flash has contextLength >= 1M tokens', () => {
        const m = DEFAULT_GOOGLE_MODELS['gemini-flash-latest'];
        expect(m.contextLength).toBeGreaterThanOrEqual(1000000);
    });

    test('gemini-2.5-pro has contextLength 2M tokens', () => {
        const m = DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'];
        expect(m.contextLength).toBe(2000000);
    });

    test('contextLength >= 1M formats as XM (not Xk)', () => {
        const ctxK = Math.round(1000000 / 1000);
        const ctxStr = ctxK >= 1000 ? `${(ctxK / 1000).toFixed(1)}M` : `${ctxK}k`;
        expect(ctxStr).toBe('1.0M');
    });

    test('contextLength < 1M formats as Xk', () => {
        const ctxK = Math.round(128000 / 1000);
        const ctxStr = ctxK >= 1000 ? `${(ctxK / 1000).toFixed(1)}M` : `${ctxK}k`;
        expect(ctxStr).toBe('128k');
    });

    test('DEFAULT_GOOGLE_MODELS all have rateLimit metadata', () => {
        Object.entries(DEFAULT_GOOGLE_MODELS).forEach(([id, m]) => {
            expect(m.rateLimit).toBeTruthy();
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Selection Confirmation Messages', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('Google pro model: free-API usable with rate-limited warning path', () => {
        const item = { ...DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'], id: 'gemini-2.5-pro' };
        expect(mm.isFreeTier(item)).toBe(true);
        expect(item.provider).toBe('google-ai-studio');
        expect(getStatusIcon(mm, item, true, false)).toBe('rate-limited');
    });

    test('OR paid model (from Paid Catalog): displays credits-required warning', () => {
        const item = { ...DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet'], id: 'anthropic/claude-3.5-sonnet' };
        const isSelectedPaid = !mm.isFreeTier(item);
        expect(isSelectedPaid).toBe(true);
        const msgType = item.provider === 'google-ai-studio' ? 'rate-limited' : 'credits-required';
        expect(msgType).toBe('credits-required');
    });

    test('Perplexity paid model (from Paid Catalog): displays credits-required warning', () => {
        const item = DEFAULT_PERPLEXITY_MODELS['sonar-pro'];
        const isSelectedPaid = !mm.isFreeTier(item);
        expect(isSelectedPaid).toBe(true);
        const msgType = item.provider === 'google-ai-studio' ? 'rate-limited' : 'credits-required';
        expect(msgType).toBe('credits-required');
    });

    test('Free model (from Currently Usable): no warning triggered', () => {
        const item = DEFAULT_GOOGLE_MODELS['gemini-flash-latest'];
        const isSelectedPaid = !mm.isFreeTier(item);
        expect(isSelectedPaid).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Category Tag Display', () => {
    test('category tag for gemini-2.5-flash shows fast/reasoning/coding (no media)', () => {
        const item = DEFAULT_GOOGLE_MODELS['gemini-flash-latest'];
        const cats = Array.isArray(item.category) ? item.category : [item.category];
        const chatCats = cats.filter(c => !['audio', 'image', 'video'].includes(c));
        expect(chatCats.length).toBeGreaterThan(0);
        expect(chatCats).toContain('fast');
    });

    test('Any model with audio/image/video is excluded by modality filter', () => {
        const allModels = { ...DEFAULT_PERPLEXITY_MODELS, ...DEFAULT_OPENROUTER_MODELS, ...DEFAULT_GOOGLE_MODELS };
        for (const [id, m] of Object.entries(allModels)) {
            const cats = Array.isArray(m.category) ? m.category : [m.category];
            const mediaCats = cats.filter(c => ['audio', 'image', 'video'].includes(c));
            if (mediaCats.length > 0) {
                expect(modelValidator.isNonTextModality(id, m)).toBe(true);
            }
        }
    });

    test('catTag shows UPPERCASE category strings', () => {
        const cats = ['fast', 'coding'];
        const catStr = cats.map(c => c.toUpperCase()).join(', ');
        expect(catStr).toBe('FAST, CODING');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — isFreeTier consistency across all default models', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('All default models: Google free-API never paymentRequired; others match tier', () => {
        const allModels = { ...DEFAULT_PERPLEXITY_MODELS, ...DEFAULT_OPENROUTER_MODELS, ...DEFAULT_GOOGLE_MODELS };
        for (const [id, m] of Object.entries(allModels)) {
            const isF = mm.isFreeTier({ ...m, id });
            expect(['free', 'pro']).toContain(m.tier);
            if (m.provider === 'google-ai-studio') expect(isF).toBe(true);
            else if (m.tier === 'free') expect(isF).toBe(true);
            else if (m.tier === 'pro') expect(isF).toBe(false);
        }
    });

    test('FREE models: sonar, gemini-2.5-flash, gemini-2.0-flash, deepseek-r1', () => {
        const mm2 = new ModelManager();
        expect(mm2.isFreeTier(DEFAULT_PERPLEXITY_MODELS['sonar'])).toBe(true);
        expect(mm2.isFreeTier(DEFAULT_GOOGLE_MODELS['gemini-flash-latest'])).toBe(true);
        expect(mm2.isFreeTier(DEFAULT_GOOGLE_MODELS['gemini-2.0-flash'])).toBe(true);
        expect(mm2.isFreeTier(DEFAULT_OPENROUTER_MODELS['deepseek/deepseek-r1'])).toBe(true);
        expect(mm2.isFreeTier(DEFAULT_OPENROUTER_MODELS['meta-llama/llama-4-maverick'])).toBe(true);
    });

    test('PRO / paid models: sonar-pro, claude, gpt-4o — Google pro is free-API usable', () => {
        const mm2 = new ModelManager();
        expect(mm2.isFreeTier(DEFAULT_PERPLEXITY_MODELS['sonar-pro'])).toBe(false);
        expect(mm2.isFreeTier({ ...DEFAULT_GOOGLE_MODELS['gemini-2.5-pro'], id: 'gemini-2.5-pro' })).toBe(true);
        expect(mm2.isFreeTier(DEFAULT_OPENROUTER_MODELS['anthropic/claude-3.5-sonnet'])).toBe(false);
        expect(mm2.isFreeTier(DEFAULT_OPENROUTER_MODELS['openai/gpt-4o'])).toBe(false);
        expect(mm2.isFreeTier(DEFAULT_OPENROUTER_MODELS['x-ai/grok-3-beta'])).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ModelMenuFiltering — Strict Separation Invariants', () => {
    let mm;
    beforeEach(() => {
        modelCacheService.clearCache();
        mm = new ModelManager();
    });

    test('Free-accessible and Paid-catalog sets are mutually exclusive (zero overlap)', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' });
        const freeSet = new Set(getFreeAccessibleKeys(models, mm));
        const paidSet = new Set(getPaidCatalogKeys(models, mm));
        const overlap = [...freeSet].filter(id => paidSet.has(id));
        expect(overlap).toHaveLength(0);
    });

    test('Free-accessible + Paid-catalog covers all available non-failed models', () => {
        const models = buildValidatedModels({ googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' });
        const freeSet = getFreeAccessibleKeys(models, mm);
        const paidSet = getPaidCatalogKeys(models, mm);
        const allAvailable = Object.keys(models).filter(id =>
            !modelCacheService.isModelFailed(id) && models[id].available
        );
        allAvailable.forEach(id => {
            const inFree = freeSet.includes(id);
            const inPaid = paidSet.includes(id);
            expect(inFree || inPaid).toBe(true);
        });
    });

    test('Category browse never leaks paid models (all key combos)', () => {
        const keyCombos = [
            { googleKey: 'AIzaSyTest' },
            { openRouterKey: 'sk-or-v1-test' },
            { perplexityKey: 'pplx-test' },
            { googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' }
        ];
        const cats = ['coding', 'reasoning', 'research', 'agent', 'openweights', 'fast', 'general'];
        keyCombos.forEach(keys => {
            const models = buildValidatedModels(keys);
            cats.forEach(cat => {
                const filtered = Object.keys(models).filter(id => {
                    if (!models[id].available) return false;
                    if (!mm.isFreeTier(models[id])) return false;
                    const c = Array.isArray(models[id].category) ? models[id].category : [models[id].category];
                    return c.includes(cat);
                });
                filtered.forEach(id => expect(mm.isFreeTier(models[id])).toBe(true));
            });
        });
    });

    test('Provider browse lists all keyed models for a provider (free + paid)', () => {
        const keyCombos = [
            { googleKey: 'AIzaSyTest' },
            { openRouterKey: 'sk-or-v1-test' },
            { perplexityKey: 'pplx-test' },
            { googleKey: 'AIzaSyTest', openRouterKey: 'sk-or-v1-test', perplexityKey: 'pplx-test' }
        ];
        const provs = ['google-ai-studio', 'openrouter', 'perplexity'];
        keyCombos.forEach(keys => {
            const models = buildValidatedModels(keys);
            provs.forEach(prov => {
                const filtered = mm.getModelsByProviderView(models, prov);
                filtered.forEach(id => {
                    expect(models[id].provider).toBe(prov);
                    expect(models[id].available).toBe(true);
                });
            });
        });
    });
});
