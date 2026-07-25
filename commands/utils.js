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
    currentCwd = path.resolve(newCwd);
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
 * Execute a shell command safely with timeout and CWD tracking.
 * @param {string} command - Shell command to execute
 * @returns {{ success: boolean, stdout?: string, stderr?: string, timedOut?: boolean, error?: string }} Execution outcome
 */
function executeCommand(command) {
    if (!isCommandSafe(command)) {
        console.error(chalk.yellow('\n⚠️ Warning: Command contains potentially dangerous patterns and was blocked for safety.'));
        return { success: false, error: 'Command blocked for safety reasons.' };
    }

    try {
        console.log(chalk.gray('Executing...'));

        const isWindows = process.platform === 'win32';
        const shell = isWindows ? true : (fs.existsSync('/bin/bash') ? '/bin/bash' : true);

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

        if (result.status === 0 && (command.includes('cd ') || command.trim().startsWith('cd') || command.trim() === 'cd')) {
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
                        currentCwd = newPath;
                    }
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

    console.log(TerminalUI.formatError(msg));

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

                console.log(chalk.gray('  Verify new key...'));
                try {
                    const probeAgent = new (require('../lib/agent').LorapokCodingAgent)(cleanedKey);
                    await probeAgent.callPerplexityAPI([{ role: 'user', content: 'hi' }], 'sonar', { maxTokens: 1 });

                    if (config) config.setApiKey(cleanedKey);
                    if (agent) agent.apiKey = cleanedKey;
                    console.log(TerminalUI.formatSuccess('API Key verified and updated! You can try your request again.'));
                } catch (verifyErr) {
                    console.log(TerminalUI.formatError(`The new key is also invalid: ${verifyErr.message}`));
                    console.log(chalk.gray('  Please check your Perplexity account balance and API settings.'));
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
