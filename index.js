#!/usr/bin/env node

require('dotenv').config();
const { Select, Input, Autocomplete } = require('enquirer');
const chalk = require('chalk');
const { program } = require('commander');
const { LorapokEnhancedAgent, MODELS: DEFAULT_MODELS } = require('./lib/agent-enhanced');
const { LorapokConfig } = require('./lib/config');
const TerminalUI = require('./lib/ui');
const { renderMarkdown } = require('./lib/renderer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const readline = require('readline');

let agent, config, currentCwd;

/**
 * Execute a bash command and return the result
 */
function executeCommand(command) {
    try {
        console.log(chalk.gray('Executing...'));

        // Detect best shell to use
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? true : (fs.existsSync('/bin/bash') ? '/bin/bash' : true);

        // Timeout protection (60s)
        const result = spawnSync(command, {
            shell: shell,
            encoding: 'utf8',
            cwd: currentCwd,
            timeout: 60000,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        if (result.stdout) {
            console.log(chalk.gray('\nCommand Output:'));
            console.log(result.stdout);
        }

        if (result.stderr && (result.status !== 0 || result.stderr.length > 0)) {
            const isWarning = result.status === 0;
            console.error(isWarning ? chalk.yellow('\nCommand Warning:') : chalk.red('\nCommand Error:'));
            console.error(result.stderr);
        }

        // Persistent CWD tracking: If command contains 'cd', we try to update currentCwd
        if (command.includes('cd ') || command.trim().startsWith('cd')) {
            const pwdResult = spawnSync('cd ' + command + ' && pwd', {
                shell: shell,
                encoding: 'utf8',
                cwd: currentCwd
            });
            if (pwdResult.status === 0 && pwdResult.stdout) {
                const newPath = pwdResult.stdout.trim();
                if (fs.existsSync(newPath)) {
                    currentCwd = newPath;
                }
            }
        }

        return {
            success: result.status === 0,
            stdout: result.stdout,
            stderr: result.stderr,
            timedOut: result.error?.code === 'ETIMEDOUT'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Global Session Data
const sessionData = {
    id: Math.random().toString(36).substring(2, 10).toUpperCase(),
    count: 0,
    successRate: 100,
    startTime: Date.now()
};

// ==================== KEYBOARD HANDLING ====================
let ctrlCCount = 0;
const setupExitHandlers = () => {
    // We let enquirer handle SIGINT for prompts, but we track global SIGINT for double-tap exit
    process.on('SIGINT', () => {
        ctrlCCount++;
        if (ctrlCCount >= 2) {
            console.log(chalk.red('\n\nAgent powering down. Goodbye! 🐛'));
            TerminalUI.showInteractionSummary(sessionData);
            // Delay exit to allow enquirer cleanup and avoid ERR_USE_AFTER_CLOSE
            setTimeout(() => process.exit(0), 200);
            return;
        }
        console.log(chalk.yellow('\n(Press Ctrl+C again to exit)'));
        setTimeout(() => { ctrlCCount = 0; }, 2000);
    });

    // Suppress the annoying ERR_USE_AFTER_CLOSE which is common with enquirer + signal exit
    process.on('uncaughtException', (err) => {
        if (err.code === 'ERR_USE_AFTER_CLOSE') return;
        // For other errors, log and exit
        if (process.env.NODE_ENV === 'development') console.error(err);
        process.exit(1);
    });
};

// ==================== CORE FUNCTIONS ====================

async function initialization() {
    config = new LorapokConfig();
    const apiKey = config.getApiKey();

    if (!apiKey) {
        console.log(TerminalUI.formatError('No API key found.'));
        const prompt = new Input({ message: 'Enter your Perplexity API Key:' });
        const newKey = await prompt.run();
        if (!newKey) process.exit(1);
        config.setApiKey(newKey.trim());
    }

    // First-run: Ask for username
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

    // If running in Docker (and not specifically developing Lorapok itself), use /project
    const projectRoot = process.env.LORAPOK_DOCKER === 'true' && fs.existsSync('/project')
        ? '/project'
        : process.cwd();

    agent = new LorapokEnhancedAgent(config.getApiKey(), projectRoot);
    currentCwd = projectRoot;

    // Log active workspace for clarity
    const displayPath = projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : projectRoot;
    console.log(chalk.gray(`\n  📂 Workspace: ${chalk.white.bold(displayPath)}`));
}

/**
 * Runs a long-running task with a spinner and ESC-to-cancel support
 */
async function withCancellation(spinnerMessage, taskFn) {
    const spinner = TerminalUI.createSpinner(spinnerMessage).start();
    const controller = new AbortController();

    const handleKey = (str, key) => {
        if (key && key.name === 'escape') {
            controller.abort();
        }
    };

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.on('keypress', handleKey);

    try {
        const result = await taskFn(controller.signal);
        return result;
    } catch (err) {
        if (err.message === 'ABORTED' || err.name === 'AbortError') {
            console.log(chalk.yellow('\n🛑 Action cancelled by user.'));
            return { aborted: true };
        }
        throw err;
    } finally {
        process.stdin.removeListener('keypress', handleKey);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        spinner.stop();
    }
}

/**
 * Central Error Handler - Detects 401s and offers a fix
 */
async function handleError(err) {
    if (!err || (typeof err === 'object' && !err.message)) return;

    const msg = err.message || String(err);
    if (msg === 'ABORTED') return;

    console.log(TerminalUI.formatError(msg));

    // If the key is invalid, offer to update it immediately
    if (msg.includes('Invalid API key') || msg.includes('401')) {
        const updateKey = new Select({
            message: 'Your API key seems invalid. Update it now?',
            choices: ['Yes, enter new key', 'No, I will check my .env']
        });

        const updateChoice = await updateKey.run().catch(() => 'No');
        if (updateChoice === 'Yes, enter new key') {
            const newKey = await new Input({ message: 'Paste new Perplexity API Key:' }).run().catch(() => null);
            if (newKey && newKey.trim()) {
                const cleanedKey = newKey.trim().replace(/^["'](.+)["']$/, '$1');

                // Verify the new key before setting it
                console.log(chalk.gray('  Verify new key...'));
                try {
                    const probeAgent = new (require('./lib/agent').LorapokCodingAgent)(cleanedKey);
                    await probeAgent.callPerplexityAPI([{ role: 'user', content: 'hi' }], 'sonar', { maxTokens: 1 });

                    // If we get here, the key is valid
                    config.setApiKey(cleanedKey);
                    agent.apiKey = cleanedKey;
                    console.log(TerminalUI.formatSuccess('API Key verified and updated! You can try your request again.'));
                } catch (verifyErr) {
                    console.log(TerminalUI.formatError(`The new key is also invalid: ${verifyErr.message}`));
                    console.log(chalk.gray('  Please check your Perplexity account balance and API settings.'));
                }
            }
        }
    }
}

async function chatLoop() {
    const userName = config.getUserName() || 'You';
    while (true) {
        try {
            const inputPrompt = new Input({
                message: chalk.cyan.bold(`╭─ 👤 ${userName}`) + '\n' + chalk.cyan.bold('╰─➤')
            });

            let input = await inputPrompt.run();

            // Handle Trigger Keys: / or empty input
            if (input === '/' || input === '') {
                const select = new Select({
                    message: 'Select Command',
                    choices: [
                        { name: 'chat', message: '💬 Chat' },
                        { name: 'plan', message: '📝 Plan & Execute' },
                        { name: 'analyze', message: '🔍 Analyze Project' },
                        { name: 'files', message: '📁 Files' },
                        { name: 'git', message: '🔗 Git Ops' },
                        { name: 'logs', message: '📊 Logs' },
                        { name: 'settings', message: '⚙️  Settings' },
                        { name: 'help', message: '❓ Help' },
                        { name: 'clear', message: '🧹 Clear' },
                        { name: 'exit', message: '❌ Exit' }
                    ]
                });
                const cmd = await select.run().catch(() => 'chat');

                if (cmd === 'exit') break;
                if (cmd === 'chat') continue;
                if (cmd === 'help') { TerminalUI.showHelp(); continue; }
                if (cmd === 'logs') { await showLogs(); continue; }
                if (cmd === 'clear') { console.clear(); continue; }
                if (cmd === 'analyze') {
                    const result = await withCancellation('Analyzing project...', (signal) =>
                        agent.analyzeProject({ signal })
                    );
                    if (result && !result.aborted) {
                        console.log(await renderMarkdown(result.content));
                    }
                    continue;
                }
                if (cmd === 'plan') {
                    const obj = await new Input({ message: 'What is the objective?' }).run().catch(() => null);
                    if (obj) await runProWorkflow(obj);
                    continue;
                }
                if (cmd === 'files') {
                    const displayPath = agent.projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : agent.projectRoot;
                    console.log(chalk.cyan(`\n📁 Project Files in ${chalk.white.bold(displayPath)}:\n`));

                    // Diagnostic: Check if directory actually has files via fs
                    try {
                        const directFiles = fs.readdirSync(agent.projectRoot);
                        if (directFiles.length === 0) {
                            console.log(chalk.yellow(`  ⚠️  The directory is empty inside the container (${agent.projectRoot}).`));
                            console.log(chalk.gray(`  If this is unexpected, check your Docker volume mounts.\n`));
                        }
                    } catch (e) { }

                    console.log(agent.showFileTree());
                    await new Input({ message: 'Press Enter to continue' }).run();
                    continue;
                }
                if (cmd === 'git') {
                    const status = agent.getGitStatus();
                    console.log(chalk.cyan('\nGit Status:\n'));
                    console.log(status.success ? status.files.map(f => ` - ${f.status}: ${f.file}`).join('\n') : status.error);
                    await new Input({ message: 'Press Enter to continue' }).run();
                    continue;
                }
                if (cmd === 'settings') {
                    await showSettings();
                    continue;
                }
            }

            if (input === '@') {
                const fileSelect = new Autocomplete({
                    name: 'file',
                    message: 'Select file to mention:',
                    choices: agent.listProjectFiles().map(f => f.path)
                });
                const file = await fileSelect.run().catch(() => null);
                if (file) {
                    input = `Analyze @${file}`;
                } else {
                    continue;
                }
            }

            // Handle Slash Commands (Manual input)
            if (input.startsWith('/')) {
                const cmd = input.substring(1).toLowerCase();
                if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') break;
                if (cmd === 'help' || cmd === '?') { TerminalUI.showHelp(); continue; }
                if (cmd === 'logs') { await showLogs(); continue; }
                if (cmd === 'clear') { console.clear(); continue; }
                if (cmd === 'plan') {
                    const obj = await new Input({ message: 'What is the objective?' }).run().catch(() => null);
                    if (obj) await runProWorkflow(obj);
                    continue;
                }

                // If unknown slash command, or user just typed "/", show menu
                input = '/';
                continue;
            }

            // Handle @file Mentions
            const mentionRegex = /(?<=^|\s)@(\S+)/g;
            const fileMatches = input.match(mentionRegex);
            let processedInput = input;
            if (fileMatches) {
                for (const match of fileMatches) {
                    const filePath = match.substring(1);
                    try {
                        const content = agent.fileManager.readFile(filePath);
                        processedInput = processedInput.replace(match, `\n--- File: ${filePath} ---\n${content}\n---\n`);
                    } catch (e) {
                        console.log(chalk.yellow(`\n⚠️  Warning: File ${filePath} not found.`));
                    }
                }
            }

            if (!input.trim()) continue;

            try {
                sessionData.count++;
                const response = await withCancellation('Thinking...', (signal) =>
                    agent.chat(processedInput, null, { signal })
                );

                if (!response || response.aborted) continue;

                console.log(chalk.cyan.bold('\n🐛 LORAPOK:'));

                // Code Hiding & Formatting
                const cleanContent = TerminalUI.hideLongCodeBlocks(response.content);
                console.log(await renderMarkdown(cleanContent));
                console.log('');

                // Action Parsing & Implementation Loop
                const actions = agent.parseActions(response.content);
                if (actions.length > 0) {
                    console.log(chalk.cyan.bold(`📝 AGENT PROPOSES ${actions.length} ACTIONS`));
                    for (const action of actions) {
                        if (action.type === 'COMMAND') {
                            TerminalUI.showCommand(action.description, action.content);
                            const confirm = new Select({
                                message: `Execute this bash command?`,
                                choices: ['Yes', 'No', 'Skip All']
                            });

                            const choice = await confirm.run().catch(() => 'No');
                            if (choice === 'Skip All') break;
                            if (choice === 'No') continue;

                            const result = executeCommand(action.content);
                            if (result.success) {
                                console.log(TerminalUI.formatSuccess(`Command executed.`));
                            } else {
                                console.log(TerminalUI.formatError(`Command failed.`));
                            }
                        } else {
                            let current = '';
                            try { current = agent.fileManager.readFile(action.filePath); } catch { }

                            TerminalUI.showDiff(action.filePath, current, action.content);

                            const confirm = new Select({
                                message: `Apply ${action.type} to ${action.filePath}?`,
                                choices: ['Yes', 'No', 'Skip All']
                            });

                            const choice = await confirm.run().catch(() => 'No');
                            if (choice === 'Skip All') break;
                            if (choice === 'No') continue;

                            TerminalUI.showEditStatus(action.type, action.filePath);
                            if (action.type === 'DELETE') {
                                agent.fileManager.deleteFile(action.filePath);
                            } else {
                                agent.fileManager.writeFile(action.filePath, action.content);
                            }
                            console.log(TerminalUI.formatSuccess(`${action.type} applied.`));
                        }
                    }
                }
            } catch (err) {
                await handleError(err);
                sessionData.successRate = Math.max(0, sessionData.successRate - 5);
            }
        } catch (err) {
            await handleError(err);
            continue;
        }
    }

    console.log(chalk.yellow('Returning to hangar...'));
}

async function runProWorkflow(objective) {
    try {
        const planRes = await withCancellation('Planning...', (signal) =>
            agent.plan(objective, { signal })
        );
        if (!planRes || planRes.aborted) return;

        await TerminalUI.showPlanning(planRes.content);

        const confirmPlan = new Select({
            message: 'Approve plan?',
            choices: ['Yes, proceed with tasks', 'No, revise objective', 'Cancel']
        });
        const planChoice = await confirmPlan.run().catch(() => 'Cancel');
        if (planChoice !== 'Yes, proceed with tasks') return;

        const taskRes = await withCancellation('Generating Tasks...', (signal) =>
            agent.tasks(planRes.content, { signal })
        );
        if (!taskRes || taskRes.aborted) return;

        await TerminalUI.showTasks(taskRes.content);

        const confirmTasks = new Select({
            message: 'Start implementation?',
            choices: ['Yes, generate code', 'Cancel']
        });
        const taskChoice = await confirmTasks.run().catch(() => 'Cancel');
        if (taskChoice !== 'Yes, generate code') return;

        const implRes = await withCancellation('Generating Implementation...', (signal) =>
            agent.generateCode(objective, { signal })
        );
        if (!implRes || implRes.aborted) return;

        const actions = agent.parseActions(implRes.content);

        if (actions.length === 0) {
            console.log(chalk.yellow('\n⚠️  No specific file actions identified. Showing general response:'));
            console.log(implRes.content);
        } else {
            console.log(chalk.cyan.bold(`\n📝 PROPOSED IMPLEMENTATION (${actions.length} actions)\n`));

            for (const action of actions) {
                if (action.type === 'COMMAND') {
                    TerminalUI.showCommand(action.description, action.content);
                    const confirmAction = new Select({
                        message: `Execute this bash command?`,
                        choices: ['Yes', 'No', 'Cancel']
                    });

                    const actionChoice = await confirmAction.run().catch(() => 'Cancel');
                    if (actionChoice === 'Cancel') break;
                    if (actionChoice === 'No') continue;

                    const result = executeCommand(action.content);
                    if (result.success) {
                        console.log(TerminalUI.formatSuccess(`Command executed.`));
                    } else {
                        console.log(TerminalUI.formatError(`Command failed.`));
                    }
                } else {
                    let currentContent = '';
                    try {
                        currentContent = agent.fileManager.readFile(action.filePath);
                    } catch { }

                    TerminalUI.showDiff(action.filePath, currentContent, action.content);

                    const confirmAction = new Select({
                        message: `Apply ${action.type} to ${action.filePath}?`,
                        choices: ['Yes', 'No', 'Cancel']
                    });

                    const actionChoice = await confirmAction.run().catch(() => 'Cancel');
                    if (actionChoice === 'Cancel') break;
                    if (actionChoice === 'No') continue;

                    TerminalUI.showEditStatus(action.type, action.filePath);

                    if (action.type === 'DELETE') {
                        agent.fileManager.deleteFile(action.filePath);
                    } else if (action.type === 'CREATE' || action.type === 'UPDATE') {
                        agent.fileManager.writeFile(action.filePath, action.content);
                    }
                    console.log(TerminalUI.formatSuccess(`${action.type} applied.`));
                }
            }
            console.log(TerminalUI.formatSuccess('Implementation steps completed.'));
        }

        const walkRes = await withCancellation('Finalizing Walkthrough...', (signal) =>
            agent.summarize({ objective, plan: planRes.content, actions: actions.length }, { signal })
        );
        if (walkRes && !walkRes.aborted) {
            await TerminalUI.showWalkthrough(walkRes.content);
        }

    } catch (err) {
        await handleError(err);
    }
}

async function showSettings() {
    const select = new Select({
        name: 'setting',
        message: 'Settings',
        choices: [
            'Change Name',
            'Change Model',
            'Change Language',
            'Update API Key',
            'Back'
        ]
    });

    const choice = await select.run();
    if (choice === 'Back') return;

    if (choice === 'Change Name') {
        const currentName = config.getUserName() || 'Developer';
        const nameRes = await new Input({
            message: 'Your Name:',
            initial: currentName
        }).run();
        config.setUserName(nameRes);
    } else if (choice === 'Change Model') {
        const models = await agent.checkAvailableModels();
        const modelSelect = new Select({
            message: 'Select Model',
            choices: Object.keys(models).map(id => ({ name: id, message: models[id].name }))
        });
        const model = await modelSelect.run();
        config.setModel(model);
    } else if (choice === 'Change Language') {
        const langRes = await new Input({ message: 'Default Language:' }).run();
        config.setLanguage(langRes);
    } else if (choice === 'Update API Key') {
        const keyRes = await new Input({ message: 'New API Key:' }).run();
        config.setApiKey(keyRes);
    }

    console.log(TerminalUI.formatSuccess('Settings updated.'));
}

async function showLogs() {
    const logPath = path.join(os.homedir(), '.lorapok', 'logs', 'combined.log');
    console.log(chalk.cyan(`\n📊 Diagnostic Logs [Last 20 lines]:\n`));
    try {
        if (!fs.existsSync(logPath)) {
            console.log(chalk.yellow('  No log file found yet.'));
            return;
        }
        const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-20).join('\n');
        console.log(chalk.gray(logs));
    } catch (e) {
        console.log(TerminalUI.formatError(`Could not read logs: ${e.message}`));
    }
    await new Input({ message: 'Press Enter to continue' }).run().catch(() => null);
}

// ==================== MAIN ENTRY ====================

async function main() {
    setupExitHandlers();
    await initialization();

    if (process.argv.length > 2) {
        program.parse(process.argv);
        return;
    }

    const version = require('./package.json').version;
    const displayPath = agent.projectRoot === '/project' ? (process.env.PROJECT_ROOT || '/project') : agent.projectRoot;
    TerminalUI.showHeader(version, config.getModel(), displayPath);
    TerminalUI.showWelcome();
    await chatLoop();

    console.log(chalk.red('\nExiting Lorapok. Goodbye! 🐛'));
    TerminalUI.showInteractionSummary(sessionData);
    process.exit(0);
}

// CLI Integration
program
    .name('lorapok')
    .version('1.0.0')
    .action(main);

program.parse(process.argv);