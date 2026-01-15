const { execSync, exec } = require('child_process');
const path = require('path');

class GitManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = path.resolve(projectRoot);
        this.logger = null; // Callback for logging: (cmd, output, success) => {}
    }

    setLogger(logger) {
        this.logger = logger;
    }

    // Execute git command
    executeGit(command, options = {}) {
        try {
            const result = execSync(`git ${command}`, {
                cwd: this.projectRoot,
                encoding: 'utf-8',
                stdio: options.silent ? 'pipe' : undefined,
                env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
                ...options
            });
            const output = result.trim();
            // Only log if logger is set AND verbose is not explicitly false
            if (this.logger && options.verbose !== false) this.logger(command, output, true);
            return { success: true, output };
        } catch (error) {
            const output = error.stdout?.trim() || error.stderr?.trim() || '';
            // Only log if logger is set AND verbose is not explicitly false
            if (this.logger && options.verbose !== false) this.logger(command, output, false);
            return {
                success: false,
                error: error.message,
                output
            };
        }
    }

    // Check if directory is a git repo
    isGitRepo() {
        const result = this.executeGit('rev-parse --is-inside-work-tree', { silent: true });
        return result.success && result.output === 'true';
    }

    // Initialize git repo
    initRepo() {
        if (this.isGitRepo()) {
            return { success: true, message: 'Already a git repository' };
        }
        return this.executeGit('init');
    }

    // Get git status
    getStatus() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('status --porcelain');
    }

    // Get formatted status
    getFormattedStatus() {
        const result = this.getStatus();
        if (!result.success) return result;

        const lines = result.output.split('\n').filter(l => l.trim());
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

        return { success: true, files, total: files.length };
    }

    // Add files to staging
    add(files = '.', options = {}) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`add ${files}`, options);
    }

    // Commit changes
    commit(message, options = {}) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        if (!message || !message.trim()) {
            return { success: false, error: 'Commit message required' };
        }
        const escapedMessage = message.replace(/"/g, '\\"');
        return this.executeGit(`commit -m "${escapedMessage}"`, options);
    }

    // Push to remote
    push(branch = 'main', remote = 'origin') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const cmd = token
            ? `push https://${token}@github.com/${this.getRepoPathFromRemote(remote)} ${branch}`
            : `push ${remote} ${branch}`;

        return this.executeGit(cmd);
    }

    // Helper to extract user/repo from remote URL
    getRepoPathFromRemote(remoteName) {
        const res = this.executeGit(`remote get-url ${remoteName}`, { silent: true });
        if (!res.success) return '';
        // Extract 'user/repo.git' or 'user/repo'
        const match = res.output.match(/github\.com[:/](.+?)(\.git)?$/);
        return match ? match[1] : '';
    }

    // Pull from remote
    pull(branch = 'main', remote = 'origin') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const cmd = token
            ? `pull https://${token}@github.com/${this.getRepoPathFromRemote(remote)} ${branch}`
            : `pull ${remote} ${branch}`;
        return this.executeGit(cmd);
    }

    // Create new branch
    createBranch(branchName) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`checkout -b ${branchName}`);
    }

    // Switch branch
    switchBranch(branchName) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`checkout ${branchName}`);
    }

    // Get current branch
    getCurrentBranch() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('rev-parse --abbrev-ref HEAD');
    }

    // List all branches
    getBranches() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const result = this.executeGit('branch -a');
        if (!result.success) return result;

        const branches = result.output.split('\n')
            .map(b => b.trim())
            .filter(b => b)
            .map(b => ({
                name: b.replace(/^\*\s*/, ''),
                current: b.startsWith('*')
            }));

        return { success: true, branches };
    }

    // Get commit log
    getLog(count = 10) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const format = '--format="%h|%an|%ar|%s"';
        const result = this.executeGit(`log -${count} ${format}`);

        if (!result.success) return result;

        const commits = result.output.split('\n')
            .filter(l => l.trim())
            .map(line => {
                const [hash, author, date, message] = line.split('|');
                return { hash, author, date, message, subject: message };
            });

        return { success: true, commits };
    }

    // Get diff for file
    getDiff(filePath = '') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`diff ${filePath}`);
    }

    // Stash changes
    stash(message = '') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = message ? `stash push -m "${message}"` : 'stash';
        return this.executeGit(cmd);
    }

    // Pop stash
    stashPop() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash pop');
    }

    // Set remote
    setRemote(name, url) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        // Try to add, if exists try to set-url
        const addResult = this.executeGit(`remote add ${name} ${url}`);
        if (!addResult.success) {
            return this.executeGit(`remote set-url ${name} ${url}`);
        }
        return addResult;
    }

    // Get remotes
    getRemotes() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('remote -v');
    }

    // Merge branch
    merge(branchName) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`merge ${branchName}`);
    }

    // Reset to commit
    reset(target = 'HEAD', mode = '--mixed') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`reset ${mode} ${target}`);
    }

    // Amend last commit
    amendCommit(message = '') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = message ? `commit --amend -m "${message.replace(/"/g, '\\"')}"` : 'commit --amend --no-edit';
        return this.executeGit(cmd);
    }

    // Get tags
    getTags() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const result = this.executeGit('tag');
        if (!result.success) return result;
        return {
            success: true,
            tags: result.output.split('\n').filter(t => t.trim())
        };
    }

    // Create tag
    createTag(name, message = '') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = message ? `tag -a ${name} -m "${message.replace(/"/g, '\\"')}"` : `tag ${name}`;
        return this.executeGit(cmd);
    }

    // Clean untracked files
    clean(dryRun = false) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const cmd = dryRun ? 'clean -nd' : 'clean -fd';
        return this.executeGit(cmd);
    }

    // Get staged changes count
    getStagedCount() {
        const result = this.executeGit('diff --name-only --cached', { silent: true });
        if (!result.success) return 0;
        return result.output.split('\n').filter(l => l.trim()).length;
    }

    // Get merge conflicts
    getConflicts() {
        const result = this.executeGit('diff --name-only --diff-filter=U', { silent: true });
        if (!result.success) return [];
        return result.output.split('\n').filter(l => l.trim());
    }

    // Get remotes with URLs
    getRemotesDetailed() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        const result = this.executeGit('remote -v');
        if (!result.success) return result;

        const lines = result.output.split('\n').filter(l => l.trim());
        const remotes = {};
        lines.forEach(line => {
            const [name, urlAndType] = line.split('\t');
            if (!urlAndType) return;
            const [url, type] = urlAndType.split(' ');
            if (!remotes[name]) remotes[name] = { name, fetch: '', push: '', url: '' };
            const typeKey = type.replace(/[()]/g, '');
            remotes[name][typeKey] = url;
            // Also set 'url' for simple access (prefers fetch)
            if (typeKey === 'fetch' || !remotes[name].url) remotes[name].url = url;
        });

        return { success: true, remotes: Object.values(remotes) };
    }

    // Remove remote
    removeRemote(name) {
        return this.executeGit(`remote remove ${name}`);
    }

    // Rename remote
    renameRemote(oldName, newName) {
        return this.executeGit(`remote rename ${oldName} ${newName}`);
    }

    // Cherry pick
    cherryPick(hash) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`cherry-pick ${hash}`);
    }

    // Check why a file is ignored
    checkIgnore(filePath) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`check-ignore -v ${filePath}`);
    }

    // List all ignored files
    listIgnored() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('ls-files --others --ignored --exclude-standard');
    }

    // Get current user config
    getUserConfig() {
        const name = this.executeGit('config user.name', { silent: true });
        const email = this.executeGit('config user.email', { silent: true });
        return {
            name: name.success ? name.output : 'Not set',
            email: email.success ? email.output : 'Not set'
        };
    }

    // List stashes
    getStashes() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash list');
    }

    // Clear all stashes
    stashClear() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash clear');
    }

    // Pop stash
    stashPop() {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit('stash pop');
    }

    // Configure user identity
    configUser(name, email, global = false) {
        const flag = global ? '--global' : '';
        const resName = this.executeGit(`config ${flag} user.name "${name.replace(/"/g, '\\"')}"`);
        if (!resName.success) return resName;
        return this.executeGit(`config ${flag} user.email "${email.replace(/"/g, '\\"')}"`);
    }

    // Save stash (alias for tests)
    stashSave(message = '') {
        return this.stash(message);
    }

    // Apply stash
    stashApply(index = 0) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`stash apply stash@{${index}}`);
    }

    // Convert HTTPS remote to SSH
    convertToSSH(remoteName = 'origin') {
        const res = this.executeGit(`remote get-url ${remoteName}`, { silent: true });
        if (!res.success) return res;

        const currentUrl = res.output.trim();
        if (currentUrl.startsWith('git@')) {
            return { success: true, message: 'Already using SSH' };
        }

        const match = currentUrl.match(/github\.com[:/](.+?)(\.git)?$/);
        if (!match) return { success: false, error: 'Could not parse GitHub URL' };

        const newUrl = `git@github.com:${match[1]}.git`;
        return this.setRemote(remoteName, newUrl);
    }

    // Test SSH Connection
    testSSHConnection() {
        // ssh -T returns 1 on success (welcome message) but prints to stderr/stdout
        // We handle the specific exit code or output
        try {
            this.executeGit('ls-remote git@github.com:check/ssh_check', { timeout: 3000 });
        } catch (e) {
            // It might fail on the repo check, but if we get "Permission denied (publickey)", keys are missing.
            // A better check is the simple ssh command but executeGit wraps git.
            // Let's use a "blind" check: if we can fetch refs from a known public repo via SSH without password prompt, it works.
            // Actually, best is just checking if ~/.ssh exists and has files.
            const sshDirs = require('fs').existsSync('/root/.ssh') && require('fs').readdirSync('/root/.ssh').length > 0;
            return { success: sshDirs };
        }
        return { success: true };
    }

    // Configure global token auth for unified credentials
    configureTokenAuth(token) {
        if (!token) return { success: false, error: 'Token required' };
        // We use global config to ensure manual git commands also pick it up
        // url."https://${token}@github.com/".insteadOf "https://github.com/"
        const cleanToken = token.trim();
        return this.executeGit(`config --global url."https://${cleanToken}@github.com/".insteadOf "https://github.com/"`);
    }
}

module.exports = GitManager;
