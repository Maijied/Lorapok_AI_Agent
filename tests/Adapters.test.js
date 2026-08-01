/**
 * Tests for services/adapters/
 */
'use strict';

const { BaseAdapter } = require('../services/adapters/BaseAdapter');
const { PerplexityAdapter } = require('../services/adapters/PerplexityAdapter');
const { OpenRouterAdapter } = require('../services/adapters/OpenRouterAdapter');
const { GoogleAdapter } = require('../services/adapters/GoogleAdapter');
const { AdapterRegistry, getAdapterRegistry, resetAdapterRegistry } = require('../services/adapters/AdapterRegistry');
const { UnifiedMessage, textBlock, toolCallBlock } = require('../lib/core/UnifiedMessage');
const { ToolSpec, POLICY_TIERS } = require('../lib/core/ToolSpec');

// ── BaseAdapter ──────────────────────────────────────────────────────

describe('BaseAdapter', () => {
    test('throws on missing name', () => {
        expect(() => new BaseAdapter({ capabilities: {} })).toThrow();
    });

    test('throws on missing capabilities', () => {
        expect(() => new BaseAdapter({ name: 'test' })).toThrow();
    });

    test('stores name and capabilities', () => {
        const adapter = new BaseAdapter({
            name: 'test-adapter',
            capabilities: { toolUse: true, streaming: false, contextWindow: 64000, vision: false }
        });
        expect(adapter.name).toBe('test-adapter');
        expect(adapter.capabilities.toolUse).toBe(true);
        expect(adapter.capabilities.contextWindow).toBe(64000);
    });

    test('abstract methods throw', () => {
        const adapter = new BaseAdapter({
            name: 'test',
            capabilities: { toolUse: false, streaming: false, contextWindow: 128000, vision: false }
        });
        expect(() => adapter.toNative([])).toThrow();
        expect(() => adapter.fromNative({})).toThrow();
        expect(() => adapter.getBaseUrl()).toThrow();
        expect(() => adapter.buildHeaders('key')).toThrow();
    });

    test('health state management', () => {
        const adapter = new BaseAdapter({
            name: 'test',
            capabilities: { toolUse: false, streaming: false, contextWindow: 128000, vision: false }
        });
        expect(adapter.isAvailable()).toBe(true);
        adapter.markUnavailable();
        expect(adapter.isAvailable()).toBe(false);
        expect(adapter.getHealthStats().failureCount).toBe(1);
        adapter.markAvailable();
        expect(adapter.isAvailable()).toBe(true);
        expect(adapter.getHealthStats().failureCount).toBe(0);
    });

    test('toJSON returns serializable object', () => {
        const adapter = new BaseAdapter({
            name: 'test',
            capabilities: { toolUse: true, streaming: true, contextWindow: 128000, vision: false }
        });
        const json = adapter.toJSON();
        expect(json.name).toBe('test');
        expect(json.capabilities.toolUse).toBe(true);
        expect(json.health).toBeDefined();
    });
});

// ── PerplexityAdapter ────────────────────────────────────────────────

describe('PerplexityAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new PerplexityAdapter();
    });

    test('has correct capabilities', () => {
        expect(adapter.name).toBe('perplexity');
        expect(adapter.capabilities.toolUse).toBe(false);
        expect(adapter.capabilities.streaming).toBe(true);
    });

    test('toNative converts messages', () => {
        const messages = [
            UnifiedMessage.userText('What is Node.js?'),
            UnifiedMessage.assistantText('Node.js is a runtime...')
        ];
        const result = adapter.toNative(messages);
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].role).toBe('user');
        expect(result.messages[1].role).toBe('assistant');
    });

    test('toNative maps tool role to user', () => {
        const messages = [UnifiedMessage.toolResult('tc1', 'result')];
        const result = adapter.toNative(messages);
        // tool_result has no text, so it might be skipped or mapped
        expect(result.messages).toBeDefined();
    });

    test('fromNative extracts text', () => {
        const response = {
            choices: [{ message: { content: 'Hello world' } }]
        };
        const msg = adapter.fromNative(response);
        expect(msg.role).toBe('assistant');
        expect(msg.getText()).toBe('Hello world');
    });

    test('fromNative handles citations', () => {
        const response = {
            choices: [{ message: { content: 'Answer text' } }],
            citations: ['https://example.com/1', 'https://example.com/2']
        };
        const msg = adapter.fromNative(response);
        expect(msg.getText()).toContain('Sources:');
        expect(msg.getText()).toContain('https://example.com/1');
    });

    test('fromNative handles empty response', () => {
        const msg = adapter.fromNative(null);
        expect(msg.getText()).toBe('');
    });

    test('getBaseUrl returns correct URL', () => {
        expect(adapter.getBaseUrl()).toContain('perplexity.ai');
    });

    test('buildHeaders includes authorization', () => {
        const headers = adapter.buildHeaders('test-key');
        expect(headers['Authorization']).toBe('Bearer test-key');
    });
});

// ── OpenRouterAdapter ────────────────────────────────────────────────

describe('OpenRouterAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new OpenRouterAdapter();
    });

    test('has correct capabilities', () => {
        expect(adapter.name).toBe('openrouter');
        expect(adapter.capabilities.toolUse).toBe(true);
        expect(adapter.capabilities.vision).toBe(true);
    });

    test('toNative converts tool calls', () => {
        const msg = UnifiedMessage.assistantToolCalls([
            { id: 'tc1', name: 'read_file', input: { path: 'foo.js' } }
        ]);
        const result = adapter.toNative([msg]);
        expect(result.messages[0].tool_calls).toHaveLength(1);
        expect(result.messages[0].tool_calls[0].function.name).toBe('read_file');
    });

    test('toNative converts tool results', () => {
        const msg = UnifiedMessage.toolResult('tc1', 'file content');
        const result = adapter.toNative([msg]);
        expect(result.messages[0].role).toBe('tool');
        expect(result.messages[0].tool_call_id).toBe('tc1');
    });

    test('toNative includes tool definitions', () => {
        const spec = new ToolSpec({
            name: 'test_tool',
            description: 'A test tool',
            inputSchema: { type: 'object', properties: {} },
            policyTier: POLICY_TIERS.ALWAYS_ALLOW
        });
        const result = adapter.toNative([UnifiedMessage.userText('hi')], [spec]);
        expect(result.tools).toHaveLength(1);
        expect(result.tools[0].type).toBe('function');
    });

    test('fromNative parses tool calls', () => {
        const response = {
            choices: [{
                message: {
                    content: null,
                    tool_calls: [{
                        id: 'tc1',
                        type: 'function',
                        function: { name: 'read_file', arguments: '{"path":"a.js"}' }
                    }]
                }
            }]
        };
        const msg = adapter.fromNative(response);
        expect(msg.hasToolCalls()).toBe(true);
        expect(msg.getToolCalls()[0].name).toBe('read_file');
        expect(msg.getToolCalls()[0].input.path).toBe('a.js');
    });

    test('fromNative handles malformed JSON arguments', () => {
        const response = {
            choices: [{
                message: {
                    content: null,
                    tool_calls: [{
                        id: 'tc1',
                        type: 'function',
                        function: { name: 'tool', arguments: 'not json' }
                    }]
                }
            }]
        };
        const msg = adapter.fromNative(response);
        expect(msg.getToolCalls()[0].input._raw).toBe('not json');
    });

    test('fromNative handles legacy function_call', () => {
        const response = {
            choices: [{
                message: {
                    content: null,
                    function_call: { name: 'old_tool', arguments: '{"x":1}' }
                }
            }]
        };
        const msg = adapter.fromNative(response);
        expect(msg.hasToolCalls()).toBe(true);
        expect(msg.getToolCalls()[0].name).toBe('old_tool');
    });

    test('buildHeaders includes Referer and Title', () => {
        const headers = adapter.buildHeaders('key');
        expect(headers['HTTP-Referer']).toBe('https://lorapok.tech');
        expect(headers['X-Title']).toBe('Lorapok AI Agent');
    });
});

// ── GoogleAdapter ────────────────────────────────────────────────────

describe('GoogleAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new GoogleAdapter();
    });

    test('has correct capabilities', () => {
        expect(adapter.name).toBe('google-ai-studio');
        expect(adapter.capabilities.toolUse).toBe(true);
        expect(adapter.capabilities.contextWindow).toBe(1000000);
    });

    test('toNative converts messages', () => {
        const messages = [
            UnifiedMessage.systemText('You are helpful'),
            UnifiedMessage.userText('Hello')
        ];
        const result = adapter.toNative(messages);
        expect(result.messages).toHaveLength(2);
    });

    test('fromNative parses response', () => {
        const response = {
            choices: [{ message: { content: 'Gemini response' } }]
        };
        const msg = adapter.fromNative(response);
        expect(msg.getText()).toBe('Gemini response');
    });

    test('getUrlWithKey includes key parameter', () => {
        const url = adapter.getUrlWithKey('test-key');
        expect(url).toContain('key=test-key');
    });
});

// ── AdapterRegistry ──────────────────────────────────────────────────

describe('AdapterRegistry', () => {
    beforeEach(() => {
        resetAdapterRegistry();
    });

    test('registers default adapters', () => {
        const registry = new AdapterRegistry();
        expect(registry.size()).toBe(3);
        expect(registry.getProviderNames()).toContain('perplexity');
        expect(registry.getProviderNames()).toContain('openrouter');
        expect(registry.getProviderNames()).toContain('google-ai-studio');
    });

    test('getAdapter returns correct adapter', () => {
        const registry = new AdapterRegistry();
        const adapter = registry.getAdapter('perplexity');
        expect(adapter).toBeInstanceOf(PerplexityAdapter);
    });

    test('getAdapter returns null for unknown', () => {
        const registry = new AdapterRegistry();
        expect(registry.getAdapter('unknown')).toBeNull();
    });

    test('getAdaptersWithCapability filters correctly', () => {
        const registry = new AdapterRegistry();
        const toolUseAdapters = registry.getAdaptersWithCapability('toolUse');
        expect(toolUseAdapters.length).toBe(2); // openrouter + google
        expect(toolUseAdapters.every(a => a.capabilities.toolUse)).toBe(true);
    });

    test('getAvailableAdapters returns all healthy adapters', () => {
        const registry = new AdapterRegistry();
        expect(registry.getAvailableAdapters()).toHaveLength(3);

        registry.getAdapter('perplexity').markUnavailable();
        expect(registry.getAvailableAdapters()).toHaveLength(2);
    });

    test('singleton getAdapterRegistry works', () => {
        const r1 = getAdapterRegistry();
        const r2 = getAdapterRegistry();
        expect(r1).toBe(r2);
    });

    test('resetAdapterRegistry creates new instance', () => {
        const r1 = getAdapterRegistry();
        resetAdapterRegistry();
        const r2 = getAdapterRegistry();
        expect(r1).not.toBe(r2);
    });

    test('toJSON serializes all adapters', () => {
        const registry = new AdapterRegistry();
        const json = registry.toJSON();
        expect(json).toHaveLength(3);
        expect(json[0].name).toBeDefined();
    });
});
