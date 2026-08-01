'use strict';

const { ModeRouter } = require('../services/ModeRouter');

describe('ModeRouter', () => {
    it('initializes with default options', () => {
        const router = new ModeRouter();
        expect(router.inferMode).toBe(false);
        expect(router.defaultMode).toBe('chat');
    });

    describe('explicit routing', () => {
        let router;
        beforeEach(() => {
            router = new ModeRouter();
        });

        it('routes explicit /chat command', () => {
            const result = router.route('/chat how do I do X?');
            expect(result.mode).toBe('chat');
            expect(result.isExplicit).toBe(true);
            expect(result.input).toBe('how do I do X?');
        });

        it('routes explicit /plan command', () => {
            const result = router.route('/plan implement a database');
            expect(result.mode).toBe('plan');
            expect(result.isExplicit).toBe(true);
            expect(result.input).toBe('implement a database');
        });

        it('routes explicit /agent command to agentic', () => {
            const result = router.route('/agent build the app');
            expect(result.mode).toBe('agentic');
            expect(result.isExplicit).toBe(true);
            expect(result.input).toBe('build the app');
        });

        it('routes explicit /debug command to analysis', () => {
            const result = router.route('/debug trace this error');
            expect(result.mode).toBe('analysis');
            expect(result.isExplicit).toBe(true);
            expect(result.input).toBe('trace this error');
        });

        it('falls back to current mode if no explicit command', () => {
            const result = router.route('hello world', 'plan');
            expect(result.mode).toBe('plan');
            expect(result.isExplicit).toBe(false);
            expect(result.input).toBe('hello world');
        });

        it('handles empty input gracefully', () => {
            const result = router.route('', 'agentic');
            expect(result.mode).toBe('agentic');
            expect(result.isExplicit).toBe(false);
            expect(result.input).toBe('');
        });
    });

    describe('inference routing', () => {
        let router;
        beforeEach(() => {
            router = new ModeRouter({ inferMode: true });
        });

        it('infers plan mode from phrasing', () => {
            const result = router.route('outline the architecture for this app');
            expect(result.mode).toBe('plan');
            expect(result.isExplicit).toBe(false);
            expect(result.input).toBe('outline the architecture for this app');
        });

        it('infers agentic mode from phrasing', () => {
            const result = router.route('fix the bug in app.js');
            expect(result.mode).toBe('agentic');
            expect(result.isExplicit).toBe(false);
        });

        it('infers analysis mode from phrasing', () => {
            const result = router.route('investigate why the server is crashing');
            expect(result.mode).toBe('analysis');
            expect(result.isExplicit).toBe(false);
        });

        it('does not infer if phrasing is generic', () => {
            const result = router.route('what is the meaning of life?');
            expect(result.mode).toBe('chat');
            expect(result.isExplicit).toBe(false);
        });

        it('respects explicit commands over inference', () => {
            const result = router.route('/chat fix the bug in app.js');
            expect(result.mode).toBe('chat');
            expect(result.isExplicit).toBe(true);
            expect(result.input).toBe('fix the bug in app.js');
        });
    });

    describe('validateTransition', () => {
        let router;
        beforeEach(() => {
            router = new ModeRouter();
        });

        it('allows valid transitions', () => {
            const result = router.validateTransition('chat', 'plan');
            expect(result.allowed).toBe(true);
        });

        it('rejects invalid target mode', () => {
            const result = router.validateTransition('chat', 'magic');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Invalid target mode');
        });
    });

    describe('getModePermissions', () => {
        let router;
        beforeEach(() => {
            router = new ModeRouter();
        });

        it('returns correct permissions for chat', () => {
            expect(router.getModePermissions('chat')).toEqual({
                canExecuteTools: false, canWriteFiles: false, canRunCommands: false, requiresPlan: false
            });
        });

        it('returns correct permissions for plan', () => {
            expect(router.getModePermissions('plan')).toEqual({
                canExecuteTools: false, canWriteFiles: false, canRunCommands: false, requiresPlan: false
            });
        });

        it('returns correct permissions for agentic', () => {
            expect(router.getModePermissions('agentic')).toEqual({
                canExecuteTools: true, canWriteFiles: true, canRunCommands: true, requiresPlan: false
            });
        });

        it('returns correct permissions for analysis', () => {
            expect(router.getModePermissions('analysis')).toEqual({
                canExecuteTools: true, canWriteFiles: false, canRunCommands: true, requiresPlan: false
            });
        });

        it('defaults to safe permissions for unknown mode', () => {
            expect(router.getModePermissions('unknown')).toEqual({
                canExecuteTools: false, canWriteFiles: false, canRunCommands: false, requiresPlan: false
            });
        });
    });

    describe('setInferMode', () => {
        it('toggles inferMode dynamically', () => {
            const router = new ModeRouter({ inferMode: false });
            expect(router.inferMode).toBe(false);
            router.setInferMode(true);
            expect(router.inferMode).toBe(true);
        });
    });
});
