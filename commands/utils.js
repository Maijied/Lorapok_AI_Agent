/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const path = require('path');
const os = require('os');
const chalk = require('chalk');
const fs = require('fs');
const { spawnSync } = require('child_process');
const readline = require('readline');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');

let currentCwd = process.cwd();

/**
 * Set active working directory state for shell command execution.
 * @param {string} newCwd - Absolute path to working directory
 * @returns {void}
 */
function setCwd(newCwd) {
    const resolved = path.resolve(newCwd);
    currentCwd = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
}

/**
 * Get active working directory state.
 * @returns {string} Current working directory path
 */
function getCwd() {
    return currentCwd;
}

/**
 * Validate command for dangerous execution patterns or command injection.
 * @param {string} command - Raw bash command string
 * @returns {boolean} True if safe, false if blocked
 */
function isCommandSafe(command) {
    if (typeof command !== 'string' || !command.trim()) return false;

    // Block command substitution / subshell injection
    if (command.includes('$(') || command.includes('`')) {
        return false;
    }

    // Block piping to shell execution or sudo
    if (/\|\s*(ba)?sh\b/i.test(command) || /\|\s*sudo\b/i.test(command)) {
        return false;
    }

    // Block dangerous rm commands (at start of string, line start, or after ;, |, &&, ||)
    if (/(?:^|[\n;|]|&&|\|\|)\s*rm\b/i.test(command)) {
        return false;
    }

    // Block sudo execution
    if (/(?:^|[\n;|]|&&|\|\|)\s*sudo\b/i.test(command)) {
        return false;
    }

    return true;
}

/**
 * Helper to fold long terminal output strings cleanly.
 * @param {string} text - Raw output string
 * @param {number} [maxLines=25] - Threshold line count before folding
 * @returns {string} Formatted output string
 */
function formatCollapsibleOutput(text, maxLines = 25) {
    if (!text) return '';
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text.trim();

    const top = lines.slice(0, 10).join('\n');
    const bottom = lines.slice(-10).join('\n');
    const hiddenCount = lines.length - 20;

    return `${top}\n${chalk.gray(`\n  --- 📂 [Folded: ${hiddenCount} lines hidden | Full output captured] ---\n`)}\n${bottom}`.trim();
}

/**
 * Execute a shell command safely with timeout, CWD tracking, and collapsible process box.
 * @param {string} command - Shell command to execute
 * @returns {{ success: boolean, stdout?: string, stderr?: string, duration?: number, timedOut?: boolean, error?: string }} Execution outcome
 */
function executeCommand(command) {
    if (!isCommandSafe(command)) {
        console.error(chalk.yellow('\n⚠️ Warning: Command contains potentially dangerous patterns and was blocked for safety.'));
        return { success: false, error: 'Command blocked for safety reasons.' };
    }

    const boxen = require('boxen');
    const startTime = Date.now();

    try {
        const headerInfo = [
            `${chalk.bold.cyan('💻 $')} ${chalk.bold.white(command)}`,
            `${chalk.gray('📂 Directory:')} ${chalk.gray(currentCwd)}`
        ].join('\n');

        console.log(boxen(headerInfo, {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            title: chalk.cyan.bold(' ⚡ RUNNING BASH COMMAND '),
            titleAlignment: 'left',
            borderColor: 'cyan',
            borderStyle: 'round'
        }));

        const isWindows = process.platform === 'win32';
        let execCmd = command;
        if (isWindows) {
            execCmd = execCmd.replace(/\bcd\s+~(?=$|\/|\\|\s)/gi, `cd "${os.homedir()}"`);
        }

        const result = spawnSync(execCmd, {
            shell: true,
            encoding: 'utf8',
            cwd: currentCwd,
            timeout: 60000,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        const duration = Date.now() - startTime;
        const isSuccess = result.status === 0;
        const borderColor = isSuccess ? 'green' : 'red';
        const titleBadge = isSuccess
            ? chalk.green.bold(` ✔ COMMAND SUCCESS (${duration}ms) `)
            : chalk.red.bold(` ❌ COMMAND FAILED (Code ${result.status ?? 'ERR'}, ${duration}ms) `);

        if (result.stdout && result.stdout.trim()) {
            const formattedStdout = formatCollapsibleOutput(result.stdout.trim());
            console.log(boxen(formattedStdout, {
                padding: 1,
                title: titleBadge,
                titleAlignment: 'left',
                borderColor: borderColor,
                borderStyle: 'round'
            }));
        } else if (!isSuccess && result.stderr && result.stderr.trim()) {
            const formattedStderr = formatCollapsibleOutput(result.stderr.trim());
            console.error(boxen(formattedStderr, {
                padding: 1,
                title: titleBadge,
                titleAlignment: 'left',
                borderColor: 'red',
                borderStyle: 'round'
            }));
        } else {
            console.log(boxen(chalk.gray(`(No output returned in ${duration}ms)`), {
                padding: { top: 0, bottom: 0, left: 1, right: 1 },
                title: titleBadge,
                titleAlignment: 'left',
                borderColor: borderColor,
                borderStyle: 'round'
            }));
        }

        if (isSuccess && (command.includes('cd ') || command.trim().startsWith('cd') || command.trim() === 'cd')) {
            const parts = command.split(/(?:&&|\|\||;)/);
            for (const part of parts) {
                const trimmed = part.trim();
                const cdMatch = trimmed.match(/^cd(?:\s+(.*))?$/);
                if (cdMatch) {
                    let target = cdMatch[1] ? cdMatch[1].trim() : '';
                    target = target.replace(/^["'](.*)["']$/, '$1');
                    if (target === '' || target === '~') {
                        target = os.homedir();
                    } else if (target.startsWith('~/')) {
                        target = path.join(os.homedir(), target.slice(2));
                    }
                    const newPath = path.resolve(currentCwd, target);
                    if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
                        currentCwd = fs.realpathSync(newPath);
                    }
                }
            }
        }

        return {
            success: isSuccess,
            stdout: result.stdout,
            stderr: result.stderr,
            duration,
            timedOut: result.error?.code === 'ETIMEDOUT'
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(boxen(chalk.red(`Execution Error: ${error.message}`), {
            padding: 1,
            title: chalk.red.bold(` ❌ EXECUTION ERROR (${duration}ms) `),
            titleAlignment: 'left',
            borderColor: 'red',
            borderStyle: 'round'
        }));

        return {
            success: false,
            error: error.message,
            duration
        };
    }
}


/**
 * Run async operation with a terminal spinner and ESC keypress cancellation support.
 * @param {string} spinnerMessage - Message displayed alongside spinner
 * @param {Function} taskFn - Async task function receiving AbortSignal `(signal) => Promise<T>`
 * @returns {Promise<any>} Result from taskFn or `{ aborted: true }` if cancelled
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
 * Handle system errors with automated recovery prompt for API key failures.
 * @param {Error|string} err - Error object or message
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - Config manager instance
 * @returns {Promise<void>}
 */
async function handleError(err, agent, config) {
    if (!err || (typeof err === 'object' && !err.message)) return;

    const msg = err.message || String(err);
    if (msg === 'ABORTED') return;

    console.log(TerminalUI.formatError(msg, config));

    if (msg.includes('Invalid API key') || msg.includes('401')) {
        const isGoogle = /google|gemini|aistudio/i.test(msg);
        const isOpenRouter = /openrouter/i.test(msg);
        const providerLabel = isGoogle ? 'Google AI Studio' : isOpenRouter ? 'OpenRouter' : 'Perplexity';

        const updateKey = new Select({
            message: `${providerLabel} API key looks invalid. Update it now?`,
            choices: [
                { name: 'yes', message: `Yes — enter new ${providerLabel} key` },
                { name: 'no', message: 'No — I will update it in Settings later' }
            ]
        });

        const updateChoice = await updateKey.run().catch(() => 'no');
        if (updateChoice === 'yes') {
            const newKey = await new Input({ message: `Paste new ${providerLabel} API key:` }).run().catch(() => null);
            if (newKey && newKey.trim()) {
                const cleanedKey = newKey.trim().replace(/^["'](.+)["']$/, '$1');
                console.log(chalk.gray('  Saving key to encrypted vault…'));
                try {
                    if (config) {
                        const { saveAndVerifyApiKey } = require('./settings');
                        const which = isGoogle ? 'google' : isOpenRouter ? 'openrouter' : 'perplexity';
                        await saveAndVerifyApiKey(config, which, cleanedKey);
                    }
                } catch (verifyErr) {
                    console.log(TerminalUI.formatError(`Could not save key: ${verifyErr.message}`, config));
                }
            }
        }
    }
}

module.exports = {
    setCwd,
    getCwd,
    executeCommand,
    isCommandSafe,
    withCancellation,
    handleError
};
