const open = require('open');
const chalk = require('chalk');
const { execSync, spawn } = require('child_process');

class GithubAuth {
    constructor(clientId = null) {
        this.scopes = ['repo', 'read:org', 'workflow'];
        this.description = 'Lorapok AI Agent';
        this.clientId = clientId; // For custom device flow (requires OAuth App)
    }

    getSmartAuthUrl() {
        const baseUrl = 'https://github.com/settings/tokens/new';
        const scopes = this.scopes.join(',');
        return `${baseUrl}?scopes=${scopes}&description=${encodeURIComponent(this.description)}`;
    }

    async openBrowser(url) {
        try {
            await open(url);
            return { opened: true, url };
        } catch (e) {
            return { opened: false, url };
        }
    }

    isDocker() {
        return process.env.LORAPOK_DOCKER === 'true';
    }

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

    // Check if GitHub CLI is installed
    isGhInstalled() {
        try {
            execSync('gh --version', { stdio: 'pipe' });
            return true;
        } catch (e) {
            return false;
        }
    }

    // Check if already authenticated with gh
    isGhAuthenticated() {
        try {
            const result = execSync('gh auth status', { stdio: 'pipe', encoding: 'utf-8' });
            return result.includes('Logged in');
        } catch (e) {
            return false;
        }
    }

    // Get token from gh cli
    getGhToken() {
        try {
            const token = execSync('gh auth token', { stdio: 'pipe', encoding: 'utf-8' }).trim();
            return token || null;
        } catch (e) {
            return null;
        }
    }

    // Run gh auth login with device flow (interactive)
    async runGhAuthLogin() {
        return new Promise((resolve, reject) => {
            console.log(chalk.cyan('\n🔐 Starting GitHub CLI Device Login...\n'));

            // Strip ALL potential tokens from environment for this process 
            // otherwise gh refuses to do interactive login
            const env = { ...process.env };
            Object.keys(env).forEach(key => {
                const upperKey = key.toUpperCase();
                if (upperKey.includes('TOKEN') || upperKey === 'GH_TOKEN') {
                    delete env[key];
                }
            });

            const child = spawn('gh', ['auth', 'login', '--web', '-h', 'github.com'], {
                stdio: 'inherit', // Interactive - show prompts to user
                shell: true,
                env
            });

            child.on('close', (code) => {
                const token = this.getGhToken();
                if (token) {
                    // Even if code is non-zero (e.g. failed to write git config),
                    // if we got a token, the login was successful.
                    resolve({ success: true, token });
                } else {
                    resolve({ success: false, error: `gh auth login failed (Exit code: ${code})` });
                }
            });

            child.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    // Custom OAuth Device Flow (requires clientId)
    async startDeviceFlow() {
        if (!this.clientId) {
            return {
                success: false,
                error: 'No OAuth App Client ID configured. Set GITHUB_CLIENT_ID env var or create one at: https://github.com/settings/developers'
            };
        }

        console.log(chalk.cyan('\n🔐 Starting GitHub Device Flow...\n'));

        try {
            // Step 1: Request device code
            const deviceCodeRes = await this.requestDeviceCode();
            if (!deviceCodeRes.success) return deviceCodeRes;

            const { device_code, user_code, verification_uri, interval, expires_in } = deviceCodeRes.data;

            // Step 2: Show code to user
            console.log(chalk.bold.yellow('\n╔════════════════════════════════════════════╗'));
            console.log(chalk.bold.yellow('║') + chalk.bold.white('       GITHUB DEVICE AUTHENTICATION        ') + chalk.bold.yellow('║'));
            console.log(chalk.bold.yellow('╠════════════════════════════════════════════╣'));
            console.log(chalk.bold.yellow('║') + chalk.white(' 1. Open: ') + chalk.underline.cyan(verification_uri) + chalk.white('       ') + chalk.bold.yellow('║'));
            console.log(chalk.bold.yellow('║') + chalk.white(' 2. Enter code: ') + chalk.bold.green(user_code) + chalk.white('              ') + chalk.bold.yellow('║'));
            console.log(chalk.bold.yellow('╚════════════════════════════════════════════╝\n'));

            // Try to open browser
            await this.openBrowser(verification_uri);

            // Step 3: Poll for token
            console.log(chalk.gray('Waiting for authorization (expires in ' + Math.floor(expires_in / 60) + ' min)...'));
            const tokenRes = await this.pollForToken(device_code, interval);

            return tokenRes;

        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async requestDeviceCode() {
        try {
            const body = new URLSearchParams({
                client_id: this.clientId,
                scope: this.scopes.join(' ')
            });

            const res = await fetch('https://github.com/login/device/code', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body
            });

            if (!res.ok) {
                return { success: false, error: `Request failed with status ${res.status}` };
            }

            const data = await res.json();
            if (data.device_code) {
                return { success: true, data };
            } else {
                return { success: false, error: data.error_description || 'Failed to get device code' };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async pollForToken(deviceCode, interval) {
        const maxAttempts = 60; // ~5 minutes
        let currentInterval = interval || 5;
        let attempts = 0;

        while (attempts < maxAttempts) {
            await this.sleep(currentInterval * 1000);
            attempts++;

            const result = await this.checkToken(deviceCode);

            if (result.success) {
                console.log(chalk.green('\n✅ Authentication successful!'));
                return result;
            }

            if (result.error === 'authorization_pending') {
                process.stdout.write(chalk.gray('.'));
                continue;
            }

            if (result.error === 'slow_down') {
                currentInterval += 5;
                process.stdout.write(chalk.yellow('!'));
                continue;
            }

            if (result.error === 'expired_token' || result.error === 'access_denied') {
                console.log(chalk.red('\n❌ ' + (result.errorDescription || result.error)));
                return { success: false, error: result.error };
            }

            // Other errors
            console.log(chalk.red(`\n❌ Error: ${result.errorDescription || result.error}`));
            return { success: false, error: result.error };
        }

        return { success: false, error: 'Timeout waiting for authorization' };
    }

    async checkToken(deviceCode) {
        try {
            const body = new URLSearchParams({
                client_id: this.clientId,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            });

            const res = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body
            });

            if (!res.ok) {
                return { success: false, error: `Token request failed: ${res.status}` };
            }

            const data = await res.json();
            if (data.access_token) {
                return { success: true, token: data.access_token, tokenType: data.token_type };
            } else {
                return { success: false, error: data.error, errorDescription: data.error_description };
            }
        } catch (e) {
            return { success: false, error: 'network_error', errorDescription: e.message };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = GithubAuth;
