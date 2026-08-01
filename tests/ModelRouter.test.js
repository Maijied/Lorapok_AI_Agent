/**
 * Tests for services/ModelRouter.js
 */
'use strict';

const { ModelRouter, SELECTION_MODES, TASK_TAGS, DEFAULT_WEIGHTS } = require('../services/ModelRouter');
const { ProviderUnavailableError } = require('../lib/errors');

describe('ModelRouter', () => {
    const createProfiles = () => ({
        'gpt-4o': {
            strengths: ['code_gen', 'tool_use', 'reasoning'],
            costPerMTokIn: 2.50,
            latencyClass: 'standard',
            contextWindow: 128000,
            modality: 'multimodal',
            availability: 'online'
        },
        'claude-3-5-sonnet': {
            strengths: ['code_gen', 'reasoning', 'tool_use', 'analysis'],
            costPerMTokIn: 3.00,
            latencyClass: 'standard',
            contextWindow: 200000,
            modality: 'multimodal',
            availability: 'online'
        },
        'gemini-2.5-pro': {
            strengths: ['code_gen', 'reasoning', 'planning', 'tool_use'],
            costPerMTokIn: 1.25,
            latencyClass: 'fast',
            contextWindow: 1000000,
            modality: 'multimodal',
            availability: 'online'
        },
        'sonar-pro': {
            strengths: ['web_grounding', 'summarization'],
            costPerMTokIn: 3.00,
            latencyClass: 'standard',
            contextWindow: 127000,
            modality: 'text',
            availability: 'online'
        },
        'cheap-model': {
            strengths: ['classification', 'fast_response'],
            costPerMTokIn: 0.0,
            latencyClass: 'fast',
            contextWindow: 32000,
            modality: 'text',
            availability: 'online'
        },
        'down-model': {
            strengths: ['code_gen'],
            costPerMTokIn: 0.50,
            latencyClass: 'fast',
            contextWindow: 128000,
            modality: 'text',
            availability: 'down'
        }
    });

    let router;
    let profiles;

    beforeEach(() => {
        router = new ModelRouter();
        profiles = createProfiles();
    });

    // ── Auto Selection ───────────────────────────────────────────────

    describe('auto selection', () => {
        test('selects a model for code generation', () => {
            const result = router.select({
                taskTags: ['code_gen', 'tool_use'],
                estimatedTokens: 5000,
                modelProfiles: profiles
            });
            expect(result.modelId).toBeDefined();
            expect(result.score).toBeGreaterThan(0);
        });

        test('selects web-grounding model for web tasks', () => {
            const result = router.select({
                taskTags: ['web_grounding'],
                estimatedTokens: 2000,
                modelProfiles: profiles
            });
            expect(result.modelId).toBe('sonar-pro');
        });

        test('excludes down models', () => {
            const result = router.select({
                taskTags: ['code_gen'],
                estimatedTokens: 1000,
                modelProfiles: profiles
            });
            expect(result.modelId).not.toBe('down-model');
        });

        test('excludes models with insufficient context', () => {
            const result = router.select({
                taskTags: ['code_gen'],
                estimatedTokens: 900000, // only gemini-2.5-pro can handle this
                modelProfiles: profiles
            });
            expect(result.modelId).toBe('gemini-2.5-pro');
        });

        test('throws when no candidates match', () => {
            expect(() => router.select({
                taskTags: ['nonexistent_capability'],
                estimatedTokens: 2000000000, // nothing can handle
                modelProfiles: profiles
            })).toThrow(ProviderUnavailableError);
        });
    });

    // ── Manual Selection ─────────────────────────────────────────────

    describe('manual selection', () => {
        test('uses pinned model', () => {
            router.setMode(SELECTION_MODES.MANUAL);
            router.pinModel('claude-3-5-sonnet');
            const result = router.select({
                taskTags: ['code_gen'],
                estimatedTokens: 1000,
                modelProfiles: profiles
            });
            expect(result.modelId).toBe('claude-3-5-sonnet');
            expect(result.reason).toBe('User-pinned model');
        });

        test('falls back to scoring if pinned model is down', () => {
            router.setMode(SELECTION_MODES.MANUAL);
            router.pinModel('down-model');
            const result = router.select({
                taskTags: ['code_gen'],
                estimatedTokens: 1000,
                modelProfiles: profiles
            });
            expect(result.modelId).not.toBe('down-model');
        });

        test('preferredModel overrides pinned', () => {
            router.setMode(SELECTION_MODES.MANUAL);
            router.pinModel('gpt-4o');
            const result = router.select({
                taskTags: ['code_gen'],
                estimatedTokens: 1000,
                modelProfiles: profiles,
                preferredModel: 'gemini-2.5-pro'
            });
            expect(result.modelId).toBe('gemini-2.5-pro');
        });
    });

    // ── Failure Tracking ─────────────────────────────────────────────

    describe('failure tracking', () => {
        test('recording failure increases penalty', () => {
            router.recordFailure('gpt-4o');
            const stats = router.getFailureStats();
            expect(stats['gpt-4o'].failures).toBe(1);
        });

        test('recording success resets failures', () => {
            router.recordFailure('gpt-4o');
            router.recordSuccess('gpt-4o');
            const stats = router.getFailureStats();
            expect(stats['gpt-4o']).toBeUndefined();
        });

        test('resetFailures clears all tracking', () => {
            router.recordFailure('gpt-4o');
            router.recordFailure('claude-3-5-sonnet');
            router.resetFailures();
            expect(Object.keys(router.getFailureStats())).toHaveLength(0);
        });

        test('multiple failures increase penalty', () => {
            router.recordFailure('gpt-4o');
            router.recordFailure('gpt-4o');
            router.recordFailure('gpt-4o');

            // Score with penalty should be lower
            const resultWithPenalty = router.select({
                taskTags: ['code_gen'],
                estimatedTokens: 1000,
                modelProfiles: { 'gpt-4o': profiles['gpt-4o'], 'gemini-2.5-pro': profiles['gemini-2.5-pro'] }
            });
            // Gemini should win due to gpt-4o penalty
            expect(resultWithPenalty.modelId).toBe('gemini-2.5-pro');
        });
    });

    // ── Mode Management ──────────────────────────────────────────────

    describe('mode management', () => {
        test('setMode updates mode', () => {
            router.setMode(SELECTION_MODES.ON_DEMAND);
            expect(router.mode).toBe('on_demand');
        });

        test('setMode throws on invalid mode', () => {
            expect(() => router.setMode('invalid')).toThrow();
        });

        test('pinModel sets the pinned model', () => {
            router.pinModel('gpt-4o');
            expect(router.pinnedModel).toBe('gpt-4o');
        });
    });

    // ── Constants ────────────────────────────────────────────────────

    describe('constants', () => {
        test('SELECTION_MODES has expected values', () => {
            expect(SELECTION_MODES.MANUAL).toBe('manual');
            expect(SELECTION_MODES.AUTO).toBe('auto');
            expect(SELECTION_MODES.ON_DEMAND).toBe('on_demand');
        });

        test('TASK_TAGS has expected tags', () => {
            expect(TASK_TAGS.has('code_gen')).toBe(true);
            expect(TASK_TAGS.has('web_grounding')).toBe(true);
            expect(TASK_TAGS.has('tool_use')).toBe(true);
        });

        test('DEFAULT_WEIGHTS sum to 1.0', () => {
            const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 5);
        });
    });
});
