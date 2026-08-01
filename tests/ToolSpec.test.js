/**
 * Tests for lib/core/ToolSpec.js
 */
'use strict';

const { ToolSpec, POLICY_TIERS, VALID_POLICY_TIERS, stripUnsupportedFields } = require('../lib/core/ToolSpec');
const { ValidationError } = require('../lib/errors');

describe('ToolSpec', () => {
    const validOptions = {
        name: 'read_file',
        description: 'Read a file',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string' }
            },
            required: ['path']
        },
        policyTier: 'always_allow'
    };

    describe('constructor', () => {
        test('creates a valid ToolSpec', () => {
            const spec = new ToolSpec(validOptions);
            expect(spec.name).toBe('read_file');
            expect(spec.policyTier).toBe('always_allow');
            expect(spec.mutatesState).toBe(false);
        });

        test('defaults to confirm tier', () => {
            const spec = new ToolSpec({
                name: 'custom_tool',
                description: 'desc',
                inputSchema: { type: 'object', properties: {} }
            });
            expect(spec.policyTier).toBe('confirm');
        });

        test('sets requiresNetwork and mutatesState', () => {
            const spec = new ToolSpec({
                ...validOptions,
                requiresNetwork: true,
                mutatesState: true
            });
            expect(spec.requiresNetwork).toBe(true);
            expect(spec.mutatesState).toBe(true);
        });

        test('throws on missing name', () => {
            expect(() => new ToolSpec({
                description: 'desc',
                inputSchema: {}
            })).toThrow(ValidationError);
        });

        test('throws on missing description', () => {
            expect(() => new ToolSpec({
                name: 'tool',
                inputSchema: {}
            })).toThrow(ValidationError);
        });

        test('throws on missing inputSchema', () => {
            expect(() => new ToolSpec({
                name: 'tool',
                description: 'desc'
            })).toThrow(ValidationError);
        });

        test('throws on invalid policyTier', () => {
            expect(() => new ToolSpec({
                ...validOptions,
                policyTier: 'invalid_tier'
            })).toThrow(ValidationError);
        });

        test('throws on null options', () => {
            expect(() => new ToolSpec(null)).toThrow(ValidationError);
        });
    });

    describe('validateInput', () => {
        test('valid input passes', () => {
            const spec = new ToolSpec(validOptions);
            const result = spec.validateInput({ path: '/foo/bar.js' });
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('missing required field fails', () => {
            const spec = new ToolSpec(validOptions);
            const result = spec.validateInput({});
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing required field: "path"');
        });

        test('wrong type fails', () => {
            const spec = new ToolSpec(validOptions);
            const result = spec.validateInput({ path: 123 });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('expected type'))).toBe(true);
        });

        test('null input fails', () => {
            const spec = new ToolSpec(validOptions);
            const result = spec.validateInput(null);
            expect(result.valid).toBe(false);
        });

        test('handles schema without properties gracefully', () => {
            const spec = new ToolSpec({
                name: 'simple',
                description: 'desc',
                inputSchema: { type: 'string' }
            });
            const result = spec.validateInput({ any: 'thing' });
            expect(result.valid).toBe(true); // no properties to check
        });
    });

    describe('serialization', () => {
        test('toJSON returns plain object', () => {
            const spec = new ToolSpec(validOptions);
            const json = spec.toJSON();
            expect(json.name).toBe('read_file');
            expect(json.policyTier).toBe('always_allow');
        });

        test('fromJSON roundtrip', () => {
            const spec = new ToolSpec(validOptions);
            const restored = ToolSpec.fromJSON(spec.toJSON());
            expect(restored.name).toBe(spec.name);
            expect(restored.policyTier).toBe(spec.policyTier);
        });
    });

    describe('toProviderSchema', () => {
        test('openai format', () => {
            const spec = new ToolSpec(validOptions);
            const schema = spec.toProviderSchema('openai');
            expect(schema.name).toBe('read_file');
            expect(schema.parameters).toEqual(validOptions.inputSchema);
        });

        test('google format strips unsupported fields', () => {
            const specOpts = {
                ...validOptions,
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', default: '/tmp', examples: ['a.js'] }
                    }
                }
            };
            const spec = new ToolSpec(specOpts);
            const schema = spec.toProviderSchema('google');
            expect(schema.parameters.properties.path.default).toBeUndefined();
            expect(schema.parameters.properties.path.examples).toBeUndefined();
        });
    });

    describe('POLICY_TIERS', () => {
        test('contains expected tiers', () => {
            expect(POLICY_TIERS.ALWAYS_ALLOW).toBe('always_allow');
            expect(POLICY_TIERS.ALLOWLIST).toBe('allowlist');
            expect(POLICY_TIERS.CONFIRM).toBe('confirm');
            expect(POLICY_TIERS.DENY).toBe('deny');
        });

        test('VALID_POLICY_TIERS is complete', () => {
            expect(VALID_POLICY_TIERS.size).toBe(4);
        });
    });

    describe('stripUnsupportedFields', () => {
        test('removes specified fields', () => {
            const result = stripUnsupportedFields(
                { a: 1, b: 2, c: 3 },
                ['b']
            );
            expect(result).toEqual({ a: 1, c: 3 });
        });

        test('handles nested objects', () => {
            const result = stripUnsupportedFields(
                { outer: { inner: 1, remove: 2 } },
                ['remove']
            );
            expect(result.outer.remove).toBeUndefined();
            expect(result.outer.inner).toBe(1);
        });

        test('handles null/undefined input', () => {
            expect(stripUnsupportedFields(null, ['a'])).toBeNull();
        });
    });
});
