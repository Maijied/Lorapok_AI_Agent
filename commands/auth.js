/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const boxen = require('boxen');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');
const { menuChoice, backChoice } = require('../lib/menu-format');

/**
 * Helper function to configure GitHub token across agent, config, and environment.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - LorapokConfig instance
 * @param {string} token - GitHub personal access token
 * @returns {void}
 */
function applyToken(agent, config, token) {
    process.env.GH_TOKEN = token;
    process.env.GITHUB_TOKEN = token;
    config.setGitHubToken(token);
    agent.gitManager.configureTokenAuth(token);
}

/**
 * Display interactive GitHub authentication management menu.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - LorapokConfig instance
 * @returns {Promise<void>}
 */
async function showAuthMenu(agent, config) {
    const GithubAuth = require('../services/GithubAuth');
    const clientId = process.env.GITHUB_CLIENT_ID || null;
    const ghAuth = new GithubAuth(clientId);

    while (true) {
        const token = config.getGitHubToken();
        const ghTokenRes = ghAuth.getGhToken();
        const ghToken = ghTokenRes.success ? ghTokenRes.data : null;
        const isGhInstalled = ghAuth.isGhInstalled().data;

        let statusText = '';
        if (token || ghToken) {
            statusText = chalk.green('✅ Authenticated');
            if (ghToken && !token) statusText += chalk.gray(' (via GitHub CLI)');
        } else {
            statusText = chalk.red('❌ Not Authenticated');
        }

        console.log(boxen(
            chalk.cyan.bold('🔐 GitHub Authentication\n\n') + statusText,
            { padding: 1, borderStyle: 'round', borderColor: (token || ghToken) ? 'green' : 'red' }
        ));

        const choices = [];

        if (isGhInstalled) {
            choices.push(menuChoice('gh_login', '📱', 'Device Login (GitHub CLI) - Recommended'));
        }
        if (clientId) {
            choices.push(menuChoice('device_flow', '📲', 'Device Login (Custom OAuth)'));
        }

        choices.push(menuChoice('generate', '🌐', 'Generate Token (Browser)'));
        choices.push(menuChoice('token', '🔑', 'Enter Access Token Manually'));
        choices.push(menuChoice('password', '🔒', 'Enter GitHub Password (Legacy)'));
        choices.push(menuChoice('clear', '🗑', 'Clear Credentials'));
        choices.push(backChoice());

        const select = new Select({
            message: 'Choose authentication method:',
            choices
        });

        const action = await select.run().catch(() => 'back');
        if (action === 'back') break;

        if (action === 'gh_login') {
            const result = await ghAuth.runGhAuthLogin();
            const activeToken = result.data?.token || result.token;
            if (result.success && activeToken) {
                applyToken(agent, config, activeToken);
                console.log(TerminalUI.formatSuccess('Logged in via GitHub CLI! Token synced.'));
            } else {
                console.log(TerminalUI.formatError(result.error || 'Login failed'));
            }

        } else if (action === 'device_flow') {
            const result = await ghAuth.startDeviceFlow();
            const activeToken = result.data?.token || result.token;
            if (result.success && activeToken) {
                applyToken(agent, config, activeToken);
                console.log(TerminalUI.formatSuccess('Device authentication successful! Token synced.'));
            } else {
                console.log(TerminalUI.formatError(result.error || 'Device flow failed'));
            }

        } else if (action === 'generate') {
            const url = ghAuth.getSmartAuthUrl();
            const result = await ghAuth.openBrowser(url);

            console.log('\n' + boxen(
                ghAuth.getAuthInstructions(url),
                { padding: 1, borderStyle: 'double', borderColor: 'yellow' }
            ));

            if (!result.opened) {
                console.log(chalk.yellow('\n⚠️  Browser could not be opened (Docker environment).'));
                console.log(chalk.white('   Please manually copy the URL above.\n'));
            }

            const newToken = await new Input({ message: 'Paste your new token:' }).run();
            if (newToken && newToken.trim()) {
                applyToken(agent, config, newToken.trim());
                console.log(TerminalUI.formatSuccess('Token saved! Git & Actions are now synced.'));
            }

        } else if (action === 'token') {
            console.log(chalk.cyan('\n📋 Enter your GitHub Personal Access Token'));
            console.log(chalk.gray('   (Get one at: https://github.com/settings/tokens)\n'));

            const newToken = await new Input({ message: 'Token:' }).run();
            if (newToken && newToken.trim()) {
                applyToken(agent, config, newToken.trim());
                console.log(TerminalUI.formatSuccess('Token saved! Git & Actions are now synced.'));
            }

        } else if (action === 'password') {
            console.log(chalk.yellow('\n⚠️  GitHub no longer supports password authentication for Git.'));
            console.log(chalk.white('   You must use a Personal Access Token instead.'));
            console.log(chalk.gray('   Generate one at: https://github.com/settings/tokens\n'));

            const confirm = await new Select({
                message: 'Would you like to generate a token instead?',
                choices: ['Yes, open token page', 'No, go back']
            }).run();

            if (confirm === 'Yes, open token page') {
                const url = ghAuth.getSmartAuthUrl();
                await ghAuth.openBrowser(url);
                console.log('\n' + boxen(
                    ghAuth.getAuthInstructions(url),
                    { padding: 1, borderStyle: 'double', borderColor: 'yellow' }
                ));

                const newToken = await new Input({ message: 'Paste your new token:' }).run();
                if (newToken && newToken.trim()) {
                    applyToken(agent, config, newToken.trim());
                    console.log(TerminalUI.formatSuccess('Token saved! Git & Actions are now synced.'));
                }
            }

        } else if (action === 'clear') {
            config.setGitHubToken(null);
            process.env.GH_TOKEN = '';
            process.env.GITHUB_TOKEN = '';
            agent.gitManager.executeGit('config --global --unset url."https://@github.com/".insteadOf', { silent: true });
            console.log(TerminalUI.formatSuccess('Credentials cleared.'));
        }

        await new Input({ message: 'Press Enter to continue' }).run().catch(() => null);
    }
}

module.exports = {
    showAuthMenu,
    applyToken
};
