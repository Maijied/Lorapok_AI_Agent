/**
 * Tests for lib/core/Plan.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { Plan, PlanStep, PLAN_ACTIONS, RISK_LEVELS } = require('../lib/core/Plan');
const { ValidationError } = require('../lib/errors');

// Mock uuid for deterministic IDs
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234')
}));

describe('PlanStep', () => {
    const validStep = {
        order: 1,
        action: 'edit_file',
        target: 'lib/agent.js',
        rationale: 'Fix the bug in agent logic'
    };

    test('creates a valid PlanStep', () => {
        const step = new PlanStep(validStep);
        expect(step.order).toBe(1);
        expect(step.action).toBe('edit_file');
        expect(step.status).toBe('pending');
        expect(step.reversible).toBe(true);
    });

    test('accepts optional fields', () => {
        const step = new PlanStep({
            ...validStep,
            diffPreview: '+ added line',
            dependsOn: [2, 3],
            reversible: false
        });
        expect(step.diffPreview).toBe('+ added line');
        expect(step.dependsOn).toEqual([2, 3]);
        expect(step.reversible).toBe(false);
    });

    test('throws on invalid action', () => {
        expect(() => new PlanStep({ ...validStep, action: 'explode' })).toThrow(ValidationError);
    });

    test('throws on missing target', () => {
        expect(() => new PlanStep({ ...validStep, target: '' })).toThrow(ValidationError);
    });

    test('throws on non-positive order', () => {
        expect(() => new PlanStep({ ...validStep, order: 0 })).toThrow(ValidationError);
        expect(() => new PlanStep({ ...validStep, order: -1 })).toThrow(ValidationError);
    });

    test('throws on missing rationale', () => {
        expect(() => new PlanStep({ ...validStep, rationale: '' })).toThrow(ValidationError);
    });

    test('serialization roundtrip', () => {
        const step = new PlanStep(validStep);
        step.status = 'completed';
        const json = step.toJSON();
        const restored = PlanStep.fromJSON(json);
        expect(restored.order).toBe(step.order);
        expect(restored.status).toBe('completed');
    });
});

describe('Plan', () => {
    const createValidPlan = () => new Plan({
        goal: 'Implement feature X',
        steps: [
            new PlanStep({ order: 1, action: 'create_file', target: 'new.js', rationale: 'Create new module' }),
            new PlanStep({ order: 2, action: 'edit_file', target: 'index.js', rationale: 'Import new module', dependsOn: [1] })
        ]
    });

    test('creates a valid Plan', () => {
        const plan = createValidPlan();
        expect(plan.goal).toBe('Implement feature X');
        expect(plan.steps).toHaveLength(2);
        expect(plan.risk).toBe('medium');
        expect(plan.id).toBe('test-uuid-1234');
    });

    test('throws on missing goal', () => {
        expect(() => new Plan({ goal: '' })).toThrow(ValidationError);
    });

    test('throws on invalid risk level', () => {
        expect(() => new Plan({ goal: 'x', risk: 'extreme' })).toThrow(ValidationError);
    });

    test('addStep adds a PlanStep', () => {
        const plan = new Plan({ goal: 'test' });
        plan.addStep(new PlanStep({ order: 1, action: 'create_file', target: 'a.js', rationale: 'create' }));
        expect(plan.steps).toHaveLength(1);
    });

    test('addStep throws on non-PlanStep', () => {
        const plan = new Plan({ goal: 'test' });
        expect(() => plan.addStep({ order: 1 })).toThrow(ValidationError);
    });

    describe('getExecutionOrder', () => {
        test('returns topologically sorted steps', () => {
            const plan = createValidPlan();
            const order = plan.getExecutionOrder();
            expect(order[0].order).toBe(1); // no deps, comes first
            expect(order[1].order).toBe(2); // depends on 1
        });

        test('handles independent steps', () => {
            const plan = new Plan({
                goal: 'test',
                steps: [
                    new PlanStep({ order: 1, action: 'create_file', target: 'a.js', rationale: 'create a' }),
                    new PlanStep({ order: 2, action: 'create_file', target: 'b.js', rationale: 'create b' })
                ]
            });
            const order = plan.getExecutionOrder();
            expect(order).toHaveLength(2);
        });
    });

    describe('detectCircularDependencies', () => {
        test('no circular dependencies in valid plan', () => {
            const plan = createValidPlan();
            const result = plan.detectCircularDependencies();
            expect(result.hasCircular).toBe(false);
            expect(result.cycles).toHaveLength(0);
        });

        test('detects circular dependencies', () => {
            const plan = new Plan({
                goal: 'test',
                steps: [
                    new PlanStep({ order: 1, action: 'edit_file', target: 'a.js', rationale: 'edit a', dependsOn: [2] }),
                    new PlanStep({ order: 2, action: 'edit_file', target: 'b.js', rationale: 'edit b', dependsOn: [1] })
                ]
            });
            const result = plan.detectCircularDependencies();
            expect(result.hasCircular).toBe(true);
        });

        test('getExecutionOrder throws on circular deps', () => {
            const plan = new Plan({
                goal: 'test',
                steps: [
                    new PlanStep({ order: 1, action: 'edit_file', target: 'a.js', rationale: 'edit a', dependsOn: [2] }),
                    new PlanStep({ order: 2, action: 'edit_file', target: 'b.js', rationale: 'edit b', dependsOn: [1] })
                ]
            });
            expect(() => plan.getExecutionOrder()).toThrow(ValidationError);
        });
    });

    describe('file hashing', () => {
        test('hashFile returns empty string for nonexistent file', () => {
            const hash = Plan.hashFile('/nonexistent/path/to/file.js');
            expect(hash).toBe('');
        });

        test('hashFile returns consistent hash for existing file', () => {
            const thisFile = __filename;
            const h1 = Plan.hashFile(thisFile);
            const h2 = Plan.hashFile(thisFile);
            expect(h1).toBe(h2);
            expect(h1.length).toBe(64); // SHA-256 hex
        });
    });

    describe('staleness detection', () => {
        test('checkStaleness returns not stale for empty hashes', () => {
            const plan = new Plan({
                goal: 'test',
                steps: [
                    new PlanStep({ order: 1, action: 'run_command', target: 'npm test', rationale: 'test' })
                ]
            });
            const result = plan.checkStaleness();
            expect(result.stale).toBe(false);
        });
    });

    describe('serialization', () => {
        test('toJSON and fromJSON roundtrip', () => {
            const plan = createValidPlan();
            const json = plan.toJSON();
            const restored = Plan.fromJSON(json);
            expect(restored.goal).toBe(plan.goal);
            expect(restored.steps).toHaveLength(plan.steps.length);
            expect(restored.steps[0].order).toBe(1);
        });
    });

    describe('constants', () => {
        test('PLAN_ACTIONS contains expected actions', () => {
            expect(PLAN_ACTIONS.has('create_file')).toBe(true);
            expect(PLAN_ACTIONS.has('edit_file')).toBe(true);
            expect(PLAN_ACTIONS.has('run_command')).toBe(true);
        });

        test('RISK_LEVELS contains expected levels', () => {
            expect(RISK_LEVELS.has('low')).toBe(true);
            expect(RISK_LEVELS.has('medium')).toBe(true);
            expect(RISK_LEVELS.has('high')).toBe(true);
        });
    });
});
