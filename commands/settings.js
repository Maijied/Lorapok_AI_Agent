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
const boxen = require('boxen');
const GithubAuth = require('../services/GithubAuth');

async function openBrowserUrl(url) {
    const ghAuth = new GithubAuth();
    return await ghAuth.openBrowser(url);
}

function getOpenRouterInstructions() {
    return [
        chalk.cyan.bold('🌐 How to Create an OpenRouter API Key:\n'),
        chalk.white('1. Open your browser and navigate to:'),
        chalk.underline.yellow('   https://openrouter.ai/keys'),
        '',
        chalk.white('2. Sign in or create a free OpenRouter account.'),
        chalk.white('3. Click ') + chalk.green('"Create Key"') + chalk.white(' (or "Add API Key").'),
        chalk.white('4. Enter a name for the key (e.g. ') + chalk.yellow('Lorapok-Agent') + chalk.white(').'),
        chalk.white('5. Copy the generated key (starts with ') + chalk.cyan('sk-or-v1-...') + chalk.white(').'),
        chalk.white('6. Paste the key into Lorapok CLI settings.')
    ].join('\n');
}

function getPerplexityInstructions() {
    return [
        chalk.magenta.bold('🟣 How to Create a Perplexity API Key:\n'),
        chalk.white('1. Open your browser and navigate to:'),
        chalk.underline.yellow('   https://www.perplexity.ai/settings/api'),
        '',
        chalk.white('2. Sign in to your Perplexity AI account.'),
        chalk.white('3. Go to API Settings and click ') + chalk.green('"Generate API Key"') + chalk.white('.'),
        chalk.white('4. Add payment / credit balance if required by Perplexity.'),
        chalk.white('5. Copy the generated key (starts with ') + chalk.cyan('pplx-...') + chalk.white(').'),
        chalk.white('6. Paste the key into Lorapok CLI settings.')
    ].join('\n');
}

function getGoogleInstructions() {
    return [
        chalk.green.bold('✨ How to Create a Google AI Studio (Gemini) API Key:\n'),
        chalk.white('1. Open your browser and navigate to:'),
        chalk.underline.yellow('   https://aistudio.google.com/app/apikey'),
        '',
        chalk.white('2. Sign in with your Google account.'),
        chalk.white('3. Click ') + chalk.green('"Create API key"') + chalk.white('.'),
        chalk.white('4. Select a project and copy your key (starts with ') + chalk.cyan('AIzaSy...') + chalk.white(').'),
        chalk.white('5. Paste the key into Lorapok CLI settings.')
    ].join('\n');
}

async function handleApiKeySettings(config) {
    const keyMenu = new Select({
        message: '🔑 Select API Key Provider to Update:',
        choices: [
            { name: 'google', message: '✨ Google AI Studio API Key (https://aistudio.google.com/app/apikey)' },
            { name: 'openrouter', message: '🌐 OpenRouter API Key (https://openrouter.ai/keys)' },
            { name: 'perplexity', message: '🟣 Perplexity API Key (https://www.perplexity.ai/settings/api)' },
            { name: 'instructions', message: '📖 View Detailed Key Creation Instructions' },
            { name: 'back', message: '🔙 Back' }
        ],
        result(name) { return this.map(name)[name]; }
    });

    const subChoice = await keyMenu.run().catch(() => 'back');
    if (subChoice === 'back') return;

    if (subChoice === 'instructions') {
        console.log('\n' + boxen(getGoogleInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'green' }));
        console.log('\n' + boxen(getOpenRouterInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));
        console.log('\n' + boxen(getPerplexityInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'magenta' }));
        return;
    }

    if (subChoice === 'google') {
        const url = 'https://aistudio.google.com/app/apikey';
        console.log('\n' + boxen(getGoogleInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'green' }));
        
        const openAns = await new Select({
            message: 'Open https://aistudio.google.com/app/apikey in your browser now?',
            choices: [
                { name: 'open', message: '🌐 Yes, open browser' },
                { name: 'skip', message: '⏩ Skip opening, I will paste my key' }
            ],
            result(name) { return this.map(name)[name]; }
        }).run().catch(() => 'skip');

        if (openAns === 'open') {
            await openBrowserUrl(url);
            console.log(chalk.gray('Opening browser to https://aistudio.google.com/app/apikey...'));
        }

        const keyRes = await new Input({ message: '🔑 Enter/Paste Google AI Studio API Key:' }).run().catch(() => null);
        if (keyRes && keyRes.trim()) {
            config.setGoogleApiKey(keyRes.trim());
            console.log(TerminalUI.formatSuccess('Google AI Studio API Key saved successfully.'));
        }
    }

    if (subChoice === 'openrouter') {
        const url = 'https://openrouter.ai/keys';
        console.log('\n' + boxen(getOpenRouterInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));
        
        const openAns = await new Select({
            message: 'Open https://openrouter.ai/keys in your browser now?',
            choices: [
                { name: 'open', message: '🌐 Yes, open browser' },
                { name: 'skip', message: '⏩ Skip opening, I will paste my key' }
            ],
            result(name) { return this.map(name)[name]; }
        }).run().catch(() => 'skip');

        if (openAns === 'open') {
            await openBrowserUrl(url);
            console.log(chalk.gray('Opening browser to https://openrouter.ai/keys...'));
        }

        const keyRes = await new Input({ message: '🔑 Enter/Paste OpenRouter API Key:' }).run().catch(() => null);
        if (keyRes && keyRes.trim()) {
            config.setOpenRouterApiKey(keyRes.trim());
            console.log(TerminalUI.formatSuccess('OpenRouter API Key saved successfully.'));
        }
    } else if (subChoice === 'perplexity') {
        const url = 'https://www.perplexity.ai/settings/api';
        console.log('\n' + boxen(getPerplexityInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'magenta' }));
        
        const openAns = await new Select({
            message: 'Open https://www.perplexity.ai/settings/api in your browser now?',
            choices: [
                { name: 'open', message: '🌐 Yes, open browser' },
                { name: 'skip', message: '⏩ Skip opening, I will paste my key' }
            ],
            result(name) { return this.map(name)[name]; }
        }).run().catch(() => 'skip');

        if (openAns === 'open') {
            await openBrowserUrl(url);
            console.log(chalk.gray('Opening browser to https://www.perplexity.ai/settings/api...'));
        }

        const keyRes = await new Input({ message: '🔑 Enter/Paste Perplexity API Key:' }).run().catch(() => null);
        if (keyRes && keyRes.trim()) {
            config.setPerplexityApiKey(keyRes.trim());
            console.log(TerminalUI.formatSuccess('Perplexity API Key saved successfully.'));
        }
    }
}

async function handleModelSelection(agent, config) {
    const ora = require('ora');
    const isInteractive = process.stdout.isTTY;
    let spinner = null;
    if (isInteractive) {
        spinner = ora('Fetching available models from Google AI Studio, OpenRouter API & Perplexity...').start();
    } else {
        console.log(chalk.cyan('Fetching available models...'));
    }

    let models = {};
    try {
        models = await agent.checkAvailableModels();
        if (spinner) spinner.stop();
    } catch (e) {
        if (spinner) spinner.fail('Failed to fetch models: ' + e.message);
        else console.log(chalk.red('Failed to fetch models: ' + e.message));
        return;
    }

    const totalCount = Object.keys(models).length;
    const availableCount = Object.values(models).filter(m => m.available).length;
    console.log(chalk.cyan(`\n🧠 Loaded ${totalCount} dynamic models from API (${availableCount} available with active keys).\n`));

    while (true) {
        const mainMenu = new Select({
            message: '🧠 Model Selection & Configuration',
            choices: [
                { name: 'ready', message: '🟢 View Ready Models (Available Without Credit Errors)' },
                { name: 'category', message: '📁 Browse by Domain / Category' },
                { name: 'provider', message: '🏢 Browse by AI Provider (Google AI Studio, Perplexity, OpenRouter)' },
                { name: 'tier', message: '💰 Browse by Pricing Tier (Free, Pro)' },
                { name: 'all', message: '🌐 View All Supported Models' },
                { name: 'back', message: '🔙 Back to Settings' }
            ],
            result(name) { return this.map(name)[name]; }
        });

        const filterMode = await mainMenu.run().catch(() => 'back');
        if (filterMode === 'back') return;

        let filteredModelKeys = Object.keys(models);
        let menuTitle = '';

        if (filterMode === 'ready') {
            filteredModelKeys = filteredModelKeys.filter(id => models[id].available);
            menuTitle = 'Ready Models';
        } else if (filterMode === 'category') {
            const categoryMenu = new Select({
                message: '📁 Select Category:',
                choices: [
                    { name: 'coding', message: '💻 Coding & Engineering' },
                    { name: 'reasoning', message: '🔬 Complex Logic & Reasoning' },
                    { name: 'research', message: '🔍 Web Research & Search' },
                    { name: 'fast', message: '⚡ Fast & Lightweight' },
                    { name: 'back', message: '🔙 Back' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const cat = await categoryMenu.run().catch(() => 'back');
            if (cat === 'back') continue;
            filteredModelKeys = filteredModelKeys.filter(id => models[id].category === cat);
            menuTitle = `Category: ${cat}`;
        } else if (filterMode === 'provider') {
            const provMenu = new Select({
                message: '🏢 Select Provider:',
                choices: [
                    { name: 'google-ai-studio', message: '✨ Google AI Studio' },
                    { name: 'perplexity', message: '🟣 Perplexity AI' },
                    { name: 'openrouter', message: '🔵 OpenRouter' },
                    { name: 'back', message: '🔙 Back' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const prov = await provMenu.run().catch(() => 'back');
            if (prov === 'back') continue;
            filteredModelKeys = filteredModelKeys.filter(id => models[id].provider === prov);
            menuTitle = `Provider: ${prov}`;
        } else if (filterMode === 'tier') {
            const tierMenu = new Select({
                message: '💰 Select Pricing Tier:',
                choices: [
                    { name: 'free', message: '🆓 Free Models' },
                    { name: 'pro', message: '💎 Pro / Paid Models' },
                    { name: 'back', message: '🔙 Back' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const tier = await tierMenu.run().catch(() => 'back');
            if (tier === 'back') continue;
            filteredModelKeys = filteredModelKeys.filter(id => models[id].tier === tier);
            menuTitle = `Tier: ${tier}`;
        } else {
            menuTitle = 'All Models';
        }

        if (filteredModelKeys.length === 0) {
            console.log(chalk.yellow(`\n⚠️ No models found for ${menuTitle}.\n`));
            continue;
        }

        const choices = filteredModelKeys.map(id => {
            const item = models[id];
            const statusIcon = item.available ? chalk.green('🟢') : chalk.gray('🔒');
            
            // Clean duplicate provider suffix from model display name
            const cleanName = (item.name || id)
                .replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '')
                .trim();

            let providerTag = chalk.magenta('[Perplexity]');
            if (item.provider === 'google-ai-studio') providerTag = chalk.cyan('[Google]');
            if (item.provider === 'openrouter') providerTag = chalk.blue('[OpenRouter]');
            const tierTag = item.tier === 'free' ? chalk.green('(Free)') : chalk.yellow('(Pro)');
            
            let limitTag = '';
            if (item.rateLimit) {
                limitTag = chalk.gray(` ⚡ ${item.rateLimit}`);
            } else if (item.contextLength) {
                const ctxK = Math.round(item.contextLength / 1000);
                limitTag = chalk.gray(` ⚡ ${ctxK >= 1000 ? `${(ctxK/1000).toFixed(0)}M` : `${ctxK}k`} ctx`);
            }

            let resetTag = '';
            if (item.resetWindow) {
                resetTag = chalk.dim(` ⏱️ ${item.resetWindow}`);
            }

            return {
                name: id,
                message: `${statusIcon} ${cleanName} ${providerTag} ${tierTag}${limitTag}${resetTag}`
            };
        });
        
        choices.push({ name: 'back', message: '🔙 Back to Filter Menu' });

        const modelSelect = new Select({
            message: `🧠 Select from ${menuTitle} (${filteredModelKeys.length} found):`,
            choices
        });

        const model = await modelSelect.run().catch(() => 'back');
        if (model === 'back') continue;

        if (model) {
            const selectedModel = models[model];
            const confirm = new Select({
                message: `Switch active AI model to '${selectedModel?.name || model}'?`,
                choices: [
                    { name: 'save', message: '🟢 Switch & Save Model' },
                    { name: 'reject', message: '❌ Reject / Cancel' }
                ],
                result(name) { return this.map(name)[name]; }
            });
            const ans = await confirm.run().catch(() => 'reject');
            if (ans === 'save') {
                config.setModel(model);
                console.log(TerminalUI.formatSuccess(`AI Model updated to ${selectedModel?.name || model}.`));
                return;
            } else {
                console.log(chalk.yellow('\n⚠️ Model change rejected. Kept current model.\n'));
            }
        }
    }
}

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
            { name: 'model', message: '🧠 LLM Model Configuration' },
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
        await handleModelSelection(agent, config);
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
        await handleApiKeySettings(config);
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
/**
 * Slash command handler for inspecting, switching, or listing LLM models (`/model [subcommand/modelId]`).
 * @param {Array<string>|string} [args] - Subcommands ('info', 'list', 'set') or target model ID
 * @param {Object} context - CommandContext containing { agent, config, ui, sessionData }
 * @returns {Promise<{ success: boolean, model?: string, error?: string }>} Command result
 */
async function handleModelCommand(args, context) {
    const { agent, config, ui, sessionData } = context;
    const sub = Array.isArray(args) ? args[0] : args;
    const targetModel = Array.isArray(args) ? (args[1] || args[0]) : args;

    if (!sub || sub === '') {
        await handleModelSelection(agent, config);
        return { success: true, model: config.getModel() };
    }

    const cleanSub = String(sub).toLowerCase().trim();

    if (cleanSub === 'info') {
        const activeModelId = config.getModel();
        const allModels = agent?.modelManager ? agent.modelManager.cache.get('allModels') : null;
        const meta = allModels ? allModels[activeModelId] : null;
        const icon = meta?.icon || (agent?.modelManager ? agent.modelManager.getModelIcon(activeModelId) : '🧠');

        const usageInfo = sessionData?.modelUsage?.[activeModelId] || { requests: 0, prompt: 0, completion: 0, total: 0 };

        console.log(chalk.cyan.bold('\n🧠 ACTIVE LLM MODEL INFO\n'));
        console.log(`  Model ID:        ${chalk.white.bold(activeModelId)}`);
        console.log(`  Display Name:    ${meta?.name || `${icon} ${activeModelId}`}`);
        console.log(`  Provider:        ${meta?.provider === 'openrouter' ? chalk.cyan('OpenRouter API') : chalk.magenta('Perplexity API')}`);
        console.log(`  Category:        ${meta?.category ? meta.category.toUpperCase() : 'General'}`);
        console.log(`  Context Window:  ${meta?.contextLength ? `${(meta.contextLength / 1000).toFixed(0)}k tokens` : 'N/A'}`);
        console.log(`  Session Reqs:    ${chalk.yellow(usageInfo.requests)} requests`);
        console.log(`  Tokens Used:     ${chalk.green(usageInfo.total.toLocaleString())} tokens\n`);
        return { success: true, model: activeModelId };
    }

    if (cleanSub === 'list' || cleanSub === 'ls') {
        const ora = require('ora');
        let spinner = null;
        if (process.stdout.isTTY) {
            spinner = ora('Fetching available models...').start();
        }
        let models = {};
        try {
            models = await agent.checkAvailableModels();
            if (spinner) spinner.stop();
        } catch (e) {
            if (spinner) spinner.fail('Failed to fetch models: ' + e.message);
            return { success: false, error: e.message };
        }

        console.log(chalk.cyan.bold(`\n🧠 AVAILABLE LLM MODELS (${Object.keys(models).length} TOTAL)\n`));
        const categories = ['coding', 'reasoning', 'research', 'fast', 'general'];
        const Table = require('cli-table3');

        categories.forEach(cat => {
            const catModels = Object.keys(models).filter(id => models[id].category === cat);
            if (catModels.length === 0) return;

            const table = new Table({
                head: [chalk.cyan('Model ID'), chalk.cyan('Provider'), chalk.cyan('Context'), chalk.cyan('Status')],
                style: { head: [], border: ['gray'] }
            });

            catModels.slice(0, 8).forEach(id => {
                const item = models[id];
                const status = item.available ? chalk.green('🟢 Ready') : chalk.gray('🔒 Key needed');
                const provider = item.provider === 'openrouter' ? chalk.cyan('OpenRouter') : chalk.magenta('Perplexity');
                const ctx = item.contextLength ? `${(item.contextLength / 1000).toFixed(0)}k` : 'N/A';
                table.push([chalk.bold(item.name || id), provider, ctx, status]);
            });

            console.log(chalk.yellow.bold(`📁 Category: ${cat.toUpperCase()} (${catModels.length} models)`));
            console.log(table.toString() + '\n');
        });
        return { success: true };
    }

    const nextModel = (cleanSub === 'set' && targetModel) ? targetModel : sub;
    config.setModel(String(nextModel).trim());
    console.log(ui.formatSuccess(`Active model changed to ${String(nextModel).trim()}`));
    return { success: true, model: String(nextModel).trim() };
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

