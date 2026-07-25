/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const { GitError } = require('../lib/errors');

/**
 * Helper to redact sensitive tokens, credentials, and URLs from strings.
 * @param {string} text - Raw input string
 * @returns {string} Redacted string
 */
function redactTokens(text) {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/https:\/\/[^/\s@]+@/gi, 'https://***@')
        .replace(/gh[pousr]_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{16,}/gi, '***');
}

/**
 * Service for Git repository operations, credentials management, and remote interaction.
 */
class GitManager {
    /**
     * Static helper to add remote without explicit instantiation.
     * @param {string} name - Remote name
     * @param {string} url - Remote URL
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Result of addRemote operation
     */
    static addRemote(name, url) {
        const manager = new GitManager();
        return manager.addRemote(name, url);
    }

    /**
     * @param {string} [projectRoot=process.cwd()] - Project root directory path
     */
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = path.resolve(projectRoot);
        this.logger = null; // Callback for logging: (cmd, output, success) => {}
    }

    /**
     * Set active logging callback for Git command execution.
     * @param {Function} logger - Logging callback function (cmd, output, success) => void
     */
    setLogger(logger) {
        this.logger = logger;
    }

    /**
     * Execute arbitrary Git command synchronously.
     * @param {string} command - Git command string (without leading 'git ')
     * @param {Object} [options={}] - Execution options
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Standardized result object
     */
    executeGit(command, options = {}) {
        const redactedCmd = redactTokens(command);
        try {
            const result = execSync(`git ${command}`, {
                cwd: this.projectRoot,
                encoding: 'utf-8',
                stdio: options.silent ? 'pipe' : undefined,
                env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
                ...options
            });
            const output = redactTokens(result.trim());
            if (this.logger && options.verbose !== false) {
                this.logger(redactedCmd, output, true);
            }
            return { success: true, data: output, output };
        } catch (error) {
            const rawOutput = error.stdout?.trim() || error.stderr?.trim() || '';
            const output = redactTokens(rawOutput);
            const errorMsg = redactTokens(error.message);
            if (this.logger && options.verbose !== false) {
                this.logger(redactedCmd, output, false);
            }
            return {
                success: false,
                data: output,
                error: errorMsg,
                output
            };
        }
    }

    /**
     * Check if directory is a valid Git repository work tree.
     * @returns {{ success: boolean, data: boolean }} Operation result containing boolean status
     */
    isGitRepo() {
        const result = this.executeGit('rev-parse --is-inside-work-tree', { silent: true });
        const isRepo = result.success && result.output === 'true';
        return { success: true, data: isRepo };
    }

    /**
     * Internal helper to verify repository state.
     * @private
     */
    _checkRepo() {
        const isRepoRes = this.isGitRepo();
        return typeof isRepoRes === 'boolean' ? isRepoRes : isRepoRes.data;
    }

    /**
     * Initialize new Git repository.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Result status
     */
    initRepo() {
        if (this._checkRepo()) {
            return { success: true, data: 'Already a git repository', message: 'Already a git repository' };
        }
        return this.executeGit('init');
    }

    /**
     * Get raw porcelain Git status output.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Result status
     */
    getStatus() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('status --porcelain');
    }

    /**
     * Get formatted Git status with file status descriptions.
     * @returns {{ success: boolean, data?: { files: Array<Object>, total: number }, files?: Array<Object>, total?: number, error?: string }} Status object
     */
    getFormattedStatus() {
        const result = this.getStatus();
        if (!result.success) return result;

        const lines = (result.output || '').split('\n').filter(l => l.trim());
        const files = lines.map(line => {
            const status = line.substring(0, 2);
            const file = line.substring(3);

            let statusText;
            switch (status.trim()) {
                case 'M': statusText = 'Modified'; break;
                case 'A': statusText = 'Added'; break;
                case 'D': statusText = 'Deleted'; break;
                case 'R': statusText = 'Renamed'; break;
                case 'C': statusText = 'Copied'; break;
                case '??': statusText = 'Untracked'; break;
                case 'MM': statusText = 'Modified (staged & unstaged)'; break;
                default: statusText = status;
            }

            return { status: statusText, file };
        });

        const payload = { files, total: files.length };
        return { success: true, data: payload, files, total: files.length };
    }

    /**
     * Add files to Git staging area.
     * @param {string} [files='.'] - Target file pattern
     * @param {Object} [options={}] - Command options
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Execution result
     */
    add(files = '.', options = {}) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`add ${files}`, options);
    }

    /**
     * Commit staged changes.
     * @param {string} message - Commit message
     * @param {Object} [options={}] - Command options
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Commit result
     */
    commit(message, options = {}) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        if (!message || !message.trim()) {
            return { success: false, error: 'Commit message required' };
        }
        const escapedMessage = message.replace(/"/g, '\\"');
        return this.executeGit(`commit -m "${escapedMessage}"`, options);
    }

    /**
     * Push commits to remote branch.
     * @param {string} [branch='main'] - Target branch name
     * @param {string} [remote='origin'] - Target remote name
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Push result
     */
    push(branch = 'main', remote = 'origin') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const repoPath = this.getRepoPathFromRemote(remote);
        const targetPath = typeof repoPath === 'string' ? repoPath : repoPath.data;
        const cmd = token
            ? `push https://${token}@github.com/${targetPath} ${branch}`
            : `push ${remote} ${branch}`;

        return this.executeGit(cmd);
    }

    /**
     * Helper to extract user/repo from remote URL.
     * @param {string} [remoteName='origin'] - Name of remote
     * @returns {{ success: boolean, data: string }} Result object containing repository path string
     */
    getRepoPathFromRemote(remoteName = 'origin') {
        let res = this.executeGit(`remote get-url ${remoteName}`, { silent: true, verbose: false });

        if (!res.success || !res.output) {
            res = this.executeGit(`config --get remote.${remoteName}.url`, { silent: true, verbose: false });
        }

        if (!res.success || !res.output) {
            const listRes = this.executeGit('remote', { silent: true, verbose: false });
            if (listRes.success && listRes.output) {
                const remotes = listRes.output.split('\n').map(r => r.trim()).filter(Boolean);
                for (const r of remotes) {
                    const rRes = this.executeGit(`remote get-url ${r}`, { silent: true, verbose: false });
                    if (rRes.success && rRes.output) {
                        res = rRes;
                        break;
                    }
                }
            }
        }

        // Direct .git/config fallback inspection
        if (!res.success || !res.output) {
            try {
                const gitConfigPath = path.join(this.projectRoot, '.git', 'config');
                if (fs.existsSync(gitConfigPath)) {
                    const content = fs.readFileSync(gitConfigPath, 'utf8');
                    const matchUrl = content.match(/url\s*=\s*(.+)/i);
                    if (matchUrl) {
                        res = { success: true, output: matchUrl[1].trim() };
                    }
                }
            } catch { }
        }

        if (!res.success || !res.output) return { success: false, data: '' };

        const rawUrl = res.output.trim();
        const match = rawUrl.match(/github\.com[:/]([^/]+\/[^/\s#?]+)/i);
        if (!match) return { success: false, data: '' };

        let pathStr = match[1].replace(/\.git$/i, '').trim();
        return { success: Boolean(pathStr), data: pathStr };
    }

    /**
     * Pull commits from remote branch.
     * @param {string} [branch='main'] - Target branch name
     * @param {string} [remote='origin'] - Target remote name
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Pull result
     */
    pull(branch = 'main', remote = 'origin') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const repoPath = this.getRepoPathFromRemote(remote);
        const targetPath = typeof repoPath === 'string' ? repoPath : repoPath.data;
        const cmd = token
            ? `pull https://${token}@github.com/${targetPath} ${branch}`
            : `pull ${remote} ${branch}`;
        return this.executeGit(cmd);
    }

    /**
     * Create new branch.
     * @param {string} branchName - Name of new branch
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    createBranch(branchName) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`checkout -b ${branchName}`);
    }

    /**
     * Switch to existing branch.
     * @param {string} branchName - Target branch name
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    switchBranch(branchName) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`checkout ${branchName}`);
    }

    /**
     * Get active current branch name.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Result object with branch name
     */
    getCurrentBranch() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('rev-parse --abbrev-ref HEAD');
    }

    /**
     * List all local and remote branches.
     * @returns {{ success: boolean, data?: Array<Object>, branches?: Array<Object>, error?: string }} Branches list
     */
    getBranches() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const result = this.executeGit('branch -a');
        if (!result.success) return result;

        const branches = (result.output || '').split('\n')
            .map(b => b.trim())
            .filter(b => b)
            .map(b => ({
                name: b.replace(/^\*\s*/, ''),
                current: b.startsWith('*')
            }));

        return { success: true, data: branches, branches };
    }

    /**
     * Get commit log history.
     * @param {number} [count=10] - Number of commits to fetch
     * @returns {{ success: boolean, data?: Array<Object>, commits?: Array<Object>, error?: string }} Commit history list
     */
    getLog(count = 10) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const format = '--format="%h|%an|%ar|%s"';
        const result = this.executeGit(`log -${count} ${format}`);

        if (!result.success) return result;

        const commits = (result.output || '').split('\n')
            .filter(l => l.trim())
            .map(line => {
                const [hash, author, date, message] = line.split('|');
                return { hash, author, date, message, subject: message };
            });

        return { success: true, data: commits, commits };
    }

    /**
     * Get diff output for file or repository.
     * @param {string} [filePath=''] - Optional file path filter
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Diff output
     */
    getDiff(filePath = '') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`diff ${filePath}`);
    }

    /**
     * Stash uncommitted changes.
     * @param {string} [message=''] - Stash message description
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Stash result
     */
    stash(message = '') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = message ? `stash push -m "${message}"` : 'stash';
        return this.executeGit(cmd);
    }

    /**
     * Pop top stash entry.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Stash pop result
     */
    stashPop() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash pop');
    }

    /**
     * Configure or add remote repository URL.
     * @param {string} name - Remote name
     * @param {string} url - Remote URL
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    setRemote(name, url) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const addResult = this.executeGit(`remote add ${name} ${url}`);
        if (!addResult.success) {
            return this.executeGit(`remote set-url ${name} ${url}`);
        }
        return addResult;
    }

    /**
     * Get remotes overview string.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Remotes summary
     */
    getRemotes() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('remote -v');
    }

    /**
     * Merge target branch into current branch.
     * @param {string} branchName - Branch to merge
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Merge result
     */
    merge(branchName) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`merge ${branchName}`);
    }

    /**
     * Reset HEAD to specified target.
     * @param {string} [target='HEAD'] - Commit target
     * @param {string} [mode='--mixed'] - Reset mode flag
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Reset result
     */
    reset(target = 'HEAD', mode = '--mixed') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`reset ${mode} ${target}`);
    }

    /**
     * Amend previous commit.
     * @param {string} [message=''] - New commit message
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Amend result
     */
    amendCommit(message = '') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = message ? `commit --amend -m "${message.replace(/"/g, '\\"')}"` : 'commit --amend --no-edit';
        return this.executeGit(cmd);
    }

    /**
     * Get repository tags list.
     * @returns {{ success: boolean, data?: Array<string>, tags?: Array<string>, error?: string }} Tags list
     */
    getTags() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const result = this.executeGit('tag');
        if (!result.success) return result;
        const tags = (result.output || '').split('\n').filter(t => t.trim());
        return {
            success: true,
            data: tags,
            tags
        };
    }

    /**
     * Create new Git tag.
     * @param {string} name - Tag name
     * @param {string} [message=''] - Tag annotation message
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Creation result
     */
    createTag(name, message = '') {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = message ? `tag -a ${name} -m "${message.replace(/"/g, '\\"')}"` : `tag ${name}`;
        return this.executeGit(cmd);
    }

    /**
     * Clean untracked files.
     * @param {boolean} [dryRun=false] - If true perform dry run check
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Clean result
     */
    clean(dryRun = false) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = dryRun ? 'clean -nd' : 'clean -fd';
        return this.executeGit(cmd);
    }

    /**
     * Get count of staged files.
     * @returns {{ success: boolean, data: number }} Count of staged files
     */
    getStagedCount() {
        const result = this.executeGit('diff --name-only --cached', { silent: true });
        if (!result.success) return { success: true, data: 0 };
        const count = (result.output || '').split('\n').filter(l => l.trim()).length;
        return { success: true, data: count };
    }

    /**
     * Get list of merge conflict file paths.
     * @returns {{ success: boolean, data: Array<string> }} Conflict files list
     */
    getConflicts() {
        const result = this.executeGit('diff --name-only --diff-filter=U', { silent: true });
        if (!result.success) return { success: true, data: [] };
        const conflicts = (result.output || '').split('\n').filter(l => l.trim());
        return { success: true, data: conflicts };
    }

    /**
     * Get detailed remotes metadata list.
     * @returns {{ success: boolean, data?: Array<Object>, remotes?: Array<Object>, error?: string }} Detailed remotes list
     */
    getRemotesDetailed() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const result = this.executeGit('remote -v');
        if (!result.success) return result;

        const lines = (result.output || '').split('\n').filter(l => l.trim());
        const remotes = {};
        lines.forEach(line => {
            const [name, urlAndType] = line.split('\t');
            if (!urlAndType) return;
            const [url, type] = urlAndType.split(' ');
            if (!remotes[name]) remotes[name] = { name, fetch: '', push: '', url: '' };
            const typeKey = type.replace(/[()]/g, '');
            remotes[name][typeKey] = url;
            if (typeKey === 'fetch' || !remotes[name].url) remotes[name].url = url;
        });

        const list = Object.values(remotes);
        return { success: true, data: list, remotes: list };
    }

    /**
     * Add or update remote repository configuration.
     * @param {string} name - Remote name (e.g. 'origin')
     * @param {string} url - Remote URL
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    addRemote(name, url) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const res = this.executeGit(`remote add ${name} ${url}`);
        if (!res.success && ((res.error && res.error.includes('already exists')) || (res.output && res.output.includes('already exists')))) {
            return this.executeGit(`remote set-url ${name} ${url}`);
        }
        return res;
    }

    /**
     * Remove remote repository configuration.
     * @param {string} name - Remote name
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    removeRemote(name) {
        return this.executeGit(`remote remove ${name}`);
    }

    /**
     * Rename remote repository.
     * @param {string} oldName - Old remote name
     * @param {string} newName - New remote name
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    renameRemote(oldName, newName) {
        return this.executeGit(`remote rename ${oldName} ${newName}`);
    }

    /**
     * Cherry-pick specific commit hash.
     * @param {string} hash - Commit hash
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    cherryPick(hash) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`cherry-pick ${hash}`);
    }

    /**
     * Check ignore rule details for file path.
     * @param {string} filePath - File path to inspect
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Check result
     */
    checkIgnore(filePath) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`check-ignore -v ${filePath}`);
    }

    /**
     * List all ignored files in work tree.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Ignored files output
     */
    listIgnored() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('ls-files --others --ignored --exclude-standard');
    }

    /**
     * Get active Git user configuration (name and email).
     * @returns {{ success: boolean, data: { name: string, email: string } }} User config result
     */
    getUserConfig() {
        const name = this.executeGit('config user.name', { silent: true });
        const email = this.executeGit('config user.email', { silent: true });
        return {
            success: true,
            data: {
                name: name.success ? name.output : 'Not set',
                email: email.success ? email.output : 'Not set'
            }
        };
    }

    /**
     * List all stashes.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Stashes list
     */
    getStashes() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash list');
    }

    /**
     * Clear all stash entries.
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    stashClear() {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash clear');
    }

    /**
     * Configure user identity locally or globally.
     * @param {string} name - User full name
     * @param {string} email - User email address
     * @param {boolean} [global=false] - Global flag
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Configuration status
     */
    configUser(name, email, global = false) {
        const flag = global ? '--global' : '';
        const resName = this.executeGit(`config ${flag} user.name "${name.replace(/"/g, '\\"')}"`);
        if (!resName.success) return resName;
        return this.executeGit(`config ${flag} user.email "${email.replace(/"/g, '\\"')}"`);
    }

    /**
     * Save stash with message description.
     * @param {string} [message=''] - Stash message
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    stashSave(message = '') {
        return this.stash(message);
    }

    /**
     * Apply specific stash index.
     * @param {number} [index=0] - Stash index
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Operation result
     */
    stashApply(index = 0) {
        if (!this._checkRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`stash apply stash@{${index}}`);
    }

    /**
     * Convert HTTPS remote URL to SSH format.
     * @param {string} [remoteName='origin'] - Target remote name
     * @returns {{ success: boolean, data?: string, message?: string, error?: string }} Conversion result
     */
    convertToSSH(remoteName = 'origin') {
        const res = this.executeGit(`remote get-url ${remoteName}`, { silent: true });
        if (!res.success) return res;

        const currentUrl = (res.output || '').trim();
        if (currentUrl.startsWith('git@')) {
            return { success: true, data: 'Already using SSH', message: 'Already using SSH' };
        }

        const match = currentUrl.match(/github\.com[:/](.+?)(\.git)?$/);
        if (!match) return { success: false, error: 'Could not parse GitHub URL' };

        const newUrl = `git@github.com:${match[1]}.git`;
        return this.setRemote(remoteName, newUrl);
    }

    /**
     * Test SSH connectivity to GitHub.
     * @returns {{ success: boolean, data: boolean }} Test result
     */
    testSSHConnection() {
        try {
            this.executeGit('ls-remote git@github.com:check/ssh_check', { timeout: 3000 });
        } catch (e) {
            const sshDirs = require('fs').existsSync('/root/.ssh') && require('fs').readdirSync('/root/.ssh').length > 0;
            return { success: sshDirs, data: sshDirs };
        }
        return { success: true, data: true };
    }

    /**
     * Configure global token auth for unified GitHub credentials.
     * @param {string} token - GitHub token string
     * @returns {{ success: boolean, data?: string, output?: string, error?: string }} Result status
     */
    configureTokenAuth(token) {
        if (!token) return { success: false, error: 'Token required' };
        const cleanToken = token.trim();
        return this.executeGit(`config --global url."https://${cleanToken}@github.com/".insteadOf "https://github.com/"`);
    }
}

module.exports = GitManager;
