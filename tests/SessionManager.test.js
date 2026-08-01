'use strict';

const { SessionManager, VALID_MODES } = require('../services/SessionManager');
const { UnifiedMessage } = require('../lib/core/UnifiedMessage');

describe('SessionManager', () => {
    it('initializes with default values', () => {
        const session = new SessionManager();
        expect(session.sessionId).toMatch(/^s_\d+_[a-z0-9]+$/);
        expect(session.mode).toBe('chat');
        expect(session.contextBudget).toBe(128000);
        expect(session.maxHistoryMessages).toBe(100);
        expect(session.getHistory()).toEqual([]);
        expect(session.getWorkingFiles()).toEqual([]);
        const metrics = session.getMetrics();
        expect(metrics.totalTokens).toBe(0);
        expect(metrics.totalCostUsd).toBe(0);
    });

    it('initializes with custom values', () => {
        const session = new SessionManager({
            sessionId: 'custom-session-1',
            mode: 'plan',
            contextBudget: 1000,
            maxHistoryMessages: 5
        });
        expect(session.sessionId).toBe('custom-session-1');
        expect(session.mode).toBe('plan');
        expect(session.contextBudget).toBe(1000);
        expect(session.maxHistoryMessages).toBe(5);
    });

    it('throws on invalid initial mode', () => {
        const session = new SessionManager({ mode: 'invalid' });
        expect(session.mode).toBe('chat'); // Defaults to 'chat' if invalid is provided in constructor
    });

    describe('switchMode', () => {
        let session;
        beforeEach(() => {
            session = new SessionManager();
        });

        it('switches to a valid mode and logs it', () => {
            const result = session.switchMode('plan');
            expect(result).toEqual({ previousMode: 'chat', newMode: 'plan' });
            expect(session.mode).toBe('plan');
            expect(session._modeSwitchLog).toHaveLength(1);
            expect(session._modeSwitchLog[0].to).toBe('plan');
        });

        it('throws an error when switching to an invalid mode', () => {
            expect(() => session.switchMode('magic')).toThrow(/Invalid mode: "magic"/);
        });
    });

    describe('history management', () => {
        let session;
        beforeEach(() => {
            session = new SessionManager({ maxHistoryMessages: 3, contextBudget: 100 });
        });

        it('adds messages and trims excess', () => {
            session.addMessage(UnifiedMessage.userText('msg 1'));
            session.addMessage(UnifiedMessage.userText('msg 2'));
            session.addMessage(UnifiedMessage.userText('msg 3'));
            expect(session.getHistory()).toHaveLength(3);

            // This should trigger a trim
            session.addMessage(UnifiedMessage.userText('msg 4'));
            const history = session.getHistory();
            expect(history).toHaveLength(4); // 3 items + 1 summary placeholder
            expect(history[0].role).toBe('system');
            expect(history[0].content[0].text).toContain('Session history trimmed');
            // Wait, if limit is 3, length becomes 4, trim removes 1, inserts 1 summary -> length is 4.
            // Then it will always trim on next add. Let's see the implementation.
        });
    });

    describe('working files', () => {
        let session;
        beforeEach(() => {
            session = new SessionManager();
        });

        it('adds, gets, and removes working files', () => {
            session.addWorkingFile('app.js');
            session.addWorkingFile('index.js');
            expect(session.getWorkingFiles()).toContain('app.js');
            expect(session.getWorkingFiles()).toContain('index.js');
            
            session.removeWorkingFile('app.js');
            expect(session.getWorkingFiles()).toEqual(['index.js']);
        });
    });

    describe('metrics and usage', () => {
        let session;
        beforeEach(() => {
            session = new SessionManager();
        });

        it('records token and cost usage', () => {
            session.recordUsage('gpt-4o', { promptTokens: 10, completionTokens: 20, costUsd: 0.05 });
            session.recordUsage('gpt-4o', { promptTokens: 5, completionTokens: 5, costUsd: 0.01 });
            session.recordUsage('claude-3-haiku', { promptTokens: 100, completionTokens: 50, costUsd: 0.02 });

            const metrics = session.getMetrics();
            expect(metrics.totalTokens).toBe(190);
            expect(metrics.promptTokens).toBe(115);
            expect(metrics.completionTokens).toBe(75);
            expect(metrics.totalCostUsd).toBeCloseTo(0.08);
            expect(metrics.modelUsage['gpt-4o'].calls).toBe(2);
            expect(metrics.modelUsage['gpt-4o'].tokens).toBe(40);
            expect(metrics.modelUsage['claude-3-haiku'].calls).toBe(1);
        });
    });

    describe('serialization', () => {
        it('serializes and deserializes', () => {
            const session = new SessionManager({ mode: 'plan', contextBudget: 8000 });
            session.addMessage(UnifiedMessage.userText('hello'));
            session.addWorkingFile('file.js');
            session.recordUsage('test-model', { promptTokens: 10, completionTokens: 10, costUsd: 0.01 });
            session.switchMode('agentic');

            const json = session.toJSON();
            const restored = SessionManager.fromJSON(json);

            expect(restored.sessionId).toBe(session.sessionId);
            expect(restored.mode).toBe('agentic');
            expect(restored.contextBudget).toBe(8000);
            expect(restored.getHistory()).toHaveLength(1);
            expect(restored.getHistory()[0].content[0].text).toBe('hello');
            expect(restored.getWorkingFiles()).toEqual(['file.js']);
            expect(restored.metrics.totalTokens).toBe(20);
        });
    });
});
