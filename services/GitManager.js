const { execSync, exec } = require('child_process');
const path = require('path');

class GitManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = path.resolve(projectRoot);
        this.logger = null;
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
                ...options
            });
            const output = result.trim();
            if (this.logger && options.verbose !== false) this.logger(command, output, true);
            return { success: true, output };
        } catch (error) {
            const output = error.stdout?.trim() || error.stderr?.trim() || '';
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
    add(files = '.') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`add ${files}`);
    }

    // Commit changes
    commit(message) {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        if (!message || !message.trim()) {
            return { success: false, error: 'Commit message required' };
        }
        const escapedMessage = message.replace(/"/g, '\\"');
        return this.executeGit(`commit -m "${escapedMessage}"`);
    }

    // Push to remote
    push(branch = 'main', remote = 'origin') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`push ${remote} ${branch}`);
    }

    // Pull from remote
    pull(branch = 'main', remote = 'origin') {
        if (!this.isGitRepo()) {
            return { success: false, error: 'Not a git repository' };
        }
        return this.executeGit(`pull ${remote} ${branch}`);
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
                return { hash, author, date, message };
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
}

module.exports = GitManager;
