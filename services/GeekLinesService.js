/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

/**
 * Geek / funny loading lines with estimated read-time pacing.
 * Catalog is generated once (≥1000 unique lines) and sampled randomly.
 */

const SUBJECTS = [
    'compiler', 'kernel', 'cache', 'pipeline', 'larva', 'agent', 'regex', 'heap',
    'stack', 'mutex', 'docker', 'git', 'PR', 'CI', 'SSH', 'API', 'token', 'prompt',
    'model', 'tensor', 'neuron', 'bytecode', 'parser', 'AST', 'LSP', 'REPL', 'TTY',
    'buffer', 'socket', 'packet', 'firewall', 'DNS', 'CDN', 'GPU', 'CPU', 'RAM',
    'SSD', 'cron', 'daemon', 'webhook', 'schema', 'migration', 'fixture', 'mock',
    'spy', 'stub', 'lint', 'typecheck', 'bundle', 'tree-shake', 'hydrate', 'SSR',
    'CSR', 'WASM', 'protobuf', 'JSON', 'YAML', 'TOML', 'Markdown', 'diff', 'merge',
    'rebase', 'stash', 'cherry-pick', 'blame', 'bisect', 'hook', 'secret', 'vault'
];

const VERBS = [
    'compiling', 'warming', 'syncing', 'probing', 'hydrating', 'refactoring',
    'debouncing', 'memoizing', 'serializing', 'encrypting', 'hashing', 'indexing',
    'sharding', 'replicating', 'checkpointing', 'replaying', 'diffing', 'merging',
    'linting', 'fuzzing', 'profiling', 'tracing', 'instrumenting', 'optimizing',
    'vectorizing', 'quantizing', 'tokenizing', 'embedding', 'retrieving', 'reranking',
    'streaming', 'buffering', 'flushing', 'checkpointing', 'bootstrapping', 'scaffolding',
    'wiring', 'untangling', 'debugging', 'triaging', 'hot-reloading', 'cold-starting',
    'preflighting', 'sanity-checking', 'smoke-testing', 'load-testing', 'canarying',
    'blue-greening', 'feature-flagging', 'rate-limiting', 'backoff-retrying', 'circuit-breaking'
];

const PLACES = [
    'the void', 'prod', 'staging', 'localhost:3847', 'the hangar', 'sector 7',
    'the Larva Lab', 'main', 'feature-fix', 'the merge queue', 'CI night shift',
    'the stack overflow', 'the heap of doom', 'cache L3', 'the event loop',
    'the promise chain', 'the callback swamp', 'the ASCII mines', 'neon alley',
    'the green terminal', 'the black box', 'the whitepaper', 'the RFC abyss',
    'the changelog', 'the brain dump', 'the agent room', 'the token buffet'
];

const PUNCH = [
    'please hold the bugs',
    'coffee optional, curiosity required',
    'no segfaults were harmed',
    'almost elegant',
    'surprisingly intentional',
    'trust the process (and the larva)',
    'bytes before opinions',
    'shipping is a feature',
    'green means go',
    'charcoal armor online',
    'neon panels glowing',
    'eyes locked, legs ready',
    'segment 3 reporting',
    'plump and professional',
    'cute but production-grade',
    'reading the room… and the logs',
    'fewer emojis, more uptime',
    'refactoring the vibe',
    'aligning under POK',
    'context window stretching',
    'fallbacks standing by',
    'secrets stay vaulted',
    'docs syncing quietly',
    'tests whispering pass',
    'latency doing yoga',
    'the larva approves',
    'geek mode engaged',
    'funny-serious hybrid',
    'terminal chic',
    'ASCII with attitude'
];

const TEMPLATES = [
    (a, b, c, d) => `${b} the ${a} in ${c} — ${d}`,
    (a, b, c, d) => `Lorapok larva is ${b} a ${a}. ${d}.`,
    (a, b, c, d) => `${b} ${a} near ${c}… ${d}`,
    (a, b, c, d) => `Hold tight: ${b} the ${a}. (${d})`,
    (a, b, c, d) => `From ${c}: ${b} ${a}. ${d}`,
    (a, b, c, d) => `${a.toUpperCase()} status: ${b}. ${d}`,
    (a, b, c, d) => `Soldier-fly mode: ${b} through ${c}. ${d}`,
    (a, b, c, d) => `Geek intermission — ${b} the ${a}. ${d}`,
    (a, b, c, d) => `While you wait: ${b} ${a} in ${c}.`,
    (a, b, c, d) => `${d[0].toUpperCase()}${d.slice(1)} — still ${b} the ${a}.`,
    (a, b, c, d) => `Neon tip: ${b} beats guessing. (${a} @ ${c})`,
    (a, b, c, d) => `Charcoal chassis online. ${b} ${a}. ${d}`,
    (a, b, c, d) => `Expressive eyes say: ${b} the ${a}. ${d}`,
    (a, b, c, d) => `Segmented progress: ${b}… ${d}`,
    (a, b, c, d) => `Robotic legs shuffling — ${b} ${a} in ${c}.`,
    (a, b, c, d) => `Funny geek fact: ${b} a ${a} fixes nothing alone. ${d}`,
    (a, b, c, d) => `Loading personality.dll — ${b} ${a}. ${d}`,
    (a, b, c, d) => `Please stand by in ${c} while ${b} the ${a}.`,
    (a, b, c, d) => `Lorapok Labs: ${b} ${a}. ${d}`,
    (a, b, c, d) => `${b}… not stuck, just thoughtful. (${a})`
];

const WPM = 220; // average silent reading
const MIN_MS = 2800;
const MAX_MS = 9000;
const BASE_MS = 900;

class GeekLinesService {
    constructor() {
        this._lines = null;
        this._lastIndex = -1;
    }

    /**
     * Build ≥1000 unique lines combinatorially (stable order).
     * @returns {string[]}
     */
    getCatalog() {
        if (this._lines) return this._lines;
        const out = [];
        const seen = new Set();
        let i = 0;
        // Deterministic walk to keep catalog stable across runs
        while (out.length < 1200 && i < 50000) {
            const s = SUBJECTS[i % SUBJECTS.length];
            const v = VERBS[(i * 3) % VERBS.length];
            const p = PLACES[(i * 7) % PLACES.length];
            const punch = PUNCH[(i * 11) % PUNCH.length];
            const tpl = TEMPLATES[i % TEMPLATES.length];
            const line = tpl(s, v, p, punch);
            if (!seen.has(line)) {
                seen.add(line);
                out.push(line);
            }
            i += 1;
        }
        this._lines = out;
        return out;
    }

    /**
     * Estimated milliseconds a user needs to comfortably read a line.
     * @param {string} line
     * @returns {number}
     */
    estimateReadMs(line) {
        const words = String(line || '').trim().split(/\s+/).filter(Boolean).length;
        const ms = BASE_MS + Math.ceil((words / WPM) * 60 * 1000);
        return Math.min(MAX_MS, Math.max(MIN_MS, ms));
    }

    /**
     * Pick a random line different from the previous one.
     * @returns {{ text: string, readMs: number, index: number }}
     */
    next() {
        const catalog = this.getCatalog();
        if (catalog.length === 0) {
            return { text: 'Lorapok thinking…', readMs: MIN_MS, index: 0 };
        }
        let idx = Math.floor(Math.random() * catalog.length);
        if (catalog.length > 1 && idx === this._lastIndex) {
            idx = (idx + 1) % catalog.length;
        }
        this._lastIndex = idx;
        const text = catalog[idx];
        return { text, readMs: this.estimateReadMs(text), index: idx };
    }

    /** Catalog size (for tests / metrics). */
    size() {
        return this.getCatalog().length;
    }
}

const geekLinesService = new GeekLinesService();

module.exports = { GeekLinesService, geekLinesService };
