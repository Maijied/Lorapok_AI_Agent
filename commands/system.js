/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const fs = require('fs');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');
const { showLogs, showSettings, showSessionInfo, handleModelCommand, handleConfigCommand } = require('./settings');
const { showGitMenu, handleGitSlashCommand } = require('./git');
const { showActionsMenu } = require('./actions');
const { handleAnalyze } = require('./chat');
const { runProWorkflow } = require('./workflow');
const { getSystemMenuChoices } = require('./registry');

/**
 * Display terminal help and command reference guide.
 * @returns {void}
 */
function showHelp() {
    TerminalUI.showHelp();
}

/**
 * Clear current terminal console buffer.
 * @returns {void}
 */
function clearScreen() {
    console.clear();
}

/**
 * Display active workspace path and session metrics.
 * @param {Object} context - CommandContext containing { agent, config, sessionData }
 * @returns {void}
 */
function showSystemInfo(context) {
    const { agent, config, sessionData } = context;
    const projectRoot = agent.projectRoot;
    const displayPath = projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : projectRoot;

    console.log(chalk.cyan.bold('\n🖥️  SYSTEM INFORMATION'));
    console.log(chalk.gray(`  Workspace: ${chalk.white.bold(displayPath)}`));
    console.log(chalk.gray(`  Session ID: ${chalk.yellow(sessionData.id)}`));
    console.log(chalk.gray(`  Model: ${chalk.green(config.getModel())}`));
    console.log(chalk.gray(`  Total Tokens Used: ${chalk.magenta(sessionData.tokens.total)}\n`));
}

/**
 * Display interactive command selection palette menu.
 * @param {Object} context - CommandContext containing { agent, config, ui }
 * @returns {Promise<{ success: boolean, exit?: boolean }>} Menu action execution result
 */
async function showSystemMenu(context) {
    const { agent, config, ui } = context;
    const isBypass = config.getAutoApprove();
    const menuChoices = getSystemMenuChoices(chalk).map(c => {
        if (c.name === 'bypass') {
            return {
                ...c,
                message: `⚡ bypass  ${chalk.gray('— Toggle auto-approve')} (${isBypass ? chalk.green('ON') : chalk.yellow('OFF')})`
            };
        }
        return c;
    });

    const select = new Select({
        message: 'Select Command / Action:',
        styles: {
            underline: str => str,
            em: chalk.cyan.bold
        },
        pointer(choice, i) {
            return this.state.index === i ? chalk.cyan.bold('❯ ') : '  ';
        },
        choices: menuChoices,
        result(name) { return this.map(name)[name]; }
    });

    const cmd = await select.run().catch(() => '__back__');

    if (cmd === '__back__') return { success: true, mode: 'chat' };
    if (cmd === 'exit') return { success: true, exit: true, mode: 'chat' };
    if (cmd === 'chat') return { success: true, mode: 'chat' };
    if (cmd === 'guide') { TerminalUI.showHowToUse(); await new Input({ message: 'Press Enter to return ⏎ ‣' }).run().catch(() => null); return { success: true, mode: 'guide' }; }
    if (cmd === 'help') { showHelp(); return { success: true, mode: 'help' }; }
    if (cmd === 'clear') { clearScreen(); return { success: true, mode: 'chat' }; }
    if (cmd === 'logs') { await showLogs(config); return { success: true, mode: 'logs' }; }
    if (cmd === 'sessions') { await showSessionInfo(config); return { success: true, mode: 'sessions' }; }
    if (cmd === 'bypass') {
        const next = !config.getAutoApprove();
        config.setAutoApprove(next);
        console.log(chalk.cyan(`\n⚡ Bypass / auto-approve is now ${next ? chalk.green('ON') : chalk.yellow('OFF')}.\n`));
        return { success: true, mode: 'bypass' };
    }
    if (cmd === 'model' || cmd === 'models') {
        await handleModelCommand([], context);
        return { success: true, mode: 'model' };
    }
    if (cmd === 'refresh-models') {
        return dispatchSlashCommand('/refresh-models', context);
    }
    if (cmd === 'cache') {
        return require('./settings').handleCacheCommand(undefined, context);
    }

    if (cmd === 'analyze') { await handleAnalyze(context); return { success: true, mode: 'analyze' }; }
    if (cmd === 'plan') {
        const obj = await new Input({ message: 'What is the objective?' }).run().catch(() => null);
        if (obj) await runProWorkflow(agent, config, obj);
        return { success: true, mode: 'plan' };
    }
    if (cmd === 'files') {
        const displayPath = agent.projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : agent.projectRoot;
        console.log(chalk.cyan(`\n📁 Project Files in ${chalk.white.bold(displayPath)}:\n`));

        try {
            const directFiles = fs.readdirSync(agent.projectRoot);
            if (directFiles.length === 0) {
                console.log(chalk.yellow(`  ⚠️  The directory is empty inside the container (${agent.projectRoot}).`));
                console.log(chalk.gray(`  If this is unexpected, check your Docker volume mounts.\n`));
            }
        } catch (e) { }

        const treeRes = agent.showFileTree();
        console.log(typeof treeRes === 'string' ? treeRes : (treeRes.data || ''));
        await new Input({ message: 'Press Enter to continue ⏎ ‣' }).run().catch(() => null);
        return { success: true, mode: 'files' };
    }
    if (cmd === 'git') { await showGitMenu(agent, config); return { success: true, mode: 'git' }; }
    if (cmd === 'actions') { await showActionsMenu(agent, config); return { success: true, mode: 'actions' }; }
    if (cmd === 'settings') { await showSettings(agent, config); return { success: true, mode: 'settings' }; }

    return { success: true, mode: 'chat' };
}

/**
 * Route and dispatch user slash commands to target command modules.
 * @param {string} input - Raw slash command string (e.g. "/git status")
 * @param {Object} context - CommandContext containing { agent, config, sessionData, ui }
 * @returns {Promise<{ success: boolean, exit?: boolean, error?: string }>} Execution result
 */
async function dispatchSlashCommand(input, context) {
    const { agent, config, ui } = context;

    if (input === '/' || input === '') {
        return showSystemMenu(context);
    }

    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
        return { success: false, error: 'Not a slash command' };
    }

    const parts = trimmed.substring(1).split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCmd) {
        case 'exit':
        case 'quit':
        case 'q':
            return { success: true, exit: true };

        case 'help':
        case '?':
            showHelp();
            return { success: true };

        case 'guide':
        case 'howtouse':
        case 'manual':
            TerminalUI.showHowToUse();
            return { success: true };


        case 'clear':
            clearScreen();
            return { success: true };

        case 'logs':
            await showLogs(config);
            return { success: true };

        case 'sessions':
            await showSessionInfo(config);
            return { success: true };

        case 'analyze':
            await handleAnalyze(context);
            return { success: true };

        case 'plan': {
            let obj = args.join(' ');
            if (!obj) {
                obj = await new Input({ message: 'What is the objective?' }).run().catch(() => null);
            }
            if (obj) await runProWorkflow(agent, config, obj);
            return { success: true };
        }

        case 'files': {
            const treeRes = agent.showFileTree();
            console.log(typeof treeRes === 'string' ? treeRes : (treeRes.data || ''));
            await new Input({ message: 'Press Enter to continue' }).run().catch(() => null);
            return { success: true };
        }

        case 'git':
            return handleGitSlashCommand(args[0], args.slice(1), context);

        case 'status':
        case 'commit':
        case 'diff':
        case 'branch':
            return handleGitSlashCommand(mainCmd, args, context);

        case 'actions':
        case 'ci':
            await showActionsMenu(agent, config);
            return { success: true };

        case 'settings':
            await showSettings(agent, config);
            return { success: true };

        case 'model':
        case 'models':
            return handleModelCommand(args, context);


        case 'bypass':
        case 'yolo': {
            const current = config.getAutoApprove();
            const nextState = !current;
            config.setAutoApprove(nextState);
            console.log(nextState
                ? chalk.green.bold('\n🚀 Bypass Mode ENABLED — File actions & bash commands will auto-approve without asking.')
                : chalk.yellow.bold('\n🔒 Bypass Mode DISABLED — Action confirmation prompts re-enabled.')
            );
            return { success: true };
        }

        case 'config':
            return handleConfigCommand(args[0], args[1], context);

        case 'cache':
            return require('./settings').handleCacheCommand(args[0], context);

        case 'refresh-models': {
            let spinner = null;
            if (process.stdout.isTTY) {
                spinner = TerminalUI.createSpinner('Sanitizing model catalog…', config).start();
            }
            try {
                if (agent.cache) {
                    agent.cache.del('availableModels');
                }
                const { ModelSanitizeService } = require('../services/ModelSanitizeService');
                const sanitizer = new ModelSanitizeService(agent.modelManager);
                const result = await sanitizer.sanitize({
                    force: true,
                    config,
                    selectedModel: config.getModel && config.getModel()
                });
                agent.availableModels = result.validated;
                const s = result.stats;
                const detail = `(${s.catalogSize} loaded — ${s.usable} usable | ${s.paid} paid | ${s.selectable} selectable | probed ${s.probed})`;
                if (spinner) spinner.succeed(`Model catalog sanitized! ${detail}`);
                else console.log(chalk.green(`Model catalog sanitized! ${detail}`));
            } catch (e) {
                if (spinner) spinner.fail(`Failed to sanitize models: ${e.message}`);
                else console.log(chalk.red(`Failed to sanitize models: ${e.message}`));
            }
            return { success: true };
        }

        case 'chat':
            console.log(chalk.cyan('\n💬 Interactive AI Chat Mode Active. Ask anything!\n'));
            return { success: true, mode: 'chat' };

        case 'agent':
        case 'agentic':
            console.log(chalk.cyan('\n⚡ Autonomous Agent Mode Active. I can use tools, fs, and shell.\n'));
            return { success: true, mode: 'agent' };

        case 'debug':
            console.log(chalk.magenta('\n🐛 Analysis & Debug Mode Active. Paste your logs or issues.\n'));
            return { success: true, mode: 'debug' };

        case 'menu':
            return showSystemMenu(context);

        default:
            console.log(chalk.yellow(`\n⚠️  Unknown command: /${mainCmd}`));
            console.log(chalk.gray('   Type / for the command palette, or /help for the full reference.\n'));
            return { success: false, error: `Unknown command: /${mainCmd}` };
    }
}

module.exports = {
    showHelp,
    clearScreen,
    showSystemInfo,
    showSystemMenu,
    dispatchSlashCommand
};
