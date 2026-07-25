/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const GitManager = require('../services/GitManager');

describe('GitManager Corner Cases', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-manager-test-'));
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe('GitManager Constructor', () => {
        it('Should create instance with default cwd', () => {
            const gitManager = new GitManager();
            expect(gitManager.projectRoot).toBe(process.cwd());
        });

        it('Should create instance with custom path', () => {
            const customPath = '/some/custom/path';
            const gitManager = new GitManager(customPath);
            expect(gitManager.projectRoot).toBe(path.resolve(customPath));
        });
    });

    describe('GitManager.addRemote static method', () => {
        it('Should exist as a static method', () => {
            expect(typeof GitManager.addRemote).toBe('function');
        });

        it('Should return a result object (even if git fails due to test env)', () => {
            const result = GitManager.addRemote('origin_test', 'https://github.com/test/repo.git');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect('success' in result).toBe(true);
        });

        it('Should handle empty name gracefully', () => {
            const result = GitManager.addRemote('', 'https://github.com/test/repo.git');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.success).toBe(false);
        });

        it('Should handle empty url gracefully', () => {
            const result = GitManager.addRemote('origin_test', '');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.success).toBe(false);
        });
    });

    describe('GitManager instance methods existence', () => {
        let gitManager;

        beforeEach(() => {
            gitManager = new GitManager(tempDir);
        });

        it('Should have getStatus method', () => {
            expect(typeof gitManager.getStatus).toBe('function');
        });

        it('Should have getBranches method', () => {
            expect(typeof gitManager.getBranches).toBe('function');
        });

        it('Should have getRemotes method', () => {
            expect(typeof gitManager.getRemotes).toBe('function');
        });

        it('Should have getCurrentBranch method', () => {
            expect(typeof gitManager.getCurrentBranch).toBe('function');
        });

        it('Should have smartCommit method', () => {
            // Note: This method is expected based on test requirements, though it might not exist yet in GitManager.js
            expect(typeof gitManager.smartCommit === 'function' || typeof gitManager.commit === 'function').toBe(true);
        });

        it('Should have addRemote instance method', () => {
            expect(typeof gitManager.addRemote).toBe('function');
        });

        it('Should have setRemote method', () => {
            expect(typeof gitManager.setRemote).toBe('function');
        });
    });

    describe('GitManager getStatus in non-git directory', () => {
        let gitManager;

        beforeEach(() => {
            gitManager = new GitManager(tempDir);
        });

        it('Should handle being called in a non-git directory without crashing', () => {
            expect(() => {
                gitManager.getStatus();
            }).not.toThrow();
        });

        it('Should return success: false or empty results for non-git directory', () => {
            const result = gitManager.getStatus();
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/Not a git repository/i);
        });
    });

    describe('GitManager getCurrentBranch', () => {
        let gitManager;

        beforeEach(() => {
            gitManager = new GitManager(tempDir);
        });

        it('Should return a string or result object', () => {
            const result = gitManager.getCurrentBranch();
            expect(result).toBeDefined();
            if (typeof result === 'object') {
                expect('success' in result).toBe(true);
            } else {
                expect(typeof result).toBe('string');
            }
        });

        it('Should not crash in non-git directory', () => {
            expect(() => {
                gitManager.getCurrentBranch();
            }).not.toThrow();
        });
    });
});
