#!/usr/bin/env node
/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Proprietary & Confidential. All Rights Reserved.
 */
'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { program } = require('commander');
const { Select, Input } = require('enquirer');

// Fix for Node 24+ and Enquirer interaction (prevents ERR_USE_AFTER_CLOSE crash on Ctrl+C)
const readline = require('readline');
const originalPause = readline.Interface.prototype.pause;
readline.Interface.prototype.pause = function() {
    try {
        originalPause.call(this);
    } catch (e) {
        if (e.code !== 'ERR_USE_AFTER_CLOSE') throw e;
    }
};

const { LorapokEnhancedAgent } = require('./lib/agent-enhanced');
const { LorapokConfig } = require('./lib/config');
const TerminalUI = require('./lib/ui');
const { setCwd, handleError } = require('./commands/utils');
const { handleChat } = require('./commands/chat');
const { dispatchSlashCommand } = require('./commands/system');

let agent, config;

/**
 * Session usage and metrics state.
 */
const sessionData = {
    id: Math.random().toString(36).substring(2, 10).toUpperCase(),
    count: 0,
    successRate: 100,
    startTime: Date.now(),
    tokens: { prompt: 0, completion: 0, total: 0 },
    modelUsage: {}
};


let ctrlCCount = 0;
let ctrlCTimer = null;
const setupExitHandlers = () => {
    process.on('SIGINT', () => {
        ctrlCCount++;
        if (ctrlCCount >= 2) {
            if (ctrlCTimer) clearTimeout(ctrlCTimer);
            if (sessionData) {
                TerminalUI.showInteractionSummary(sessionData);
            }
            process.exit(0);
        }

        // Single Ctrl+C does nothing silently
        if (ctrlCTimer) clearTimeout(ctrlCTimer);
        ctrlCTimer = setTimeout(() => {
            ctrlCCount = 0;
        }, 1200);
    });

    process.on('uncaughtException', (err) => {
        const msg = String(err && err.message ? err.message : err);
        if (!msg || msg.includes('cancelled') || msg.includes('readline was closed')) {
            return;
        }
        console.error(chalk.red('\n❌ Uncaught Exception:'), msg);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        const msg = String(reason && reason.message ? reason.message : reason);
        if (!msg || msg.includes('cancelled') || msg.includes('readline was closed')) {
            return;
        }
        console.error(chalk.red('\n❌ Unhandled Rejection:'), msg);
    });
};

/**
 * Initialize agent configuration, API keys, Git credentials, and active workspace.
 * @returns {Promise<void>}
 */
async function initialization() {
    config = new LorapokConfig();
    const existingToken = config.getGitHubToken();
    if (existingToken) {
        process.env.GH_TOKEN = existingToken;
        process.env.GITHUB_TOKEN = existingToken;
    }

    const hasAnyKey = Boolean(
        config.getApiKey() ||
        (typeof config.getGoogleApiKey === 'function' && config.getGoogleApiKey()) ||
        (typeof config.getOpenRouterApiKey === 'function' && config.getOpenRouterApiKey()) ||
        (typeof config.getPerplexityApiKey === 'function' && config.getPerplexityApiKey()) ||
        process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ||
        process.env.OPENROUTER_API_KEY || process.env.PERPLEXITY_API_KEY
    );
    if (!hasAnyKey) {
        console.log(TerminalUI.formatError('No API key found.'));
        console.log(chalk.gray('  Add GEMINI_API_KEY, OPENROUTER_API_KEY, or PERPLEXITY_API_KEY — or enter one below.'));
        const keyType = new Select({
            message: 'Which provider key will you add?',
            choices: [
                { name: 'google', message: '✨ Google AI Studio (GEMINI_API_KEY)' },
                { name: 'openrouter', message: '🔵 OpenRouter' },
                { name: 'perplexity', message: '🟣 Perplexity' }
            ]
        });
        const which = await keyType.run().catch(() => 'google');
        const prompt = new Input({ message: 'Paste API key:' });
        const newKey = await prompt.run().catch(() => null);
        if (!newKey) process.exit(1);
        const trimmed = newKey.trim();
        if (which === 'google' && typeof config.setGoogleApiKey === 'function') config.setGoogleApiKey(trimmed);
        else if (which === 'openrouter' && typeof config.setOpenRouterApiKey === 'function') config.setOpenRouterApiKey(trimmed);
        else config.setApiKey(trimmed);
    }

    if (config.isFirstRun()) {
        console.log(chalk.cyan.bold('\n🐛 Welcome to Lorapok!'));
        const namePrompt = new Input({
            message: 'What should I call you?',
            initial: process.env.USER || 'Developer'
        });
        const userName = await namePrompt.run();
        config.setUserName(userName || 'Developer');
        console.log(chalk.green(`\nNice to meet you, ${config.getUserName()}! 🚀\n`));
    }

    const projectRoot = process.env.LORAPOK_DOCKER === 'true' && fs.existsSync('/project')
        ? '/project'
        : process.cwd();

    agent = new LorapokEnhancedAgent(config.getApiKey(), projectRoot);
    setCwd(projectRoot);

    agent.gitManager.setLogger((cmd, out, success) => {
        TerminalUI.showGitProcess(cmd, out, success);
    });

    if (existingToken) {
        agent.gitManager.configureTokenAuth(existingToken);
    }

    const identityRes = agent.gitManager.getUserConfig();
    const identity = identityRes.data || identityRes;
    if (identity.name === 'Not set' || identity.email === 'Not set') {
        process.stdout.write(chalk.yellow('\n⚠️  Git identity not found. '));
        const setup = new Select({
            message: 'Configure Git identity now?',
            choices: ['Yes', 'No (Commits might fail)']
        });
        const choice = await setup.run().catch(() => 'No');
        if (choice === 'Yes') {
            const name = await new Input({ message: 'Git user.name:', initial: config.getUserName() || '' }).run();
            const email = await new Input({ message: 'Git user.email:' }).run();
            if (name && email) {
                const globalSetup = new Select({ message: 'Config scope?', choices: ['Global', 'Local'] });
                const scope = (await globalSetup.run()) === 'Global';
                const res = agent.gitManager.configUser(name, email, scope);
                if (res.success) console.log(TerminalUI.formatSuccess(`Git identity configured (${scope ? 'Global' : 'Local'}).`));
                else console.log(TerminalUI.formatError(`Failed to set identity: ${res.error}`));
            }
        }
    }

    const displayPath = projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : projectRoot;
    console.log(chalk.gray(`\n  📂 Workspace: ${chalk.white.bold(displayPath)}`));
}

/**
 * Interactive fuzzy slash command autocomplete palette prompt.
 * @returns {Promise<string|null>} Selected command string or null
 */
async function promptSlashAutoComplete() {
    const { AutoComplete } = require('enquirer');
    const { getAutocompleteChoices } = require('./commands/registry');
    const prompt = new AutoComplete({
        name: 'command',
        message: 'Select Slash Command:',
        limit: 14,
        styles: {
            underline: str => str,
            em: chalk.cyan.bold
        },
        pointer(choice, i) {
            return this.state.index === i ? chalk.cyan.bold('❯ ') : '  ';
        },
        suggest(input, choices) {
            return choices.filter(c => !c.role && c.message.toLowerCase().includes(input.toLowerCase()));
        },
        choices: getAutocompleteChoices(chalk),
        result(name) { return this.map(name)[name]; }
    });
    return await prompt.run().catch(() => null);
}

/**
 * Interactive fuzzy file autocomplete selector prompt.
 * @param {Object} agent - Lorapok agent instance
 * @returns {Promise<string|null>} Selected file path string or null
 */
async function promptFileAutoComplete(agent) {
    const { AutoComplete } = require('enquirer');
    const filesRes = agent.fileManager.listFiles('.', { recursive: true });
    const rawFileList = Array.isArray(filesRes) ? filesRes : (filesRes && filesRes.data ? filesRes.data : []);

    if (rawFileList.length === 0) {
        console.log(chalk.yellow('\nNo files found in workspace.'));
        return null;
    }

    rawFileList.sort((a, b) => {
        const aIsDir = typeof a === 'object' && (a.type === 'directory' || a.isDirectory);
        const bIsDir = typeof b === 'object' && (b.type === 'directory' || b.isDirectory);
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        const aPath = typeof a === 'string' ? a : (a.path || a.name || String(a));
        const bPath = typeof b === 'string' ? b : (b.path || b.name || String(b));
        return aPath.localeCompare(bPath);
    });

    const choices = [
        { name: 'cancel', message: '❌ Return to Chat (Cancel)' }
    ];

    rawFileList.forEach(f => {
        const filePath = typeof f === 'string' ? f : (f.path || f.name || String(f));
        if (!filePath) return;
        const isDir = typeof f === 'object' && (f.type === 'directory' || f.isDirectory);
        const icon = TerminalUI.getFileIcon(filePath, isDir);
        
        const path = require('path');
        const basename = path.basename(filePath);
        const dirname = path.dirname(filePath);
        
        const displayPath = dirname === '.' 
            ? chalk.bold(basename) 
            : `${chalk.bold(basename)}  ${chalk.gray(dirname + '/')}`;

        choices.push({ 
            name: `@${filePath}`, 
            message: `  ${icon} ${displayPath}` 
        });
    });

    const prompt = new AutoComplete({
        name: 'file',
        message: 'Select File/Folder to attach:',
        limit: 15,
        styles: { underline: str => str, em: chalk.cyan.bold },
        pointer(choice, i) { return this.state.index === i ? chalk.cyan.bold('❯ ') : '  '; },
        suggest(input, choices) {
            return choices.filter(c => c.message.toLowerCase().includes(input.toLowerCase()));
        },
        choices: choices
    });

    const selected = await prompt.run().catch(() => 'cancel');
    if (selected === 'cancel' || selected === '❌ Return to Chat (Cancel)' || !selected) {
        return null;
    }
    return selected;
}

/**
 * Main interactive REPL chat loop handling user prompts and command dispatch.
 * @returns {Promise<void>}
 */
async function chatLoop() {
    const userName = config.getUserName() || 'Developer';
    const context = { agent, config, sessionData, ui: TerminalUI };
    let currentMode = 'chat';

    while (true) {
        try {
            const bypassActive = config.getAutoApprove();
            const statusTag = bypassActive ? chalk.green(' [BYPASS ON]') : '';
            const modeTag = chalk.cyan.bold(` (${currentMode})`);

            const inputPrompt = new Input({
                message: chalk.cyan.bold(`🧑‍💻 ${userName}`) + modeTag + statusTag + chalk.cyan.bold(' › ')
            });

            let input = await inputPrompt.run().catch(() => null);

            if (input === null) {
                ctrlCCount++;
                if (ctrlCCount >= 2) {
                    console.log(chalk.gray('\nExiting Lorapok AI...'));
                    break;
                }
                console.log(chalk.yellow('\n(Press Ctrl+C again to exit)'));
                if (ctrlCTimer) clearTimeout(ctrlCTimer);
                ctrlCTimer = setTimeout(() => { ctrlCCount = 0; }, 2000);
                continue;
            } else {
                ctrlCCount = 0;
            }
            input = input.trim();
            if (!input) continue;

            if (input === '/' || input.startsWith('/')) {
                let targetCmd = input;
                if (input === '/') {
                    const selected = await promptSlashAutoComplete();
                    if (!selected) continue;
                    targetCmd = selected;
                }

                const rawCmd = targetCmd.replace(/^\//, '').trim().split(/\s+/)[0].toLowerCase();
                if (['chat', 'plan', 'analyze', 'git', 'actions', 'files', 'status', 'commit', 'diff'].includes(rawCmd)) {
                    currentMode = rawCmd;
                }

                const result = await dispatchSlashCommand(targetCmd, context);
                if (result && result.mode) currentMode = result.mode;
                if (result && result.exit) break;
                continue;
            }

            if (input === '@' || input.startsWith('@')) {
                let selectedFile = null;
                if (input === '@') {
                    selectedFile = await promptFileAutoComplete(agent);
                    if (!selectedFile) continue;
                } else {
                    selectedFile = input.split(/\s+/)[0];
                }

                const msgPrompt = new Input({
                    message: chalk.cyan.bold(`💬 Question about ${selectedFile}: `)
                });
                const userMsg = await msgPrompt.run().catch(() => null);
                if (!userMsg) continue;
                input = `${selectedFile} ${userMsg}`;
            }

            const lowerInput = input.toLowerCase();
            if (lowerInput === 'exit' || lowerInput === 'quit' || lowerInput === '/q') break;

            await handleChat(input, context);

        } catch (err) {
            await handleError(err, agent, config);
        }
    }
}

/**
 * Application entry point for CLI command parsing and initialization.
 * @returns {Promise<void>}
 */
async function main() {
    setupExitHandlers();
    await initialization();

    if (process.argv.length > 2) {
        program.parse(process.argv);
        return;
    }

    const pkg = require('./package.json');
    const displayPath = agent.projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : agent.projectRoot;

    await TerminalUI.animateLogo(1500, config.getBrandingFont(), pkg.version);
    TerminalUI.showHeader(pkg.version, config.getModel(), displayPath, config);
    TerminalUI.showWelcome();

    await chatLoop();

    TerminalUI.showInteractionSummary(sessionData);
    process.exit(0);
}

const pkg = require('./package.json');

program
    .name('lorapok')
    .version(`${pkg.name} v${pkg.version}\nBuilt with 🐛 by Lorapok Labs (https://lorapok.tech)`, '-v, --version', 'output the current version')
    .option('-m, --model <modelName>', 'Set active LLM model for the session')
    .option('-y, --yes, --bypass, --yolo', 'Enable Auto-Approve bypass mode (auto-applies file actions & shell commands)')
    .action((options) => {
        if (options.model) {
            process.env.LORAPOK_MODEL = options.model;
        }
        if (options.yes || options.bypass || options.yolo) {
            process.env.LORAPOK_AUTO_APPROVE = 'true';
        }
        main();
    });


program.parse(process.argv);
