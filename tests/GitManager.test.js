const GitManager = require('../services/GitManager');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('GitManager', () => {
    let testDir;
    let gm;

    beforeEach(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-git-test-'));
        gm = new GitManager(testDir);
    });

    afterEach(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    test('should detect if not a git repo', () => {
        expect(gm.isGitRepo()).toBe(false);
    });

    test('should initialize git repo', () => {
        const result = gm.initRepo();
        expect(result.success).toBe(true);
        expect(fs.existsSync(path.join(testDir, '.git'))).toBe(true);
    });

    test('should get formatted status', () => {
        gm.initRepo();
        fs.writeFileSync(path.join(testDir, 'new.txt'), 'hello');
        const status = gm.getFormattedStatus();
        expect(status.success).toBe(true);
        expect(status.total).toBe(1);
        expect(status.files[0].file).toBe('new.txt');
    });

    test('should add and commit changes', () => {
        gm.initRepo();
        // Set git user for test environment
        execSync('git config user.email "test@example.com"', { cwd: testDir });
        execSync('git config user.name "Test User"', { cwd: testDir });

        fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');
        gm.add('file.txt');
        const commitResult = gm.commit('feat: test commit');
        expect(commitResult.success).toBe(true);

        const log = gm.getLog(1);
        expect(log.success).toBe(true);
        expect(log.commits[0].message).toBe('feat: test commit');
    });

    test('should get branches', () => {
        gm.initRepo();
        fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');
        execSync('git config user.email "test@example.com"', { cwd: testDir });
        execSync('git config user.name "Test User"', { cwd: testDir });
        gm.add('.');
        gm.commit('initial');

        const branches = gm.getBranches();
        expect(branches.success).toBe(true);
        expect(branches.branches.length).toBeGreaterThan(0);
    });
});
