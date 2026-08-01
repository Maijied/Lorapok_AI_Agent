/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * Plan & PlanStep — structured plan objects that Plan Mode produces
 * and Agentic Mode consumes. Plans reference file hashes for staleness
 * detection and encode step dependency graphs.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../errors');

// ── PlanStep Actions ─────────────────────────────────────────────────

const PLAN_ACTIONS = new Set([
    'create_file',
    'edit_file',
    'delete_file',
    'run_command',
    'git_op',
    'install_dep'
]);

const RISK_LEVELS = new Set(['low', 'medium', 'high']);

// ── PlanStep Class ───────────────────────────────────────────────────

/**
 * A single step within a Plan.
 */
class PlanStep {
    /**
     * @param {Object} options - Step specification
     * @param {number} options.order - Step sequence number (1-based)
     * @param {string} options.action - Action type from PLAN_ACTIONS
     * @param {string} options.target - File path or command string
     * @param {string} options.rationale - Human-readable reason for this step
     * @param {string} [options.diffPreview=''] - Unified diff generated at plan time
     * @param {number[]} [options.dependsOn=[]] - Step orders this depends on
     * @param {boolean} [options.reversible=true] - Whether this step can be undone
     */
    constructor(options) {
        if (!options || typeof options !== 'object') {
            throw new ValidationError('PlanStep requires an options object', 'options');
        }
        if (typeof options.order !== 'number' || options.order < 1) {
            throw new ValidationError('PlanStep order must be a positive integer', 'order');
        }
        if (!PLAN_ACTIONS.has(options.action)) {
            throw new ValidationError(
                `Invalid action: "${options.action}". Must be one of: ${[...PLAN_ACTIONS].join(', ')}`,
                'action'
            );
        }
        if (!options.target || typeof options.target !== 'string') {
            throw new ValidationError('PlanStep requires a non-empty string target', 'target');
        }
        if (!options.rationale || typeof options.rationale !== 'string') {
            throw new ValidationError('PlanStep requires a non-empty string rationale', 'rationale');
        }

        this.order = options.order;
        this.action = options.action;
        this.target = options.target;
        this.rationale = options.rationale;
        this.diffPreview = options.diffPreview || '';
        this.dependsOn = Array.isArray(options.dependsOn) ? [...options.dependsOn] : [];
        this.reversible = options.reversible !== false;
        this.status = 'pending'; // pending | executing | completed | failed | skipped
    }

    /**
     * Serialize to a plain object.
     * @returns {Object}
     */
    toJSON() {
        return {
            order: this.order,
            action: this.action,
            target: this.target,
            rationale: this.rationale,
            diffPreview: this.diffPreview,
            dependsOn: this.dependsOn,
            reversible: this.reversible,
            status: this.status
        };
    }

    /**
     * Deserialize from a plain object.
     * @param {Object} obj
     * @returns {PlanStep}
     */
    static fromJSON(obj) {
        const step = new PlanStep(obj);
        if (obj.status) step.status = obj.status;
        return step;
    }
}

// ── Plan Class ───────────────────────────────────────────────────────

/**
 * A structured plan produced by Plan Mode.
 * Contains ordered steps, file hashes for staleness detection,
 * and a dependency graph with circular dependency validation.
 */
class Plan {
    /**
     * @param {Object} options - Plan specification
     * @param {string} options.goal - The user's goal/objective
     * @param {PlanStep[]} [options.steps=[]] - Ordered plan steps
     * @param {string} [options.risk='medium'] - Risk assessment
     * @param {Object} [options.fileHashes={}] - Hash map of referenced files at plan time
     */
    constructor(options) {
        if (!options || typeof options !== 'object') {
            throw new ValidationError('Plan requires an options object', 'options');
        }
        if (!options.goal || typeof options.goal !== 'string') {
            throw new ValidationError('Plan requires a non-empty string goal', 'goal');
        }

        const risk = options.risk || 'medium';
        if (!RISK_LEVELS.has(risk)) {
            throw new ValidationError(
                `Invalid risk level: "${risk}". Must be one of: ${[...RISK_LEVELS].join(', ')}`,
                'risk'
            );
        }

        this.id = options.id || uuidv4();
        this.createdAt = options.createdAt || new Date().toISOString();
        this.goal = options.goal;
        this.steps = Array.isArray(options.steps) ? options.steps : [];
        this.risk = risk;
        this.fileHashes = options.fileHashes || {};
        this.invalidatedBy = options.invalidatedBy || null;
    }

    /**
     * Add a step to the plan.
     * @param {PlanStep} step - Step to add
     */
    addStep(step) {
        if (!(step instanceof PlanStep)) {
            throw new ValidationError('addStep requires a PlanStep instance', 'step');
        }
        this.steps.push(step);
    }

    /**
     * Get steps in dependency-safe execution order.
     * @returns {PlanStep[]} Topologically sorted steps
     * @throws {ValidationError} If circular dependencies are detected
     */
    getExecutionOrder() {
        const circularCheck = this.detectCircularDependencies();
        if (circularCheck.hasCircular) {
            throw new ValidationError(
                `Circular dependencies detected in plan steps: ${circularCheck.cycles.join(', ')}`,
                'dependsOn'
            );
        }

        // Topological sort using Kahn's algorithm
        const stepMap = new Map();
        for (const step of this.steps) {
            stepMap.set(step.order, step);
        }

        const inDegree = new Map();
        const adj = new Map();
        for (const step of this.steps) {
            inDegree.set(step.order, 0);
            adj.set(step.order, []);
        }
        for (const step of this.steps) {
            for (const dep of step.dependsOn) {
                if (adj.has(dep)) {
                    adj.get(dep).push(step.order);
                    inDegree.set(step.order, (inDegree.get(step.order) || 0) + 1);
                }
            }
        }

        const queue = [];
        for (const [order, degree] of inDegree) {
            if (degree === 0) queue.push(order);
        }

        const sorted = [];
        while (queue.length > 0) {
            // Stable sort by picking lowest order first
            queue.sort((a, b) => a - b);
            const current = queue.shift();
            sorted.push(stepMap.get(current));
            for (const next of (adj.get(current) || [])) {
                inDegree.set(next, inDegree.get(next) - 1);
                if (inDegree.get(next) === 0) {
                    queue.push(next);
                }
            }
        }

        return sorted;
    }

    /**
     * Detect circular dependencies in the step graph.
     * @returns {{ hasCircular: boolean, cycles: string[] }}
     */
    detectCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const stepOrders = new Set(this.steps.map(s => s.order));

        const dfs = (order, path) => {
            visited.add(order);
            recursionStack.add(order);
            path.push(order);

            const step = this.steps.find(s => s.order === order);
            if (step) {
                for (const dep of step.dependsOn) {
                    if (!stepOrders.has(dep)) continue; // skip missing refs
                    if (!visited.has(dep)) {
                        dfs(dep, [...path]);
                    } else if (recursionStack.has(dep)) {
                        const cycleStart = path.indexOf(dep);
                        const cycle = path.slice(cycleStart).concat(dep);
                        cycles.push(cycle.join(' → '));
                    }
                }
            }

            recursionStack.delete(order);
        };

        for (const step of this.steps) {
            if (!visited.has(step.order)) {
                dfs(step.order, []);
            }
        }

        return { hasCircular: cycles.length > 0, cycles };
    }

    /**
     * Hash a file's current content for staleness tracking.
     * @param {string} filePath - Absolute or relative file path
     * @param {string} [projectRoot=process.cwd()] - Project root for relative path resolution
     * @returns {string} SHA-256 hash of file content, or empty string if file doesn't exist
     */
    static hashFile(filePath, projectRoot = process.cwd()) {
        try {
            const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
            const content = fs.readFileSync(absPath, 'utf-8');
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch (_) {
            return '';
        }
    }

    /**
     * Record current file hashes for all files referenced in plan steps.
     * @param {string} [projectRoot=process.cwd()] - Project root path
     */
    captureFileHashes(projectRoot = process.cwd()) {
        for (const step of this.steps) {
            if (['create_file', 'edit_file', 'delete_file'].includes(step.action)) {
                this.fileHashes[step.target] = Plan.hashFile(step.target, projectRoot);
            }
        }
    }

    /**
     * Check which steps are stale (referenced files have changed since plan creation).
     * @param {string} [projectRoot=process.cwd()] - Project root path
     * @returns {{ stale: boolean, staleSteps: number[], details: Object }}
     */
    checkStaleness(projectRoot = process.cwd()) {
        const staleSteps = [];
        const details = {};

        for (const step of this.steps) {
            if (['create_file', 'edit_file', 'delete_file'].includes(step.action)) {
                const originalHash = this.fileHashes[step.target];
                const currentHash = Plan.hashFile(step.target, projectRoot);

                // If original hash was empty (file didn't exist) and still doesn't, not stale
                if (originalHash === '' && currentHash === '') continue;
                // If file was created externally since plan, mark stale
                if (originalHash === '' && currentHash !== '') {
                    staleSteps.push(step.order);
                    details[step.target] = { expected: '(not exist)', actual: currentHash.slice(0, 8) };
                    continue;
                }
                // If file was deleted externally since plan, mark stale
                if (originalHash !== '' && currentHash === '') {
                    staleSteps.push(step.order);
                    details[step.target] = { expected: originalHash.slice(0, 8), actual: '(deleted)' };
                    continue;
                }
                // Content changed
                if (originalHash !== currentHash) {
                    staleSteps.push(step.order);
                    details[step.target] = { expected: originalHash.slice(0, 8), actual: currentHash.slice(0, 8) };
                }
            }
        }

        return { stale: staleSteps.length > 0, staleSteps, details };
    }

    /**
     * Serialize to a plain JSON-safe object.
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            goal: this.goal,
            steps: this.steps.map(s => s instanceof PlanStep ? s.toJSON() : s),
            risk: this.risk,
            fileHashes: this.fileHashes,
            invalidatedBy: this.invalidatedBy
        };
    }

    /**
     * Deserialize from a plain object.
     * @param {Object} obj
     * @returns {Plan}
     */
    static fromJSON(obj) {
        const plan = new Plan({
            ...obj,
            steps: (obj.steps || []).map(s => PlanStep.fromJSON(s))
        });
        return plan;
    }
}

module.exports = {
    Plan,
    PlanStep,
    PLAN_ACTIONS,
    RISK_LEVELS
};
