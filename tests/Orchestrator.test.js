'use strict';

const { Orchestrator } = require('../services/Orchestrator');
const { UnifiedMessage } = require('../lib/core/UnifiedMessage');
const { BudgetExhaustedError, LoopGuardError } = require('../lib/errors');

describe('Orchestrator', () => {
    let orchestrator;
    let mockPolicyEngine;
    let mockToolRuntime;

    beforeEach(() => {
        mockPolicyEngine = {
            evaluate: jest.fn()
        };

        mockToolRuntime = {
            getTool: jest.fn(),
            execute: jest.fn()
        };

        orchestrator = new Orchestrator({
            policyEngine: mockPolicyEngine,
            toolRuntime: mockToolRuntime,
            budget: {
                maxToolCalls: 5,
                maxTokens: 1000,
                maxCostUsd: 1.0
            },
            maxRepeatedFailures: 2
        });
    });

    describe('initialization', () => {
        it('requires options object', () => {
            expect(() => new Orchestrator()).toThrow(/requires an options object/);
        });

        it('initializes with default budget', () => {
            const orch = new Orchestrator({});
            expect(orch.budget.maxToolCalls).toBe(25);
            expect(orch.budget.maxTokens).toBe(0);
            expect(orch.budget.maxCostUsd).toBe(0);
        });
    });

    describe('processToolCall', () => {
        const toolCall = { id: 'call_1', name: 'read_file', input: { path: 'a.js' } };

        it('processes a successful tool call', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'safe' } });
            mockPolicyEngine.evaluate.mockReturnValue({ state: 'auto_approved' });
            mockToolRuntime.execute.mockResolvedValue({ success: true, output: 'file contents' });

            const res = await orchestrator.processToolCall(toolCall);
            
            expect(res.state).toBe('succeeded');
            expect(res.result.output).toBe('file contents');
            expect(orchestrator.getState().toolCallCount).toBe(1);
        });

        it('stops if policy engine denies', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'safe' } });
            mockPolicyEngine.evaluate.mockReturnValue({ state: 'denied', reason: 'policy violation' });

            const res = await orchestrator.processToolCall(toolCall);
            
            expect(res.state).toBe('denied');
            expect(mockToolRuntime.execute).not.toHaveBeenCalled();
            // does not increment tool call count because execution never started
            expect(orchestrator.getState().toolCallCount).toBe(0);
        });

        it('returns needs_confirm if policy engine requires it', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'confirm' } });
            mockPolicyEngine.evaluate.mockReturnValue({ state: 'needs_confirm' });

            const res = await orchestrator.processToolCall(toolCall);
            
            expect(res.state).toBe('needs_confirm');
            expect(mockToolRuntime.execute).not.toHaveBeenCalled();
            expect(orchestrator.getState().toolCallCount).toBe(0);
        });

        it('handles tool execution failures gracefully', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'safe' } });
            mockPolicyEngine.evaluate.mockReturnValue({ state: 'auto_approved' });
            mockToolRuntime.execute.mockResolvedValue({ success: false, output: 'file not found' });

            const res = await orchestrator.processToolCall(toolCall);
            
            expect(res.state).toBe('failed');
            expect(res.result.output).toBe('file not found');
            expect(orchestrator.getState().failureCount).toBe(1);
        });

        it('clears failure history on success', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'safe' } });
            mockPolicyEngine.evaluate.mockReturnValue({ state: 'auto_approved' });
            mockToolRuntime.execute.mockResolvedValueOnce({ success: false, output: 'fail 1' })
                                   .mockResolvedValueOnce({ success: true, output: 'success' });

            await orchestrator.processToolCall(toolCall);
            expect(orchestrator.getState().failureCount).toBe(1);

            await orchestrator.processToolCall(toolCall);
            expect(orchestrator.getState().failureCount).toBe(0);
        });
    });

    describe('guards and limits', () => {
        const toolCall = { id: 'call_1', name: 'read_file', input: { path: 'a.js' } };

        it('throws BudgetExhaustedError when tool call limit reached', async () => {
            orchestrator._state.toolCallCount = 5;
            await expect(orchestrator.processToolCall(toolCall))
                .rejects.toThrow(BudgetExhaustedError);
        });

        it('throws LoopGuardError on repeated identical failures', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'safe' } });
            mockPolicyEngine.evaluate.mockReturnValue({ state: 'auto_approved' });
            mockToolRuntime.execute.mockResolvedValue({ success: false, output: 'error' });

            await orchestrator.processToolCall(toolCall); // 1st fail
            await orchestrator.processToolCall(toolCall); // 2nd fail (recorded)
            
            await expect(orchestrator.processToolCall(toolCall)) // 3rd fail should trigger limit (maxRepeatedFailures: 2)
                .rejects.toThrow(LoopGuardError);
        });

        it('throws BudgetExhaustedError when tokens exceeded', () => {
            orchestrator.addTokenUsage(900);
            expect(() => orchestrator.addTokenUsage(200)).toThrow(BudgetExhaustedError);
        });

        it('throws BudgetExhaustedError when cost exceeded', () => {
            orchestrator.addCostUsage(0.8);
            expect(() => orchestrator.addCostUsage(0.3)).toThrow(BudgetExhaustedError);
        });
    });

    describe('processToolCalls', () => {
        it('processes multiple calls sequentially and stops on deny', async () => {
            mockToolRuntime.getTool.mockReturnValue({ spec: { policyTier: 'safe' } });
            // first auto_approved, second denied
            mockPolicyEngine.evaluate
                .mockReturnValueOnce({ state: 'auto_approved' })
                .mockReturnValueOnce({ state: 'denied', reason: 'nope' });
            mockToolRuntime.execute.mockResolvedValue({ success: true, output: 'ok' });

            const msg = UnifiedMessage.assistantToolCalls([
                { id: 'c1', name: 't1', input: {} },
                { id: 'c2', name: 't2', input: {} },
                { id: 'c3', name: 't3', input: {} } // should not be processed
            ]);

            const results = await orchestrator.processToolCalls(msg);
            expect(results).toHaveLength(2);
            expect(results[0].state).toBe('succeeded');
            expect(results[1].state).toBe('denied');
            
            expect(mockPolicyEngine.evaluate).toHaveBeenCalledTimes(2);
            expect(mockToolRuntime.execute).toHaveBeenCalledTimes(1);
        });
    });

    describe('state management', () => {
        it('resets state correctly', () => {
            orchestrator._state.toolCallCount = 10;
            orchestrator._state.tokensUsed = 500;
            orchestrator.reset();
            const state = orchestrator.getState();
            expect(state.toolCallCount).toBe(0);
            expect(state.tokensUsed).toBe(0);
        });

        it('aborts correctly', () => {
            orchestrator.abort();
            expect(orchestrator.isAborted()).toBe(true);
            expect(orchestrator.getState().aborted).toBe(true);
        });

        it('calculates remaining budget correctly', () => {
            orchestrator._state.toolCallCount = 3;
            orchestrator._state.tokensUsed = 600;
            orchestrator._state.costUsd = 0.5;

            const rem = orchestrator.getRemainingBudget();
            expect(rem.toolCallsRemaining).toBe(2);
            expect(rem.tokensRemaining).toBe(400);
            expect(rem.costRemaining).toBeCloseTo(0.5);
        });
    });
});
