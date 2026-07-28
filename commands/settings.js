/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');

/**
 * Display settings interactive selection menu.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - Config manager instance
 * @returns {Promise<{ success: boolean, message?: string }>} Execution result status
 */
async function showSettings(agent, config) {
    const select = new Select({
        name: 'setting',
        message: 'Settings & Preferences:',
        styles: {
            underline: str => str,
            em: chalk.cyan.bold
        },
        pointer(choice, i) {
            return this.state.index === i ? chalk.cyan.bold('❯ ') : '  ';
        },
        choices: [
            { name: 'name', message: '👤 Change User Name' },
            { name: 'model', message: '🧠 Change LLM Model' },
            { name: 'cache', message: '⚡ LLM Response Cache Engine' },
            { name: 'language', message: '🌐 Change Default Language' },
            { name: 'theme', message: '🎨 CLI Theme Customizer' },
            { name: 'key', message: '🔑 Update API Key' },
            { name: 'back', message: '🔙 Back to Main Menu' }
        ],
        result(name) { return this.map(name)[name]; }
    });

    const choice = await select.run().catch(() => 'back');
    if (choice === 'back' || choice === 'Back') return { success: true };

    if (choice === 'cache') {
        await handleCacheCommand(null, { agent, config, ui: TerminalUI });
        return { success: true };
    }


    if (choice === 'name') {
        const currentName = config.getUserName() || 'Developer';
        const nameRes = await new Input({
            message: '👤 Enter New User Name:',
            initial: currentName
        }).run().catch(() => null);

        if (nameRes && nameRes.trim() !== currentName) {
            const confirm = new Select({
                message: `Save user name as '${nameRes.trim()}'?`,
                choices: [
                    { name: 'save', message: '🟢 Save Changes' },
                    { name: 'reject', message: '❌ Reject / Cancel' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const ans = await confirm.run().catch(() => 'reject');
            if (ans === 'save') {
                config.setUserName(nameRes.trim());
                console.log(TerminalUI.formatSuccess(`User name updated to '${nameRes.trim()}'.`));
            } else {
                console.log(chalk.yellow('\n⚠️ Changes rejected. User name kept unchanged.'));
            }
        }
    } else if (choice === 'model') {
        const models = await agent.checkAvailableModels();
        const modelSelect = new Select({
            message: '🧠 Select LLM Model:',
            choices: Object.keys(models).map(id => ({
                name: id,
                message: `🧠 ${models[id].name}`
            }))
        });
        const model = await modelSelect.run().catch(() => null);
        if (model) {
            const confirm = new Select({
                message: `Switch active AI model to '${models[model]?.name || model}'?`,
                choices: [
                    { name: 'save', message: '🟢 Switch & Save Model' },
                    { name: 'reject', message: '❌ Reject / Cancel' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const ans = await confirm.run().catch(() => 'reject');
            if (ans === 'save') {
                config.setModel(model);
                console.log(TerminalUI.formatSuccess(`AI Model updated to ${models[model]?.name || model}.`));
            } else {
                console.log(chalk.yellow('\n⚠️ Model change rejected. Kept current model.'));
            }
        }
    } else if (choice === 'language') {
        const langRes = await new Input({ message: '🌐 Default Language:' }).run().catch(() => null);
        if (langRes) {
            const confirm = new Select({
                message: `Set default language to '${langRes.trim()}'?`,
                choices: [
                    { name: 'save', message: '🟢 Save Language Preference' },
                    { name: 'reject', message: '❌ Reject / Cancel' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const ans = await confirm.run().catch(() => 'reject');
            if (ans === 'save') {
                config.setLanguage(langRes.trim());
                console.log(TerminalUI.formatSuccess('Language preference updated.'));
            } else {
                console.log(chalk.yellow('\n⚠️ Language change rejected.'));
            }
        }
    } else if (choice === 'key') {
        const keyRes = await new Input({ message: '🔑 New API Key:' }).run().catch(() => null);
        if (keyRes) {
            const confirm = new Select({
                message: 'Update API Key?',
                choices: [
                    { name: 'save', message: '🟢 Save New API Key' },
                    { name: 'reject', message: '❌ Reject / Cancel' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const ans = await confirm.run().catch(() => 'reject');
            if (ans === 'save') {
                config.setApiKey(keyRes.trim());
                console.log(TerminalUI.formatSuccess('API Key updated successfully.'));
            } else {
                console.log(chalk.yellow('\n⚠️ API Key change rejected.'));
            }
        }
    } else if (choice === 'theme') {
        await TerminalUI.previewThemes(config);
    }

    console.log(TerminalUI.formatSuccess('Settings updated.'));
    return { success: true };
}

/**
 * Display formatted system diagnostic logs table.
 * @returns {Promise<{ success: boolean, error?: string }>} Execution status
 */
async function showLogs() {
    const logPath = path.join(os.homedir(), '.lorapok', 'logs', 'combined.log');
    console.log(chalk.cyan.bold('\n📊 SYSTEM DIAGNOSTIC LOGS\n'));

    try {
        if (!fs.existsSync(logPath)) {
            console.log(chalk.yellow('  No log file found yet.'));
            await new Input({ message: 'Press Enter to continue ⏎ ‣' }).run().catch(() => null);
            return { success: true };
        }

        const rawLogs = fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-15);
        const Table = require('cli-table3');
        const table = new Table({
            head: [chalk.cyan('Time'), chalk.cyan('Level'), chalk.cyan('Message')],
            style: { head: [], border: ['gray'] },
            colWidths: [12, 10, 50]
        });

        rawLogs.forEach(line => {
            try {
                const log = JSON.parse(line);
                const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false });
                let level = log.level.toUpperCase();

                if (level === 'ERROR') level = chalk.red.bold(level);
                else if (level === 'WARN') level = chalk.yellow.bold(level);
                else level = chalk.blue(level);

                table.push([chalk.gray(time), level, chalk.white(log.message)]);
            } catch (e) {
                if (line.trim()) table.push(['-', '-', line.trim()]);
            }
        });

        console.log(table.toString());
    } catch (e) {
        console.log(TerminalUI.formatError(`Could not read logs: ${e.message}`));
        return { success: false, error: e.message };
    }
    console.log('');
    await new Input({ message: 'Press Enter to continue ⏎ ‣' }).run().catch(() => null);
    return { success: true };
}

/**
 * Slash command handler for switching active LLM model (`/model <modelId>`).
 * @param {string} modelId - Target model identifier
 * @param {Object} context - CommandContext containing { config, ui }
 * @returns {Promise<{ success: boolean, model?: string, error?: string }>} Command result
 */
async function handleModelCommand(modelId, context) {
    const { config, ui } = context;
    if (!modelId) {
        console.log(chalk.cyan(`Current model: ${config.getModel()}`));
        return { success: true, model: config.getModel() };
    }

    config.setModel(modelId.trim());
    console.log(ui.formatSuccess(`Active model changed to ${modelId.trim()}`));
    return { success: true, model: modelId.trim() };
}

/**
 * Slash command handler for inspecting or setting config entries (`/config [key] [value]`).
 * @param {string} [key] - Configuration key
 * @param {string} [value] - New value for key
 * @param {Object} context - CommandContext containing { config, ui }
 * @returns {Promise<{ success: boolean, key?: string, value?: any, error?: string }>} Command result
 */
async function handleConfigCommand(key, value, context) {
    const { config, ui } = context;
    if (!key) {
        console.log(chalk.cyan(`Config summary:`));
        console.log(`  Model: ${config.getModel()}`);
        console.log(`  Language: ${config.getLanguage()}`);
        console.log(`  User: ${config.getUserName()}`);
        return { success: true };
    }

    const cleanKey = key.trim().toLowerCase();
    if (value === undefined) {
        let val;
        if (cleanKey === 'model') val = config.getModel();
        else if (cleanKey === 'language') val = config.getLanguage();
        else if (cleanKey === 'username' || cleanKey === 'name') val = config.getUserName();

        console.log(chalk.cyan(`${key}: ${val}`));
        return { success: true, key: cleanKey, value: val };
    }

    const cleanVal = value.trim();
    if (cleanKey === 'model') config.setModel(cleanVal);
    else if (cleanKey === 'language') config.setLanguage(cleanVal);
    else if (cleanKey === 'username' || cleanKey === 'name') config.setUserName(cleanVal);

    console.log(ui.formatSuccess(`Updated config ${cleanKey} = ${cleanVal}`));
    return { success: true, key: cleanKey, value: cleanVal };
}

/**
 * Slash command & settings handler for LLM response cache (`/cache [action]`).
 * @param {string} [subCommand] - Optional subcommand ('stats', 'clear', 'toggle', 'enable', 'disable')
 * @param {Object} context - CommandContext containing { agent, config, ui }
 * @returns {Promise<{ success: boolean, stats?: Object }>} Execution result
 */
async function handleCacheCommand(subCommand, context) {
    const { agent, config, ui } = context;
    const cache = agent ? agent.responseCache : new (require('../lib/cache'))();

    if (subCommand === 'clear') {
        cache.clear();
        console.log(ui.formatSuccess('Response cache cleared successfully.'));
        return { success: true };
    }

    if (subCommand === 'enable' || subCommand === 'on') {
        config.setCacheEnabled(true);
        cache.setEnabled(true);
        console.log(ui.formatSuccess('Response caching ENABLED.'));
        return { success: true };
    }

    if (subCommand === 'disable' || subCommand === 'off') {
        config.setCacheEnabled(false);
        cache.setEnabled(false);
        console.log(ui.formatSuccess('Response caching DISABLED.'));
        return { success: true };
    }

    // Default interactive stats & management menu
    const stats = cache.getStats();
    const boxen = require('boxen');

    const statsOutput = [
        chalk.cyan.bold('⚡ LORAPOK RESPONSE CACHE ENGINE'),
        '',
        `Status: ${stats.enabled ? chalk.green.bold('Active / Enabled') : chalk.yellow.bold('Disabled')}`,
        `Cache Hits: ${chalk.green.bold(stats.hits)}`,
        `Cache Misses: ${chalk.yellow(stats.misses)}`,
        `Hit Rate: ${chalk.cyan.bold(stats.hitRate)}`,
        `Tokens Saved: ${chalk.green.bold(stats.tokensSaved.toLocaleString())} tokens`,
        `Cached Items: ${chalk.cyan(stats.itemCount)} entries`
    ].join('\n');

    console.log(boxen(statsOutput, { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

    const cacheMenu = new Select({
        message: 'Cache Management:',
        choices: [
            { name: 'toggle', message: stats.enabled ? '⏸ Disable Response Caching' : '▶ Enable Response Caching' },
            { name: 'clear', message: '🗑 Clear All Cached Responses' },
            { name: 'back', message: '🔙 Back' }
        ],
        result(name) { return this.map(name)[name]; }
    });

    const choice = await cacheMenu.run().catch(() => 'back');

    if (choice === 'toggle') {
        const nextState = !stats.enabled;
        config.setCacheEnabled(nextState);
        cache.setEnabled(nextState);
        console.log(ui.formatSuccess(`Response caching is now ${nextState ? 'ENABLED' : 'DISABLED'}.`));
    } else if (choice === 'clear') {
        cache.clear();
        console.log(ui.formatSuccess('Cache storage cleared.'));
    }

    return { success: true, stats };
}

module.exports = {
    showSettings,
    showLogs,
    handleModelCommand,
    handleConfigCommand,
    handleCacheCommand
};

