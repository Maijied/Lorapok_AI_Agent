/**
 * Tests for lib/core/UnifiedMessage.js
 */
'use strict';

const {
    UnifiedMessage,
    textBlock,
    toolCallBlock,
    toolResultBlock,
    validateBlock,
    estimateTokensForMessages,
    hashMessages,
    VALID_ROLES,
    VALID_BLOCK_TYPES
} = require('../lib/core/UnifiedMessage');

describe('UnifiedMessage', () => {
    // ── Content Block Factories ──────────────────────────────────────

    describe('textBlock', () => {
        test('creates a text content block', () => {
            const block = textBlock('hello world');
            expect(block).toEqual({ type: 'text', text: 'hello world' });
        });

        test('accepts empty string', () => {
            const block = textBlock('');
            expect(block).toEqual({ type: 'text', text: '' });
        });

        test('throws on non-string', () => {
            expect(() => textBlock(123)).toThrow(TypeError);
            expect(() => textBlock(null)).toThrow(TypeError);
        });
    });

    describe('toolCallBlock', () => {
        test('creates a tool_call content block', () => {
            const block = toolCallBlock('tc_1', 'read_file', { path: 'foo.js' });
            expect(block).toEqual({
                type: 'tool_call',
                id: 'tc_1',
                name: 'read_file',
                input: { path: 'foo.js' }
            });
        });

        test('accepts null input as empty object', () => {
            const block = toolCallBlock('tc_2', 'git_status', null);
            expect(block.input).toEqual({});
        });

        test('throws on missing id', () => {
            expect(() => toolCallBlock('', 'tool', {})).toThrow(TypeError);
        });

        test('throws on missing name', () => {
            expect(() => toolCallBlock('id', '', {})).toThrow(TypeError);
        });

        test('throws on invalid input type', () => {
            expect(() => toolCallBlock('id', 'tool', 'string')).toThrow(TypeError);
        });
    });

    describe('toolResultBlock', () => {
        test('creates a tool_result block', () => {
            const block = toolResultBlock('tc_1', 'file contents here');
            expect(block).toEqual({
                type: 'tool_result',
                tool_call_id: 'tc_1',
                output: 'file contents here',
                is_error: false
            });
        });

        test('creates error result', () => {
            const block = toolResultBlock('tc_1', 'not found', true);
            expect(block.is_error).toBe(true);
        });

        test('throws on missing toolCallId', () => {
            expect(() => toolResultBlock('', 'output')).toThrow(TypeError);
        });

        test('throws on non-string output', () => {
            expect(() => toolResultBlock('tc_1', 123)).toThrow(TypeError);
        });
    });

    // ── Validation ───────────────────────────────────────────────────

    describe('validateBlock', () => {
        test('validates text block', () => {
            expect(validateBlock({ type: 'text', text: 'hello' })).toBe(true);
        });

        test('validates tool_call block', () => {
            expect(validateBlock({ type: 'tool_call', id: 'tc', name: 'tool', input: {} })).toBe(true);
        });

        test('validates tool_result block', () => {
            expect(validateBlock({ type: 'tool_result', tool_call_id: 'tc', output: 'ok' })).toBe(true);
        });

        test('throws on invalid block type', () => {
            expect(() => validateBlock({ type: 'unknown' })).toThrow(TypeError);
        });

        test('throws on null', () => {
            expect(() => validateBlock(null)).toThrow(TypeError);
        });

        test('throws on text block with non-string text', () => {
            expect(() => validateBlock({ type: 'text', text: 123 })).toThrow(TypeError);
        });
    });

    // ── Constructor ──────────────────────────────────────────────────

    describe('constructor', () => {
        test('creates a valid message', () => {
            const msg = new UnifiedMessage('user', [textBlock('hello')]);
            expect(msg.role).toBe('user');
            expect(msg.content).toHaveLength(1);
        });

        test('throws on invalid role', () => {
            expect(() => new UnifiedMessage('invalid', [textBlock('hi')])).toThrow(TypeError);
        });

        test('throws on non-array content', () => {
            expect(() => new UnifiedMessage('user', 'text')).toThrow(TypeError);
        });

        test('validates all blocks in content', () => {
            expect(() => new UnifiedMessage('user', [{ type: 'bad' }])).toThrow(TypeError);
        });
    });

    // ── Factory Methods ──────────────────────────────────────────────

    describe('static factories', () => {
        test('userText creates user message', () => {
            const msg = UnifiedMessage.userText('hello');
            expect(msg.role).toBe('user');
            expect(msg.getText()).toBe('hello');
        });

        test('assistantText creates assistant message', () => {
            const msg = UnifiedMessage.assistantText('response');
            expect(msg.role).toBe('assistant');
            expect(msg.getText()).toBe('response');
        });

        test('systemText creates system message', () => {
            const msg = UnifiedMessage.systemText('instructions');
            expect(msg.role).toBe('system');
            expect(msg.getText()).toBe('instructions');
        });

        test('assistantToolCalls creates message with tool calls', () => {
            const msg = UnifiedMessage.assistantToolCalls([
                { id: 'tc1', name: 'read_file', input: { path: 'f.js' } }
            ]);
            expect(msg.role).toBe('assistant');
            expect(msg.hasToolCalls()).toBe(true);
            expect(msg.getToolCalls()).toHaveLength(1);
        });

        test('assistantToolCalls throws on empty array', () => {
            expect(() => UnifiedMessage.assistantToolCalls([])).toThrow(TypeError);
        });

        test('toolResult creates tool result message', () => {
            const msg = UnifiedMessage.toolResult('tc1', 'content here');
            expect(msg.role).toBe('tool');
            expect(msg.getToolResults()).toHaveLength(1);
        });
    });

    // ── Accessors ────────────────────────────────────────────────────

    describe('accessors', () => {
        test('getText concatenates text blocks', () => {
            const msg = new UnifiedMessage('assistant', [
                textBlock('line1'),
                textBlock('line2')
            ]);
            expect(msg.getText()).toBe('line1\nline2');
        });

        test('getText returns empty for non-text messages', () => {
            const msg = UnifiedMessage.toolResult('tc1', 'data');
            expect(msg.getText()).toBe('');
        });

        test('getToolCalls returns tool call blocks', () => {
            const msg = UnifiedMessage.assistantToolCalls([
                { id: 'a', name: 'tool1', input: {} },
                { id: 'b', name: 'tool2', input: {} }
            ]);
            expect(msg.getToolCalls()).toHaveLength(2);
        });

        test('hasToolCalls returns false for text-only messages', () => {
            const msg = UnifiedMessage.userText('hello');
            expect(msg.hasToolCalls()).toBe(false);
        });
    });

    // ── Serialization ────────────────────────────────────────────────

    describe('serialization', () => {
        test('toJSON and fromJSON roundtrip', () => {
            const original = UnifiedMessage.userText('roundtrip test');
            const json = original.toJSON();
            const restored = UnifiedMessage.fromJSON(json);
            expect(restored.role).toBe(original.role);
            expect(restored.getText()).toBe(original.getText());
        });

        test('fromJSON throws on null', () => {
            expect(() => UnifiedMessage.fromJSON(null)).toThrow(TypeError);
        });
    });

    // ── Token Estimation ─────────────────────────────────────────────

    describe('estimateTokens', () => {
        test('returns positive value for non-empty message', () => {
            const msg = UnifiedMessage.userText('hello world');
            expect(msg.estimateTokens()).toBeGreaterThan(0);
        });

        test('estimateTokensForMessages handles multiple messages', () => {
            const msgs = [
                UnifiedMessage.userText('first'),
                UnifiedMessage.assistantText('second')
            ];
            const tokens = estimateTokensForMessages(msgs);
            expect(tokens).toBeGreaterThan(0);
        });
    });

    // ── Hashing ──────────────────────────────────────────────────────

    describe('hashMessages', () => {
        test('returns consistent hash for same input', () => {
            const msgs = [UnifiedMessage.userText('hello')];
            const h1 = hashMessages(msgs);
            const h2 = hashMessages(msgs);
            expect(h1).toBe(h2);
            expect(h1).toHaveLength(64); // SHA-256 hex
        });

        test('returns different hash for different input', () => {
            const h1 = hashMessages([UnifiedMessage.userText('hello')]);
            const h2 = hashMessages([UnifiedMessage.userText('world')]);
            expect(h1).not.toBe(h2);
        });
    });

    // ── Constants ────────────────────────────────────────────────────

    describe('constants', () => {
        test('VALID_ROLES contains expected roles', () => {
            expect(VALID_ROLES.has('user')).toBe(true);
            expect(VALID_ROLES.has('assistant')).toBe(true);
            expect(VALID_ROLES.has('tool')).toBe(true);
            expect(VALID_ROLES.has('system')).toBe(true);
        });

        test('VALID_BLOCK_TYPES contains expected types', () => {
            expect(VALID_BLOCK_TYPES.has('text')).toBe(true);
            expect(VALID_BLOCK_TYPES.has('tool_call')).toBe(true);
            expect(VALID_BLOCK_TYPES.has('tool_result')).toBe(true);
        });
    });
});
