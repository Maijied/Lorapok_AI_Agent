/**
 * Tests for services/ToolRuntime.js
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { ToolRuntime, createBuiltinTools } = require('../services/ToolRuntime');
const { ToolSpec, POLICY_TIERS } = require('../lib/core/ToolSpec');

describe('ToolRuntime', () => {
    let runtime;
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-test-'));
        runtime = new ToolRuntime({ projectRoot: tmpDir });
    });

    afterEach(() => {
        // Clean up
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (_) {}
    });

    describe('built-in registration', () => {
        test('registers all built-in tools', () => {
            expect(runtime.size()).toBe(7);
        });

        test('includes expected tools', () => {
            const names = runtime.getToolNames();
            expect(names).toContain('read_file');
            expect(names).toContain('write_file');
            expect(names).toContain('list_dir');
            expect(names).toContain('grep');
            expect(names).toContain('run_command');
            expect(names).toContain('git_status');
            expect(names).toContain('run_test');
        });

        test('all tool specs are valid ToolSpec instances', () => {
            const specs = runtime.getToolSpecs();
            for (const spec of specs) {
                expect(spec).toBeInstanceOf(ToolSpec);
            }
        });

        test('can be created without builtins', () => {
            const bare = new ToolRuntime({ projectRoot: tmpDir, registerBuiltins: false });
            expect(bare.size()).toBe(0);
        });
    });

    describe('custom tool registration', () => {
        test('registers a custom tool', () => {
            runtime.register({
                spec: new ToolSpec({
                    name: 'custom_tool',
                    description: 'Custom test tool',
                    inputSchema: { type: 'object', properties: {} },
                    policyTier: POLICY_TIERS.ALWAYS_ALLOW
                }),
                execute: async () => ({ success: true, output: 'custom result' })
            });
            expect(runtime.getTool('custom_tool')).not.toBeNull();
        });

        test('throws on invalid registration', () => {
            expect(() => runtime.register({})).toThrow();
            expect(() => runtime.register({ spec: 'not a ToolSpec', execute: () => {} })).toThrow();
        });
    });

    describe('read_file', () => {
        test('reads existing file', async () => {
            fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'hello world');
            const result = await runtime.execute('read_file', { path: 'test.txt' });
            expect(result.success).toBe(true);
            expect(result.output).toBe('hello world');
        });

        test('fails on nonexistent file', async () => {
            const result = await runtime.execute('read_file', { path: 'nonexistent.txt' });
            expect(result.success).toBe(false);
        });

        test('rejects path escaping project root', async () => {
            const result = await runtime.execute('read_file', { path: '../../etc/passwd' });
            expect(result.success).toBe(false);
        });
    });

    describe('write_file', () => {
        test('writes file and creates dirs', async () => {
            const result = await runtime.execute('write_file', {
                path: 'subdir/new.txt',
                content: 'new content'
            });
            expect(result.success).toBe(true);
            expect(fs.readFileSync(path.join(tmpDir, 'subdir/new.txt'), 'utf-8')).toBe('new content');
        });
    });

    describe('list_dir', () => {
        test('lists directory contents', async () => {
            fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'a');
            fs.mkdirSync(path.join(tmpDir, 'subdir'));
            const result = await runtime.execute('list_dir', { path: '.' });
            expect(result.success).toBe(true);
            expect(result.output).toContain('a.txt');
            expect(result.output).toContain('subdir');
        });

        test('fails on nonexistent directory', async () => {
            const result = await runtime.execute('list_dir', { path: 'nope' });
            expect(result.success).toBe(false);
        });
    });

    describe('run_command', () => {
        test('runs echo command', async () => {
            const result = await runtime.execute('run_command', { command: 'echo hello' });
            expect(result.success).toBe(true);
            expect(result.output.trim()).toBe('hello');
        });

        test('handles failing command', async () => {
            const result = await runtime.execute('run_command', { command: 'false' });
            expect(result.success).toBe(false);
        });
    });

    describe('unknown tool', () => {
        test('returns failure for unknown tool', async () => {
            const result = await runtime.execute('nonexistent_tool', {});
            expect(result.success).toBe(false);
            expect(result.output).toContain('Unknown tool');
        });
    });

    describe('input validation', () => {
        test('validates required fields', async () => {
            const result = await runtime.execute('read_file', {});
            expect(result.success).toBe(false);
            expect(result.output).toContain('validation failed');
        });
    });

    describe('toJSON', () => {
        test('serializes all tool specs', () => {
            const json = runtime.toJSON();
            expect(json).toHaveLength(7);
            expect(json[0].name).toBeDefined();
        });
    });
});
