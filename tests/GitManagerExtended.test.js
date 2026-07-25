/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const GitManager = require('../services/GitManager');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

describe('GitManager Comprehensive Suite', () => {
    let gitManager;
    let testDir;

    beforeAll(() => {
        testDir = path.join(os.tmpdir(), `lorapok-git-test-${Date.now()}`);
        fs.mkdirSync(testDir, { recursive: true });
        gitManager = new GitManager(testDir);
        gitManager.initRepo();

        // Configure identity for tests
        gitManager.executeGit('config user.name "Test User"');
        gitManager.executeGit('config user.email "test@example.com"');
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    test('Advanced Commits: should amend a commit', () => {
        fs.writeFileSync(path.join(testDir, 'file.txt'), 'hello');
        gitManager.add('file.txt');
        gitManager.commit('Initial commit');

        fs.writeFileSync(path.join(testDir, 'file.txt'), 'hello updated');
        gitManager.add('file.txt');
        const res = gitManager.amendCommit('Amended commit');

        expect(res.success).toBe(true);
        const log = gitManager.getLog(1);
        expect(log.commits[0].subject).toBe('Amended commit');
    });

    test('Stash Management: should stash and pop changes', () => {
        fs.writeFileSync(path.join(testDir, 'stash_test.txt'), 'original');
        gitManager.add('stash_test.txt');
        gitManager.commit('save stash base');

        fs.writeFileSync(path.join(testDir, 'stash_test.txt'), 'dirty');
        const stashRes = gitManager.stashSave('experimental changes');
        expect(stashRes.success).toBe(true);

        const stashes = gitManager.getStashes();
        expect(stashes.output).toContain('experimental changes');

        const popRes = gitManager.stashPop();
        expect(popRes.success).toBe(true);
        expect(fs.readFileSync(path.join(testDir, 'stash_test.txt'), 'utf8')).toBe('dirty');
    });

    test('Remote Management: should handle remotes', () => {
        const remoteUrl = 'https://github.com/example/repo.git';
        gitManager.setRemote('origin', remoteUrl);

        const remotes = gitManager.getRemotesDetailed();
        expect(remotes.success).toBe(true);
        expect(remotes.remotes[0].name).toBe('origin');
        expect(remotes.remotes[0].url).toContain('github.com/example/repo.git');

        gitManager.renameRemote('origin', 'upstream');
        const renamed = gitManager.getRemotesDetailed();
        expect(renamed.remotes[0].name).toBe('upstream');

        gitManager.removeRemote('upstream');
        const empty = gitManager.getRemotesDetailed();
        expect(empty.remotes.length).toBe(0);
    });

    test('Diagnostics: should check ignored files', () => {
        fs.writeFileSync(path.join(testDir, '.gitignore'), 'ignored.txt');
        fs.writeFileSync(path.join(testDir, 'ignored.txt'), 'secrets');

        const check = gitManager.checkIgnore('ignored.txt');
        expect(check.success).toBe(true);
        expect(check.output).toContain('ignored.txt');
    });

    test('Clean Ops: should handle dry-run clean', () => {
        fs.writeFileSync(path.join(testDir, 'untracked.tmp'), 'temp');
        const res = gitManager.clean(true); // dry run
        expect(res.success).toBe(true);
        expect(res.output).toContain('untracked.tmp');
        expect(fs.existsSync(path.join(testDir, 'untracked.tmp'))).toBe(true);
    });

    test('Security: should redact embedded tokens in executeGit log, output, and error', () => {
        let loggedCmd = '';
        let loggedOut = '';
        gitManager.setLogger((cmd, out, success) => {
            loggedCmd = cmd;
            loggedOut = out;
        });

        const sensitiveToken = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
        const sensitiveCmd = `ls-remote https://${sensitiveToken}@github.com/nonexistent/repo.git`;
        const res = gitManager.executeGit(sensitiveCmd, { silent: true });

        expect(res.success).toBe(false);
        expect(res.error).not.toContain(sensitiveToken);
        expect(res.error).toContain('***');
        expect(loggedCmd).not.toContain(sensitiveToken);
        expect(loggedCmd).toContain('***');
        expect(loggedOut).not.toContain(sensitiveToken);
    });
});
