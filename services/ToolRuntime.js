/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * ToolRuntime — plugin-based tool registration and execution.
 * Each tool implements { name, schema, execute, policyTier }.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../lib/logger');
const { LorapokError, FileSystemError } = require('../lib/errors');
const { ToolSpec, POLICY_TIERS } = require('../lib/core/ToolSpec');
const { toolResultBlock } = require('../lib/core/UnifiedMessage');

// ── Built-in Tool Definitions ────────────────────────────────────────

/**
 * Create built-in tool specs.
 * @returns {Object<string, { spec: ToolSpec, execute: Function }>}
 */
function createBuiltinTools(projectRoot) {
    const root = projectRoot || process.cwd();

    /**
     * Validate a path stays within project root.
     * @param {string} filePath
     * @returns {string} Resolved absolute path
     */
    function safePath(filePath) {
        const resolved = path.resolve(root, filePath);
        if (!resolved.startsWith(path.resolve(root))) {
            throw new FileSystemError('Access denied: path escapes project root', filePath);
        }
        return resolved;
    }

    return {
        read_file: {
            spec: new ToolSpec({
                name: 'read_file',
                description: 'Read the contents of a file within the project.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative file path within the project' }
                    },
                    required: ['path']
                },
                policyTier: POLICY_TIERS.ALWAYS_ALLOW,
                mutatesState: false
            }),
            execute: async (input) => {
                const absPath = safePath(input.path);
                if (!fs.existsSync(absPath)) {
                    return { success: false, output: `File not found: ${input.path}` };
                }
                const stat = fs.statSync(absPath);
                if (stat.size > 1024 * 1024) {
                    return { success: false, output: `File too large (${Math.round(stat.size / 1024)}KB). Use grep instead.` };
                }
                const content = fs.readFileSync(absPath, 'utf-8');
                return { success: true, output: content };
            }
        },

        write_file: {
            spec: new ToolSpec({
                name: 'write_file',
                description: 'Write content to a file within the project. Creates parent directories if needed.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative file path' },
                        content: { type: 'string', description: 'File content to write' }
                    },
                    required: ['path', 'content']
                },
                policyTier: POLICY_TIERS.CONFIRM,
                mutatesState: true
            }),
            execute: async (input) => {
                const absPath = safePath(input.path);
                const dir = path.dirname(absPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(absPath, input.content, 'utf-8');
                return { success: true, output: `Wrote ${input.content.length} chars to ${input.path}` };
            }
        },

        list_dir: {
            spec: new ToolSpec({
                name: 'list_dir',
                description: 'List files and directories in a project path.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative directory path (default: ".")' }
                    },
                    required: []
                },
                policyTier: POLICY_TIERS.ALWAYS_ALLOW,
                mutatesState: false
            }),
            execute: async (input) => {
                const dirPath = safePath(input.path || '.');
                if (!fs.existsSync(dirPath)) {
                    return { success: false, output: `Directory not found: ${input.path || '.'}` };
                }
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                const listing = entries.map(e => {
                    const prefix = e.isDirectory() ? '📁 ' : '📄 ';
                    return `${prefix}${e.name}`;
                }).join('\n');
                return { success: true, output: listing || '(empty directory)' };
            }
        },

        grep: {
            spec: new ToolSpec({
                name: 'grep',
                description: 'Search for a pattern in project files using grep.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern: { type: 'string', description: 'Search pattern (regex or literal)' },
                        path: { type: 'string', description: 'Directory or file to search (default: ".")' },
                        flags: { type: 'string', description: 'Additional grep flags (e.g., "-i" for case-insensitive)' }
                    },
                    required: ['pattern']
                },
                policyTier: POLICY_TIERS.ALWAYS_ALLOW,
                mutatesState: false
            }),
            execute: async (input) => {
                const searchPath = safePath(input.path || '.');
                const flags = input.flags || '-rn';
                try {
                    const result = execSync(
                        `grep ${flags} -- ${JSON.stringify(input.pattern)} ${JSON.stringify(searchPath)}`,
                        { encoding: 'utf-8', maxBuffer: 512 * 1024, timeout: 10000 }
                    );
                    // Truncate if too long
                    const lines = result.split('\n');
                    if (lines.length > 50) {
                        return { success: true, output: lines.slice(0, 50).join('\n') + `\n... (${lines.length - 50} more lines)` };
                    }
                    return { success: true, output: result || '(no matches)' };
                } catch (err) {
                    if (err.status === 1) {
                        return { success: true, output: '(no matches)' };
                    }
                    return { success: false, output: `grep error: ${err.message}` };
                }
            }
        },

        run_command: {
            spec: new ToolSpec({
                name: 'run_command',
                description: 'Run a shell command in the project directory.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: { type: 'string', description: 'Shell command to execute' },
                        timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' }
                    },
                    required: ['command']
                },
                policyTier: POLICY_TIERS.CONFIRM,
                mutatesState: true,
                requiresNetwork: false
            }),
            execute: async (input) => {
                const timeout = input.timeout || 30000;
                try {
                    const result = execSync(input.command, {
                        cwd: root,
                        encoding: 'utf-8',
                        maxBuffer: 1024 * 1024,
                        timeout
                    });
                    return { success: true, output: result || '(no output)' };
                } catch (err) {
                    const stderr = err.stderr || err.message || String(err);
                    return { success: false, output: `Command failed (exit ${err.status || '?'}): ${stderr.slice(0, 2000)}` };
                }
            }
        },

        git_status: {
            spec: new ToolSpec({
                name: 'git_status',
                description: 'Get the current git status of the working tree.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                },
                policyTier: POLICY_TIERS.ALWAYS_ALLOW,
                mutatesState: false
            }),
            execute: async () => {
                try {
                    const status = execSync('git status --porcelain', {
                        cwd: root,
                        encoding: 'utf-8',
                        timeout: 5000
                    });
                    const branch = execSync('git branch --show-current', {
                        cwd: root,
                        encoding: 'utf-8',
                        timeout: 5000
                    }).trim();
                    return { success: true, output: `Branch: ${branch}\n${status || '(clean working tree)'}` };
                } catch (err) {
                    return { success: false, output: `git status failed: ${err.message}` };
                }
            }
        },

        run_test: {
            spec: new ToolSpec({
                name: 'run_test',
                description: 'Run the project test suite or a specific test file.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        testFile: { type: 'string', description: 'Specific test file to run (optional)' },
                        testCommand: { type: 'string', description: 'Custom test command (default: "npm test")' }
                    },
                    required: []
                },
                policyTier: POLICY_TIERS.ALLOWLIST,
                mutatesState: false
            }),
            execute: async (input) => {
                let cmd = input.testCommand || 'npm test';
                if (input.testFile) {
                    cmd = `npx jest ${input.testFile} --no-coverage`;
                }
                try {
                    const result = execSync(cmd, {
                        cwd: root,
                        encoding: 'utf-8',
                        maxBuffer: 2 * 1024 * 1024,
                        timeout: 120000
                    });
                    return { success: true, output: result || '(tests passed, no output)' };
                } catch (err) {
                    const output = (err.stdout || '') + '\n' + (err.stderr || err.message || '');
                    return { success: false, output: `Tests failed:\n${output.slice(0, 5000)}` };
                }
            }
        }
    };
}

// ── ToolRuntime Class ────────────────────────────────────────────────

/**
 * Plugin-based tool registration and execution engine.
 * Manages a set of tools, each with a ToolSpec and an execute function.
 */
class ToolRuntime {
    /**
     * @param {Object} [options={}]
     * @param {string} [options.projectRoot=process.cwd()] - Project root
     * @param {boolean} [options.registerBuiltins=true] - Auto-register built-in tools
     */
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();

        /** @type {Map<string, { spec: ToolSpec, execute: Function }>} */
        this._tools = new Map();

        if (options.registerBuiltins !== false) {
            this._registerBuiltins();
        }
    }

    /**
     * Register all built-in tools.
     * @private
     */
    _registerBuiltins() {
        const builtins = createBuiltinTools(this.projectRoot);
        for (const [name, tool] of Object.entries(builtins)) {
            this._tools.set(name, tool);
        }
        logger.info(`ToolRuntime: registered ${this._tools.size} built-in tools`);
    }

    /**
     * Register a new tool plugin.
     * @param {Object} tool - Tool definition
     * @param {ToolSpec} tool.spec - Tool specification
     * @param {Function} tool.execute - Async execution function
     */
    register(tool) {
        if (!tool || !tool.spec || !(tool.spec instanceof ToolSpec)) {
            throw new LorapokError('register() requires a { spec: ToolSpec, execute: Function } object');
        }
        if (typeof tool.execute !== 'function') {
            throw new LorapokError('register() requires an execute function');
        }
        this._tools.set(tool.spec.name, tool);
    }

    /**
     * Get a registered tool by name.
     * @param {string} name - Tool name
     * @returns {{ spec: ToolSpec, execute: Function }|null}
     */
    getTool(name) {
        return this._tools.get(name) || null;
    }

    /**
     * Get all registered tool specs (for passing to provider adapters).
     * @returns {ToolSpec[]}
     */
    getToolSpecs() {
        return [...this._tools.values()].map(t => t.spec);
    }

    /**
     * Get tool names.
     * @returns {string[]}
     */
    getToolNames() {
        return [...this._tools.keys()];
    }

    /**
     * Execute a tool call.
     * @param {string} name - Tool name
     * @param {Object} input - Tool input arguments
     * @returns {Promise<{ success: boolean, output: string }>}
     */
    async execute(name, input) {
        const tool = this._tools.get(name);
        if (!tool) {
            return { success: false, output: `Unknown tool: "${name}"` };
        }

        // Validate input
        const validation = tool.spec.validateInput(input);
        if (!validation.valid) {
            return { success: false, output: `Input validation failed: ${validation.errors.join('; ')}` };
        }

        try {
            const result = await tool.execute(input);
            return result;
        } catch (err) {
            logger.error(`ToolRuntime: ${name} execution error: ${err.message}`);
            return { success: false, output: `Tool execution error: ${err.message}` };
        }
    }

    /**
     * Get the number of registered tools.
     * @returns {number}
     */
    size() {
        return this._tools.size;
    }

    /**
     * Serialize all tool specs for inspection.
     * @returns {Object[]}
     */
    toJSON() {
        return [...this._tools.values()].map(t => t.spec.toJSON());
    }
}

module.exports = {
    ToolRuntime,
    createBuiltinTools
};
