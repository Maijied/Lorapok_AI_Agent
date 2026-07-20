const GitManager = require('../services/GitManager');
const GithubAuth = require('../services/GithubAuth');
const path = require('path');

// Mock dependencies
jest.mock('../services/GitManager', () => {
    return class MockGitManager {
        testSSHConnection() { return { success: true }; }
        convertToSSH() { return { success: true }; }
        isGitRepo() { return true; }
        executeGit() { return { success: true, output: 'https://github.com/user/repo.git' }; }
    };
});

describe('Auth System Components', () => {
    test('GithubAuth generates correct smart link', () => {
        const auth = new GithubAuth();
        const url = auth.getSmartAuthUrl();
        expect(url).toContain('https://github.com/settings/tokens/new');
        expect(url).toContain('scopes=repo,read:org,workflow');
    });

    test('GitManager mocks exist', () => {
        const git = new GitManager();
        expect(git.testSSHConnection().success).toBe(true);
        expect(git.convertToSSH().success).toBe(true);
    });
    test('openBrowser handles success and failure', async () => {
        const auth = new GithubAuth();
        expect(auth.openBrowser).toBeDefined();
        // openBrowser now returns { opened: boolean, url: string }
        const res = await auth.openBrowser('http://example.com');
        expect(typeof res).toBe('object');
        expect(res).toHaveProperty('opened');
        expect(res).toHaveProperty('url');
    });
});
