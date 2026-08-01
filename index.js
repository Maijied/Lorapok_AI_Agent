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
const { getTheme, getDefaultThemeId } = require('./lib/theme');
const { ActiveModelService } = require('./services/ActiveModelService');
const { WorkspaceService } = require('./services/WorkspaceService');
const { setCwd, handleError } = require('./commands/utils');
const { handleChat } = require('./commands/chat');
const { dispatchSlashCommand } = require('./commands/system');

const { SessionManager } = require('./services/SessionManager');
const { ModeRouter } = require('./services/ModeRouter');
const { Orchestrator } = require('./services/Orchestrator');
const { PolicyEngine } = require('./services/PolicyEngine');
const { ModelRouter } = require('./services/ModelRouter');
const { ToolRuntime, createBuiltinTools } = require('./services/ToolRuntime');

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
            const finish = () => process.exit(0);
            if (sessionData) {
                TerminalUI.exitSession(sessionData)
                    .then(finish)
                    .catch(finish);
                return;
            }
            finish();
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
        limit: 18,
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
 * REPL input with instant @ trigger (no Enter required).
 * @returns {Promise<string|null|'__AT__'>}
 */
async function promptReplLine(theme) {
    const readline = require('readline');
    return new Promise((resolve) => {
        const prefix = `${theme.primary('❯')} `;
        process.stdout.write(prefix);
        let buf = '';
        const wasRaw = process.stdin.isRaw;
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();

        const cleanup = () => {
            process.stdin.removeListener('keypress', onKey);
            if (process.stdin.isTTY) {
                try { process.stdin.setRawMode(Boolean(wasRaw)); } catch (_) { /* ignore */ }
            }
        };

        const onKey = (str, key) => {
            if (key && key.ctrl && key.name === 'c') {
                cleanup();
                process.stdout.write('\n');
                resolve(null);
                return;
            }
            if (key && (key.name === 'return' || key.name === 'enter')) {
                cleanup();
                process.stdout.write('\n');
                resolve(buf);
                return;
            }
            if (key && (key.name === 'backspace' || key.name === 'delete')) {
                if (buf.length > 0) {
                    buf = buf.slice(0, -1);
                    process.stdout.write('\b \b');
                }
                return;
            }
            if (str === '@' && buf.length === 0) {
                cleanup();
                process.stdout.write('@\n');
                resolve('__AT__');
                return;
            }
            if (str && str.length === 1 && !key?.ctrl && !key?.meta) {
                buf += str;
                process.stdout.write(str);
            }
        };

        process.stdin.on('keypress', onKey);
    });
}

/**
 * Main interactive REPL chat loop handling user prompts and command dispatch.
 * @returns {Promise<void>}
 */
async function chatLoop() {
    const userName = config.getUserName() || 'Developer';

    const modelRouter = new ModelRouter(agent.modelManager);
    const policyEngine = new PolicyEngine(config.getAutoApprove ? config.getAutoApprove() : false);
    const toolRuntime = new ToolRuntime();
    const builtins = createBuiltinTools(agent.projectRoot);
    for (const t of Object.values(builtins)) toolRuntime.register(t);

    const orchestrator = new Orchestrator({
        modelRouter,
        policyEngine,
        toolRuntime,
        budget: {
            maxToolCalls: typeof config.getMaxToolCalls === 'function' ? config.getMaxToolCalls() : 25,
            maxTokens: typeof config.getMaxTokens === 'function' ? config.getMaxTokens() : 0,
            maxCostUsd: typeof config.getMaxCostUsd === 'function' ? config.getMaxCostUsd() : 0
        },
        maxRepeatedFailures: 3
    });

    const modeRouter = new ModeRouter();
    const sessionManager = new SessionManager();

    const context = { agent, config, sessionData, ui: TerminalUI, orchestrator, modeRouter, sessionManager };
    let currentMode = 'chat';
    const activeModelService = new ActiveModelService(agent.modelManager);
    const { SessionStore } = require('./services/SessionStore');
    const sessionStore = new SessionStore(config.configDir);

    let lastSuggestions = [];

    while (true) {
        try {
            const theme = getTheme(config.getBrandingFont() || getDefaultThemeId());
            const bypassActive = config.getAutoApprove();
            const modelStatus = activeModelService.getStatus(
                config,
                agent.availableModels || {},
                sessionData
            );
            const leftBits = [
                theme.muted('\u25C6') + ' ' + theme.color('text', userName),
                currentMode !== 'chat' ? theme.muted(currentMode) : null,
                bypassActive ? theme.success('bypass') : null
            ].filter(Boolean).join(theme.muted(' | '));
            const ctxColor = modelStatus.ctxTone === 'success' ? theme.success
                : modelStatus.ctxTone === 'warning' ? theme.warning
                    : theme.error;
            const modelLabel = modelStatus.shortName || 'model';
            const rightBits = theme.color('modelBadge', `${modelStatus.icon || '\u26A1'} ${modelLabel}`) +
                theme.muted(' | ') + ctxColor(`${modelStatus.contextPct ?? 100}%`);
            console.log(theme.rule());
            console.log(theme.statusBar(leftBits, rightBits));
            console.log(theme.rule());

            if (lastSuggestions && lastSuggestions.length > 0) {
                console.log(chalk.cyan('\n💡 Suggested Next Questions:'));
                lastSuggestions.forEach((sq, i) => {
                    console.log(`  ${chalk.gray(`[${i + 1}]`)} ${sq}`);
                });
                console.log();
            }

            let input = await promptReplLine(theme);

            if (input && /^[1-9]$/.test(input.trim()) && lastSuggestions && lastSuggestions.length > 0) {
                const index = parseInt(input.trim(), 10) - 1;
                if (lastSuggestions[index]) {
                    input = lastSuggestions[index];
                    console.log(chalk.gray(`> ${input}`));
                }
            }
            
            lastSuggestions = [];

            if (input === null) {
                ctrlCCount++;
                if (ctrlCCount >= 2) {
                    break;
                }
                console.log(chalk.yellow('\n(Press Ctrl+C again to exit)'));
                if (ctrlCTimer) clearTimeout(ctrlCTimer);
                ctrlCTimer = setTimeout(() => { ctrlCCount = 0; }, 2000);
                continue;
            } else {
                ctrlCCount = 0;
            }

            if (input === '__AT__' || input === '@' || (typeof input === 'string' && input.startsWith('@'))) {
                let selectedFile = null;
                if (input === '__AT__' || input === '@') {
                    selectedFile = await promptFileAutoComplete(agent);
                    if (!selectedFile) continue;
                } else {
                    selectedFile = input.split(/\s+/)[0];
                }

                const msgPrompt = new Input({
                    message: theme.color('info', `Question about ${selectedFile}`)
                });
                const userMsg = await msgPrompt.run().catch(() => null);
                if (!userMsg) continue;
                input = `${selectedFile} ${userMsg}`;
            }

            input = String(input || '').trim();
            if (!input) continue;

            if (input === '/' || input.startsWith('/')) {
                let targetCmd = input;
                if (input === '/') {
                    const selected = await promptSlashAutoComplete();
                    if (!selected) continue;
                    targetCmd = selected;
                }

                const rawCmd = targetCmd.replace(/^\//, '').trim().split(/\s+/)[0].toLowerCase();
                if (['chat', 'plan', 'analyze', 'agent', 'debug', 'git', 'actions', 'files', 'status', 'commit', 'diff'].includes(rawCmd)) {
                    currentMode = rawCmd;
                }

                const result = await dispatchSlashCommand(targetCmd, context);
                if (result && result.mode) currentMode = result.mode;
                if (result && result.exit) break;
                continue;
            }

            const lowerInput = input.toLowerCase();
            if (lowerInput === 'exit' || lowerInput === 'quit' || lowerInput === '/q') break;

            let nextInput = input;
            while (true) {
                const chatRes = await handleChat(nextInput, context);
                
                if (chatRes && chatRes.suggestedQuestions) {
                    lastSuggestions = chatRes.suggestedQuestions;
                }
                
                if (chatRes && chatRes.executedActions && chatRes.executedActions.length > 0) {
                    const systemFeedback = chatRes.executedActions.map(a => {
                        let resText = `Action: ${a.type} ${a.filePath || ''}\n`;
                        if (a.error) resText += `Error: ${a.error}\n`;
                        if (a.result) resText += `Result:\n${a.result}\n`;
                        return resText;
                    }).join('\n');
                    
                    nextInput = `[SYSTEM AUTOMATED FEEDBACK]\nThe following actions were executed. Please analyze the results and provide the final answer to the user's previous request, or propose the next steps if needed.\n\n${systemFeedback}`;
                    
                    console.log(chalk.yellow('\n(Agent is continuing based on command output...)'));
                    continue;
                }
                
                break;
            }

        } catch (err) {
            await handleError(err, agent, config);
        }
    }

    try {
        sessionStore.save({ ...sessionData, endTime: Date.now() });
    } catch (_) { /* non-fatal */ }
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

    // Prefer Labs Bible default theme for professional chrome
    if (!config.getBrandingFont() || config.getBrandingFont() === 'Big' || config.getBrandingFont() === 'Executive') {
        config.setBrandingFont(getDefaultThemeId());
    }
    // Migrate models closed to new Google keys
    const deadDefaults = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    if (deadDefaults.includes(config.getModel())) {
        config.setModel('gemini-flash-latest');
    }

    await TerminalUI.animateLogo(500, config.getBrandingFont() || getDefaultThemeId(), pkg.version, config);
    const activeModelService = new ActiveModelService(agent.modelManager);
    const modelStatus = activeModelService.getStatus(config, agent.availableModels || {});
    TerminalUI.showHeader(pkg.version, modelStatus.displayName || config.getModel(), displayPath, config);
    TerminalUI.showWelcome(config);

    // Workspace onboarding: ~/.lorapok + optional project .lorapok
    try {
        const ws = new WorkspaceService();
        const theme = getTheme(config.getBrandingFont() || getDefaultThemeId());
        await ws.runOnboarding({
            cwd: process.cwd(),
            isTTY: Boolean(process.stdout.isTTY),
            askLegacy: async (legacyPaths) => {
                console.log(theme.muted('\n  Workspace setup'));
                console.log(theme.muted('  ~/.lorapok (user)  ·  ./.lorapok (project)\n'));
                console.log(theme.warning('  Previous Lorapok data found:'));
                legacyPaths.forEach(p => console.log(theme.muted(`    ${p}`)));
                const choice = await new Select({
                    message: 'Continue with',
                    choices: [
                        { name: 'backup', message: 'Backup previous data, then continue' },
                        { name: 'fresh', message: 'Fresh start (archive previous)' },
                        { name: 'skip', message: 'Skip for now' }
                    ]
                }).run().catch(() => 'skip');
                return choice;
            },
            askProject: async (cwd) => {
                const choice = await new Select({
                    message: `Create .lorapok in this project?`,
                    choices: [
                        { name: 'yes', message: 'Yes — initialize .lorapok (recommended)' },
                        { name: 'no', message: 'Not now' }
                    ]
                }).run().catch(() => 'no');
                return choice === 'yes';
            }
        });
    } catch (e) {
        // Non-fatal onboarding errors
    }

    await chatLoop();

    await TerminalUI.exitSession(sessionData, { themeId: config.getBrandingFont() });
    process.exit(0);
}

const pkg = require('./package.json');

program
    .name('lorapok')
    .version(`${pkg.name} v${pkg.version}\nBuilt with 🐛 by Lorapok Labs (https://lorapok.tech)`, '-v, --version', 'output the current version')
    .option('-m, --model <modelName>', 'Set active LLM model for the session')
    .option('-y, --yes, --bypass, --yolo', 'Enable Auto-Approve bypass mode (auto-applies file actions & shell commands)')
    .action(async (options) => {
        if (options.model) {
            // Soft-set; runtime sanitize/guards will reject inaccessible models
            process.env.LORAPOK_MODEL = options.model;
        }
        if (options.yes || options.bypass || options.yolo) {
            process.env.LORAPOK_AUTO_APPROVE = 'true';
        }
        await main();
    });


program.parse(process.argv);
