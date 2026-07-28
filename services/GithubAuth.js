/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Proprietary & Confidential. All Rights Reserved.
 */
'use strict';

const open = require('open');
const chalk = require('chalk');
const { execSync, spawn } = require('child_process');

/**
 * Service handling GitHub authentication via CLI, Web Token, and Device Flow.
 */
class GithubAuth {
    /**
     * @param {string|null} [clientId=null] - Optional OAuth Client ID for custom device flow
     */
    constructor(clientId = null) {
        this.scopes = ['repo', 'read:org', 'workflow'];
        this.description = 'Lorapok AI Agent';
        this.clientId = clientId;
    }

    /**
     * Generate personal access token creation URL with pre-filled scopes.
     * @returns {string} URL string
     */
    getSmartAuthUrl() {
        const baseUrl = 'https://github.com/settings/tokens/new';
        const scopes = this.scopes.join(',');
        return `${baseUrl}?scopes=${scopes}&description=${encodeURIComponent(this.description)}`;
    }

    /**
     * Attempt to launch default browser opening target URL.
     * @param {string} url - Target URL to open
     * @returns {Promise<{ success: boolean, data: { url: string, opened: boolean }, opened: boolean, url: string }>} Result status
     */
    async openBrowser(url) {
        if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
            return { success: true, data: { url, opened: false }, opened: false, url };
        }
        try {
            await open(url);
            return { success: true, data: { url, opened: true }, opened: true, url };
        } catch (e) {
            return { success: false, data: { url, opened: false }, opened: false, url, error: e.message };
        }
    }

    /**
     * Check if running inside Docker environment.
     * @returns {{ success: boolean, data: boolean }} Status object with boolean
     */
    isDocker() {
        const isDock = process.env.LORAPOK_DOCKER === 'true';
        return { success: true, data: isDock };
    }

    /**
     * Format CLI instructions banner for manual token creation.
     * @param {string} url - Token generation URL
     * @returns {string} Formatted instruction text
     */
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

    /**
     * Check if GitHub CLI (`gh`) is available in System PATH.
     * @returns {{ success: boolean, data: boolean }} Status object with boolean
     */
    isGhInstalled() {
        try {
            execSync('gh --version', { stdio: 'pipe' });
            return { success: true, data: true };
        } catch (e) {
            return { success: true, data: false };
        }
    }

    /**
     * Check if GitHub CLI is currently authenticated.
     * @returns {{ success: boolean, data: boolean }} Status object with boolean
     */
    isGhAuthenticated() {
        try {
            const result = execSync('gh auth status', { stdio: 'pipe', encoding: 'utf-8' });
            return { success: true, data: result.includes('Logged in') };
        } catch (e) {
            return { success: true, data: false };
        }
    }

    /**
     * Retrieve active token from GitHub CLI.
     * @returns {{ success: boolean, data?: string, error?: string }} Result object with token
     */
    getGhToken() {
        try {
            const token = execSync('gh auth token', { stdio: 'pipe', encoding: 'utf-8' }).trim();
            if (token) {
                return { success: true, data: token };
            }
            return { success: false, error: 'No GitHub CLI token found.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Launch interactive `gh auth login` process.
     * @returns {Promise<{ success: boolean, data?: { token: string }, token?: string, error?: string }>} Login result
     */
    async runGhAuthLogin() {
        return new Promise((resolve) => {
            console.log(chalk.cyan('\n🔐 Starting GitHub CLI Device Login...\n'));

            const env = { ...process.env };
            Object.keys(env).forEach(key => {
                const upperKey = key.toUpperCase();
                if (upperKey.includes('TOKEN') || upperKey === 'GH_TOKEN') {
                    delete env[key];
                }
            });

            const child = spawn('gh', ['auth', 'login', '--web', '-h', 'github.com'], {
                stdio: 'inherit',
                shell: true,
                env
            });

            child.on('close', (code) => {
                const tokenRes = this.getGhToken();
                if (tokenRes.success) {
                    resolve({ success: true, data: { token: tokenRes.data }, token: tokenRes.data });
                } else {
                    resolve({ success: false, error: `gh auth login failed (Exit code: ${code})` });
                }
            });

            child.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    /**
     * Start custom OAuth device code flow.
     * @returns {Promise<{ success: boolean, data?: { token: string, tokenType?: string }, token?: string, error?: string }>} Authentication result
     */
    async startDeviceFlow() {
        if (!this.clientId) {
            return {
                success: false,
                error: 'No OAuth App Client ID configured. Set GITHUB_CLIENT_ID env var or create one at: https://github.com/settings/developers'
            };
        }

        console.log(chalk.cyan('\n🔐 Starting GitHub Device Flow...\n'));

        try {
            const deviceCodeRes = await this.requestDeviceCode();
            if (!deviceCodeRes.success) return deviceCodeRes;

            const { device_code, user_code, verification_uri, interval, expires_in } = deviceCodeRes.data;

            console.log(chalk.bold.yellow('\n╔════════════════════════════════════════════╗'));
            console.log(chalk.bold.yellow('║') + chalk.bold.white('       GITHUB DEVICE AUTHENTICATION        ') + chalk.bold.yellow('║'));
            console.log(chalk.bold.yellow('╠════════════════════════════════════════════╣'));
            console.log(chalk.bold.yellow('║') + chalk.white(' 1. Open: ') + chalk.underline.cyan(verification_uri) + chalk.white('       ') + chalk.bold.yellow('║'));
            console.log(chalk.bold.yellow('║') + chalk.white(' 2. Enter code: ') + chalk.bold.green(user_code) + chalk.white('              ') + chalk.bold.yellow('║'));
            console.log(chalk.bold.yellow('╚════════════════════════════════════════════╝\n'));

            await this.openBrowser(verification_uri);

            console.log(chalk.gray('Waiting for authorization (expires in ' + Math.floor(expires_in / 60) + ' min)...'));
            const tokenRes = await this.pollForToken(device_code, interval);

            return tokenRes;

        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Request initial device and user authorization codes from GitHub.
     * @returns {Promise<{ success: boolean, data?: Object, error?: string }>} Device code response
     */
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

    /**
     * Poll GitHub OAuth API until user approves device flow.
     * @param {string} deviceCode - Device code string
     * @param {number} interval - Polling interval in seconds
     * @returns {Promise<{ success: boolean, data?: { token: string, tokenType?: string }, token?: string, error?: string }>} Token result
     */
    async pollForToken(deviceCode, interval) {
        const maxAttempts = 60;
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

            console.log(chalk.red(`\n❌ Error: ${result.errorDescription || result.error}`));
            return { success: false, error: result.error };
        }

        return { success: false, error: 'Timeout waiting for authorization' };
    }

    /**
     * Query GitHub API to check status of device code token.
     * @param {string} deviceCode - Active device code
     * @returns {Promise<{ success: boolean, data?: { token: string, tokenType?: string }, token?: string, tokenType?: string, error?: string, errorDescription?: string }>} Check response
     */
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
                return {
                    success: true,
                    data: { token: data.access_token, tokenType: data.token_type },
                    token: data.access_token,
                    tokenType: data.token_type
                };
            } else {
                return { success: false, error: data.error, errorDescription: data.error_description };
            }
        } catch (e) {
            return { success: false, error: 'network_error', errorDescription: e.message };
        }
    }

    /**
     * Asynchronous sleep helper.
     * @param {number} ms - Sleep duration in milliseconds
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = GithubAuth;
