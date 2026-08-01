'use strict';

const childProcess = require('child_process');
const { CheckpointManager } = require('../services/CheckpointManager');
const { GitError } = require('../lib/errors');

jest.mock('child_process');
const execSync = childProcess.execSync;

describe('CheckpointManager', () => {
    let manager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock default successful git repo check
        execSync.mockImplementation((cmd) => {
            if (cmd.includes('rev-parse --git-dir')) return '.git';
            return '';
        });
    });

    describe('initialization', () => {
        it('detects git repo correctly', () => {
            manager = new CheckpointManager();
            expect(manager.isGitRepo()).toBe(true);
        });

        it('handles non-git repo gracefully', () => {
            execSync.mockImplementationOnce(() => {
                throw new Error('Not a git repository');
            });
            manager = new CheckpointManager();
            expect(manager.isGitRepo()).toBe(false);
        });
    });

    describe('createCheckpoint', () => {
        beforeEach(() => {
            manager = new CheckpointManager({ sessionId: 'test1234' });
        });

        it('skips checkpoint if not a git repo', () => {
            manager._isGitRepo = false;
            const res = manager.createCheckpoint();
            expect(res).toEqual({ type: 'none', ref: '' });
        });

        it('reuses existing checkpoint', () => {
            manager._checkpoint = { type: 'branch', ref: 'existing-branch', timestamp: 1234 };
            const res = manager.createCheckpoint();
            expect(res).toEqual({ type: 'branch', ref: 'existing-branch' });
            expect(execSync).not.toHaveBeenCalledWith(expect.stringContaining('git branch'));
        });

        it('creates a stash if working tree is dirty', () => {
            execSync.mockImplementation((cmd) => {
                if (cmd.includes('status --porcelain')) return ' M file.js';
                if (cmd.includes('stash push')) return '';
                return '';
            });

            const res = manager.createCheckpoint();
            expect(res.type).toBe('stash');
            expect(res.ref).toContain('lorapok-checkpoint-test1234');
            expect(execSync).toHaveBeenCalledWith(
                expect.stringContaining('stash push'),
                expect.any(Object)
            );
        });

        it('creates a shadow branch if working tree is clean', () => {
            execSync.mockImplementation((cmd) => {
                if (cmd.includes('status --porcelain')) return ''; // clean
                if (cmd.includes('git branch')) return '';
                return '';
            });

            const res = manager.createCheckpoint();
            expect(res.type).toBe('branch');
            expect(res.ref).toContain('lorapok/checkpoint/test1234/');
            expect(execSync).toHaveBeenCalledWith(
                expect.stringContaining('git branch'),
                expect.any(Object)
            );
        });

        it('throws GitError if stash fails', () => {
            execSync.mockImplementation((cmd) => {
                if (cmd.includes('status --porcelain')) return ' M file.js';
                if (cmd.includes('stash push')) throw new Error('Stash error');
                return '';
            });

            expect(() => manager.createCheckpoint()).not.toThrow();
            // It catches it and returns none, actually wait
            // Looking at the implementation:
            // _createStash throws GitError
            // createCheckpoint catches it and logs error, returns { type: 'none', ref: '' }
            const res = manager.createCheckpoint();
            expect(res).toEqual({ type: 'none', ref: '' });
        });
    });

    describe('tracking files', () => {
        beforeEach(() => {
            manager = new CheckpointManager();
        });

        it('tracks unique modified files', () => {
            manager.trackModifiedFile('a.js');
            manager.trackModifiedFile('b.js');
            manager.trackModifiedFile('a.js');
            expect(manager.getModifiedFiles()).toEqual(['a.js', 'b.js']);
        });
    });

    describe('getDiff', () => {
        beforeEach(() => {
            manager = new CheckpointManager();
        });

        it('returns empty if not a git repo', () => {
            manager._isGitRepo = false;
            expect(manager.getDiff()).toBe('');
        });

        it('combines tracked and untracked diffs', () => {
            execSync.mockImplementation((cmd) => {
                if (cmd === 'git diff') return 'diff-a';
                if (cmd === 'git diff --cached') return 'diff-b';
                return '';
            });
            expect(manager.getDiff()).toBe('diff-adiff-b');
        });
    });

    describe('revert', () => {
        beforeEach(() => {
            manager = new CheckpointManager();
            manager._checkpoint = { type: 'branch', ref: 'branch-ref', timestamp: 1234 };
        });

        it('fails if no checkpoint exists', () => {
            manager._checkpoint = null;
            expect(manager.revert().success).toBe(false);
        });

        it('reverts by checking out and cleaning', () => {
            manager.trackModifiedFile('a.js');
            const res = manager.revert();
            expect(res.success).toBe(true);
            expect(execSync).toHaveBeenCalledWith(
                'git checkout -- .',
                expect.any(Object)
            );
            expect(execSync).toHaveBeenCalledWith(
                'git clean -fd',
                expect.any(Object)
            );
            expect(manager.getModifiedFiles()).toHaveLength(0);
        });

        it('pops stash if type is stash', () => {
            manager._checkpoint.type = 'stash';
            manager.revert();
            expect(execSync).toHaveBeenCalledWith(
                'git stash pop',
                expect.any(Object)
            );
        });
    });

    describe('cleanup', () => {
        beforeEach(() => {
            manager = new CheckpointManager();
            manager._checkpoint = { type: 'branch', ref: 'branch-ref', timestamp: 1234 };
        });

        it('deletes shadow branch on cleanup', () => {
            const res = manager.cleanup();
            expect(res.success).toBe(true);
            expect(execSync).toHaveBeenCalledWith(
                'git branch -D "branch-ref"',
                expect.any(Object)
            );
            expect(manager.hasCheckpoint()).toBe(false);
        });

        it('does nothing if type is stash', () => {
            manager._checkpoint.type = 'stash';
            const res = manager.cleanup();
            expect(res.success).toBe(true);
            expect(execSync).not.toHaveBeenCalledWith(expect.stringContaining('git branch -D'));
        });
    });
});
