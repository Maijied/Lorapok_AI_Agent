const open = require('open');
const chalk = require('chalk');

class GithubAuth {
    constructor() {
        this.scopes = ['repo', 'read:org', 'workflow'];
        this.description = 'Lorapok AI Agent';
    }

    getSmartAuthUrl() {
        const baseUrl = 'https://github.com/settings/tokens/new';
        const scopes = this.scopes.join(',');
        return `${baseUrl}?scopes=${scopes}&description=${encodeURIComponent(this.description)}`;
    }

    async openBrowser(url) {
        // In Docker: browser won't open, but we try anyway
        // Always returns the URL for display
        try {
            await open(url);
            return { opened: true, url };
        } catch (e) {
            return { opened: false, url };
        }
    }

    // Check if running in Docker
    isDocker() {
        return process.env.LORAPOK_DOCKER === 'true';
    }

    // Get professional auth instructions
    getAuthInstructions(url) {
        const lines = [
            chalk.bold.cyan('🔐 GitHub Authentication Required'),
            '',
            chalk.white('1. Open this URL in your browser:'),
            chalk.underline.yellow(url),
            '',
            chalk.white('2. Scroll down and click ') + chalk.green('"Generate token"'),
            chalk.white('3. Copy the token and paste it below'),
        ];
        return lines.join('\n');
    }
}

module.exports = GithubAuth;
