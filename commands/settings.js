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
const modelCacheService = require('../services/ModelCacheService');
const { menuChoice, backChoice, menuMessage } = require('../lib/menu-format');

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

async function reportKeyConnection(providerLabel, verifyResult) {
    const state = verifyResult?.state || 'error';
    const detail = verifyResult?.detail || 'Unknown error';
    if (verifyResult?.connected) {
        const suffix = state === 'rate_limited' ? ' (rate limited — key is valid)' : '';
        console.log(TerminalUI.formatSuccess(`Connected to ${providerLabel}${suffix}.`));
        if (detail && !/^OK$/i.test(detail) && !detail.toLowerCase().includes('accepted')) {
            console.log(chalk.gray(`  ${detail}`));
        }
        return;
    }
    if (state === 'locked') {
        console.log(TerminalUI.formatError(
            `${providerLabel} rejected the key or requires billing/credits.`
        ));
    } else {
        console.log(TerminalUI.formatError(
            `Could not connect to ${providerLabel}.`
        ));
    }
    if (detail) console.log(chalk.gray(`  ${detail}`));
    if (verifyResult?.status) console.log(chalk.gray(`  HTTP ${verifyResult.status}`));
}

/**
 * Save key, live-verify provider connection, invalidate model caches.
 * @param {Object} config
 * @param {'google'|'openrouter'|'perplexity'} which
 * @param {string} rawKey
 * @param {Object} [agent] - Optional agent to flush in-memory model cache
 */
async function saveAndVerifyApiKey(config, which, rawKey, agent = null) {
    const ora = require('ora');
    const modelAccessService = require('../services/ModelAccessService');
    const key = String(rawKey || '').trim();
    if (!key) return;

    const map = {
        google: {
            set: () => config.setGoogleApiKey(key),
            provider: 'google-ai-studio',
            label: 'Google AI Studio',
            saved: 'Google AI Studio API Key saved successfully.'
        },
        openrouter: {
            set: () => config.setOpenRouterApiKey(key),
            provider: 'openrouter',
            label: 'OpenRouter',
            saved: 'OpenRouter API Key saved successfully.'
        },
        perplexity: {
            set: () => config.setPerplexityApiKey(key),
            provider: 'perplexity',
            label: 'Perplexity',
            saved: 'Perplexity API Key saved successfully.'
        }
    };
    const entry = map[which];
    if (!entry) return;

    entry.set();
    console.log(TerminalUI.formatSuccess(entry.saved));

    // Drop stale probe/catalog failures before the live check (e.g. old max_tokens:1 400s).
    try {
        if (typeof modelCacheService.clearCache === 'function') modelCacheService.clearCache();
        else if (typeof modelCacheService.clearFailedModels === 'function') modelCacheService.clearFailedModels();
        if (typeof modelAccessService.clearCache === 'function') modelAccessService.clearCache();
        if (agent && agent.cache && typeof agent.cache.del === 'function') {
            agent.cache.del('availableModels');
            agent.cache.del('allModels');
        }
        if (agent && agent.modelManager && agent.modelManager.cache && typeof agent.modelManager.cache.del === 'function') {
            agent.modelManager.cache.del('allModels');
            agent.modelManager.cache.del('availableModels');
        }
        if (agent && typeof agent.apiKey !== 'undefined' && which === 'perplexity') {
            agent.apiKey = key;
        }
    } catch (_) { /* ignore cache refresh errors */ }

    let spinner = null;
    if (process.stdout.isTTY) {
        spinner = ora(`Testing connection to ${entry.label}...`).start();
    }
    let result;
    try {
        result = await modelAccessService.verifyProviderKey(entry.provider, key);
    } catch (err) {
        result = {
            connected: false,
            ok: false,
            state: 'error',
            detail: err.message || 'Connection test failed',
            status: null
        };
    }
    if (spinner) spinner.stop();

    reportKeyConnection(entry.label, result);

    if (result?.connected) {
        console.log(chalk.gray('  Re-open Model Selection to refresh the usable catalog.'));
    }
}

async function handleApiKeySettings(config, agent = null) {
    const keyMenu = new Select({
        message: '🔑 Select API Key Provider to Update:',
        choices: [
            menuChoice('google', '✨', 'Google AI Studio API Key (https://aistudio.google.com/app/apikey)'),
            menuChoice('openrouter', '🌐', 'OpenRouter API Key (https://openrouter.ai/keys)'),
            menuChoice('perplexity', '🟣', 'Perplexity API Key (https://www.perplexity.ai/settings/api)'),
            menuChoice('instructions', '📖', 'View Detailed Key Creation Instructions'),
            backChoice()
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
                menuChoice('open', '🌐', 'Yes, open browser'),
                menuChoice('skip', '⏩', 'Skip opening, I will paste my key')
            ],
            result(name) { return this.map(name)[name]; }
        }).run().catch(() => 'skip');

        if (openAns === 'open') {
            await openBrowserUrl(url);
            console.log(chalk.gray('Opening browser to https://aistudio.google.com/app/apikey...'));
        }

        const keyRes = await new Input({ message: '🔑 Enter/Paste Google AI Studio API Key:' }).run().catch(() => null);
        if (keyRes && keyRes.trim()) {
            await saveAndVerifyApiKey(config, 'google', keyRes, agent);
        }
    }

    if (subChoice === 'openrouter') {
        const url = 'https://openrouter.ai/keys';
        console.log('\n' + boxen(getOpenRouterInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));
        
        const openAns = await new Select({
            message: 'Open https://openrouter.ai/keys in your browser now?',
            choices: [
                menuChoice('open', '🌐', 'Yes, open browser'),
                menuChoice('skip', '⏩', 'Skip opening, I will paste my key')
            ],
            result(name) { return this.map(name)[name]; }
        }).run().catch(() => 'skip');

        if (openAns === 'open') {
            await openBrowserUrl(url);
            console.log(chalk.gray('Opening browser to https://openrouter.ai/keys...'));
        }

        const keyRes = await new Input({ message: '🔑 Enter/Paste OpenRouter API Key:' }).run().catch(() => null);
        if (keyRes && keyRes.trim()) {
            await saveAndVerifyApiKey(config, 'openrouter', keyRes, agent);
        }
    } else if (subChoice === 'perplexity') {
        const url = 'https://www.perplexity.ai/settings/api';
        console.log('\n' + boxen(getPerplexityInstructions(), { padding: 1, borderStyle: 'round', borderColor: 'magenta' }));
        
        const openAns = await new Select({
            message: 'Open https://www.perplexity.ai/settings/api in your browser now?',
            choices: [
                menuChoice('open', '🌐', 'Yes, open browser'),
                menuChoice('skip', '⏩', 'Skip opening, I will paste my key')
            ],
            result(name) { return this.map(name)[name]; }
        }).run().catch(() => 'skip');

        if (openAns === 'open') {
            await openBrowserUrl(url);
            console.log(chalk.gray('Opening browser to https://www.perplexity.ai/settings/api...'));
        }

        const keyRes = await new Input({ message: '🔑 Enter/Paste Perplexity API Key:' }).run().catch(() => null);
        if (keyRes && keyRes.trim()) {
            await saveAndVerifyApiKey(config, 'perplexity', keyRes, agent);
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
        models = await agent.checkAvailableModels({ force: true });
        if (spinner) spinner.stop();
    } catch (e) {
        if (spinner) spinner.fail('Failed to fetch models: ' + e.message);
        else console.log(chalk.red('Failed to fetch models: ' + e.message));
        return;
    }

    const mm = agent.modelManager;
    const accessibleKeys = mm.getUsableModelIds(models);
    const paidKeys = mm.getPaidCatalogIds(models);
    console.log(chalk.cyan(`\n🧠 Loaded ${Object.keys(models).length} models — ${chalk.green(accessibleKeys.length + ' free accessible')} | ${chalk.yellow(paidKeys.length + ' paid')} (see 💰 Paid Catalog).\n`));
    const hotLimited = accessibleKeys.filter(id => {
        const a = models[id]?.accessState || '';
        return a === 'rate_limited';
    }).length;
    if (hotLimited > 0) {
        console.log(chalk.red(`  ${hotLimited} usable model(s) recently hit provider rate limits (🔴). Prefer 🟢 Free Tier / Flash models until quotas reset.\n`));
    }
    if (accessibleKeys.length === 0 && config.getPerplexityApiKey && config.getPerplexityApiKey()) {
        console.log(chalk.gray('  Perplexity key is set. Sonar is free-tier once live probe succeeds; Pro models live under 💰 Paid Catalog (API credits required).\n'));
    }

    const chalkByColor = {
        green: chalk.green,
        cyan: chalk.cyan,
        magenta: chalk.magenta,
        red: chalk.red,
        yellow: chalk.yellow,
        gray: chalk.gray
    };

    const getTierLabel = (item, hasAccess, showCatalog) => {
        const style = mm.getTierStyle(item, hasAccess, showCatalog);
        const paint = chalkByColor[style.color] || chalk.white;
        return paint(style.label);
    };

    const getStatusIcon = (item, hasAccess, showCatalog) => {
        const style = mm.getTierStyle(item, hasAccess, showCatalog);
        const paint = chalkByColor[style.color] || chalk.white;
        return paint(style.icon);
    };

    while (true) {
        const mainMenu = new Select({
            message: '🧠 Model Selection & Configuration',
            choices: [
                menuChoice('ready', '🟢', 'Currently Usable (accessible with your keys)'),
                menuChoice('category', '📁', 'Browse by domain / category'),
                menuChoice('provider', '🏢', 'Browse by AI provider'),
                menuChoice('all', '🌐', 'View all supported models'),
                backChoice('back')
            ],
            result(name) { return this.map(name)[name]; }
        });

        const filterMode = await mainMenu.run().catch(() => 'back');
        if (filterMode === 'back') return;

        let filteredModelKeys = [];
        let menuTitle = '';
        let showAllPaidCatalog = false;

        if (filterMode === 'ready') {
            filteredModelKeys = mm.getUsableModelIds(models);
            menuTitle = 'Currently Usable Models';

        } else if (filterMode === 'category') {
            const categoryMenu = new Select({
                message: '📁 Select Category (chat-compatible models only):',
                choices: [
                    menuChoice('coding', '💻', 'Coding & Engineering'),
                    menuChoice('reasoning', '🔬', 'Complex Logic & Reasoning'),
                    menuChoice('research', '🔍', 'Web Research & Search'),
                    menuChoice('agent', '🤖', 'Autonomous Agents & Tools'),
                    menuChoice('openweights', '🦙', 'Open Weights & Open Source'),
                    menuChoice('fast', '🚀', 'Fast & Lightweight'),
                    menuChoice('general', '🌐', 'General Intelligence'),
                    backChoice('back')
                ],
                result(name) { return this.map(name)[name]; }
            });
            const cat = await categoryMenu.run().catch(() => 'back');
            if (cat === 'back') continue;
            filteredModelKeys = typeof mm.getUsableModelsByCategoryView === 'function'
                ? mm.getUsableModelsByCategoryView(models, cat)
                : mm.getModelsByCategoryView(models, cat);
            menuTitle = `Category: ${cat}`;

        } else if (filterMode === 'provider') {
            const accessibleProviders = mm.getKeyedProviders
                ? mm.getKeyedProviders(models)
                : [...new Set(mm.getUsableModelIds(models).map(id => models[id].provider))].filter(Boolean);
            if (accessibleProviders.length === 0) {
                console.log(chalk.yellow('\n⚠️  No accessible providers found.'));
                console.log(chalk.gray('   Add an API key in Settings → Update API Key to browse by provider.'));
                console.log(chalk.gray('   Google AI Studio (free): https://aistudio.google.com/app/apikey'));
                console.log(chalk.gray('   OpenRouter (free tier): https://openrouter.ai/keys'));
                console.log(chalk.gray('   Perplexity AI: https://www.perplexity.ai/settings/api\n'));
                continue;
            }
            const providerChoices = accessibleProviders.map(p => {
                let icon = '🏢';
                let label = p.charAt(0).toUpperCase() + p.slice(1);
                if (p === 'google-ai-studio') { icon = '✨'; label = 'Google AI Studio'; }
                else if (p === 'perplexity') { icon = '🟣'; label = 'Perplexity AI (Sonar API — 4 models)'; }
                else if (p === 'openrouter') { icon = '🔵'; label = 'OpenRouter'; }
                return menuChoice(p, icon, label);
            });
            providerChoices.push(menuChoice('back', '←', 'Back to Main Menu'));

            const provMenu = new Select({
                message: '🏢 Select Provider (Active keys only):',
                choices: providerChoices,
                result(name) { return this.map(name)[name]; }
            });
            const prov = await provMenu.run().catch(() => 'back');
            if (prov === 'back') continue;
            filteredModelKeys = mm.getModelsByProviderView(models, prov);
            menuTitle = `Provider: ${prov}`;
            // Provider browse includes paid models with a key — use paid-catalog labels
            if (prov === 'perplexity' || prov === 'openrouter') {
                showAllPaidCatalog = filteredModelKeys.some(id => !mm.isFreeTier({ ...models[id], id }));
            }

        } else if (filterMode === 'all') {
            const allSubMenu = new Select({
                message: '🌐 View All Supported Models:',
                choices: [
                    menuChoice('usable', '🟢', 'Currently Usable (Accessible With Your Keys)'),
                    menuChoice('paid', '💰', 'Paid / Pro Tier Catalog (All — For Reference & Purchasing)'),
                    menuChoice('back', '←', 'Back to Main Menu')
                ],
                result(name) { return this.map(name)[name]; }
            });
            const subAll = await allSubMenu.run().catch(() => 'back');
            if (subAll === 'back') continue;

            if (subAll === 'usable') {
                filteredModelKeys = mm.getUsableModelIds(models);
                menuTitle = 'Currently Usable Models';
            } else {
                filteredModelKeys = mm.getPaidCatalogIds(models);
                menuTitle = 'Paid / Pro Tier Model Catalog';
                showAllPaidCatalog = true;
            }
        }

        if (filteredModelKeys.length === 0) {
            const { getTheme, getDefaultThemeId } = require('../lib/theme');
            const theme = getTheme(config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
            let detail = 'No models matched this view.';
            if (menuTitle.startsWith('Category:')) {
                detail = 'No free-accessible models in this category yet. Try another category, add a free-tier key, or open 💰 Paid Catalog.';
            } else if (menuTitle.startsWith('Currently')) {
                detail = 'Add an API key in Settings → Update API Key, then wait for live probes (or /refresh-models).';
            } else if (menuTitle.startsWith('Provider:')) {
                detail = 'No keyed models for this provider. Re-save the API key or run /refresh-models.';
            } else if (menuTitle.includes('Paid')) {
                detail = 'Paid catalog is empty after filters. Try /refresh-models.';
            }
            console.log(theme.box(
                theme.warning(`No models — ${menuTitle}`) + '\n' + theme.muted(detail),
                { padding: { top: 0, bottom: 0, left: 1, right: 1 }, margin: { top: 1, bottom: 1 } }
            ));
            continue;
        }

        const seenNames = new Set();
        const choices = [];
        for (const id of filteredModelKeys) {
            const item = models[id];
            const hasKeyAccess = item.available === true;

            const statusIcon = getStatusIcon(item, hasKeyAccess, showAllPaidCatalog);
            const tierTag = getTierLabel(item, hasKeyAccess, showAllPaidCatalog);

            const cleanName = (item.name || id)
                .replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '')
                .trim();

            const dedupKey = `${cleanName}-${item.provider}`;
            if (seenNames.has(dedupKey)) continue;
            seenNames.add(dedupKey);

            let providerTag = chalk.magenta('[Perplexity]');
            if (item.provider === 'google-ai-studio') providerTag = chalk.cyan('[Google]');
            if (item.provider === 'openrouter') providerTag = chalk.blue('[OpenRouter]');

            let catTag = chalk.gray('[GENERAL]');
            if (item.category) {
                const cats = Array.isArray(item.category) ? item.category : [item.category];
                const chatCats = cats.filter(c => !['audio', 'image', 'video'].includes(c));
                if (chatCats.length > 0) {
                    const catStr = chatCats.map(c => c.toUpperCase()).join(', ');
                    catTag = chalk.gray(`[${catStr}]`);
                }
            }

            let limits = [];
            if (item.contextLength) {
                const ctxK = Math.round(item.contextLength / 1000);
                const ctxStr = ctxK >= 1000 ? `${(ctxK / 1000).toFixed(1)}M` : `${ctxK}k`;
                limits.push(`⚡ Ctx: ${ctxStr}`);
            }
            if (item.rateLimit) {
                limits.push(`📊 ${item.rateLimit}`);
            }
            if (item.resetWindow) {
                limits.push(`⏱️ Reset: ${item.resetWindow}`);
            }
            const limitTag = limits.length > 0 ? chalk.gray(` | ${limits.join(' | ')}`) : '';

            let disabledReason = false;
            const access = item.accessState || 'unverified';
            if (access === 'locked' || access === 'unavailable') {
                disabledReason = access === 'locked' ? '(Pro — Locked)' : '(Unavailable)';
            } else if (showAllPaidCatalog && !hasKeyAccess) {
                let keyUrl = 'https://openrouter.ai/keys';
                if (item.provider === 'perplexity') keyUrl = 'https://www.perplexity.ai/settings/api';
                if (item.provider === 'google-ai-studio') keyUrl = 'https://aistudio.google.com/app/apikey';
                disabledReason = `(Add key at ${keyUrl})`;
            } else if (!hasKeyAccess && !showAllPaidCatalog) {
                disabledReason = '(Missing API Key)';
            }

            choices.push({
                name: id,
                message: menuMessage(statusIcon, `${cleanName} ${providerTag} ${catTag} ${tierTag}${limitTag}`),
                disabled: disabledReason || false
            });
        }

        choices.push(menuChoice('back', '←', 'Back to Filter Menu'));

        const modelSelect = new Select({
            message: `🧠 Select from ${menuTitle} (${filteredModelKeys.length} models):`,
            choices
        });

        const model = await modelSelect.run().catch(() => 'back');
        if (model === 'back') continue;

        if (model) {
            const selectedModel = models[model];
            const cleanSelectedName = (selectedModel?.name || model)
                .replace(/\s*\((Google AI Studio|Perplexity|OpenRouter)\)/gi, '')
                .trim();

            // Live probe before allowing selection (paid or unverified)
            const modelAccessService = require('../services/ModelAccessService');
            const keys = {
                googleKey: config.getGoogleApiKey(),
                openRouterKey: config.getOpenRouterApiKey(),
                perplexityKey: config.getPerplexityApiKey()
            };
            let probeSpinner = null;
            if (process.stdout.isTTY) {
                probeSpinner = ora(`Verifying access to '${cleanSelectedName}'...`).start();
            }
            const probe = await modelAccessService.probeModel(model, keys, selectedModel || {});
            if (probeSpinner) probeSpinner.stop();
            models[model] = { ...selectedModel, accessState: probe.state, id: model };

            if (probe.state === 'locked' || probe.state === 'unavailable' || probe.state === 'error') {
                console.log(chalk.red(`\n❌ Model '${cleanSelectedName}' is not selectable (${probe.state}).`));
                if (probe.detail) console.log(chalk.gray(`   ${probe.detail}\n`));
                continue;
            }
            if (!mm.canSelectModel(model, models)) {
                console.log(chalk.red(`\n❌ Model '${cleanSelectedName}' is not accessible with your current keys.\n`));
                continue;
            }

            const isSelectedPaid = !mm.isFreeTier(models[model]);
            if (isSelectedPaid && probe.state === 'accessible') {
                console.log(chalk.green(`\n✅ PAID MODEL ACCESSIBLE: '${cleanSelectedName}' works with your key.`));
                console.log(chalk.gray('   Provider credits may still apply depending on your plan.\n'));
            } else if (isSelectedPaid) {
                let purchaseUrl = 'https://openrouter.ai/keys';
                if (selectedModel?.provider === 'perplexity') purchaseUrl = 'https://www.perplexity.ai/settings/api';
                console.log(chalk.yellow(`\n💳 PAID MODEL: '${cleanSelectedName}' may require credits or a paid plan.`));
                console.log(chalk.cyan(`   Manage billing: ${purchaseUrl}\n`));
            } else if (selectedModel?.provider === 'google-ai-studio' && selectedModel?.rateLimited) {
                console.log(chalk.blue(`\n🔵 RATE LIMITED MODEL: '${cleanSelectedName}' is accessible with your free Google AI Studio key.`));
                console.log(chalk.gray(`   Lower rate limits apply. Upgrade plan at: https://aistudio.google.com/app/plan\n`));
            }

            const confirm = new Select({
                message: `Switch active AI model to '${cleanSelectedName}'?`,
                choices: [
                    menuChoice('save', '🟢', 'Switch & Save Model'),
                    menuChoice('reject', '❌', 'Reject / Cancel')
                ],
                result(name) { return this.map(name)[name]; }
            });
            const ans = await confirm.run().catch(() => 'reject');
            if (ans === 'save') {
                config.setModel(model);
                const { ActiveModelService } = require('../services/ActiveModelService');
                const status = new ActiveModelService(mm).getStatus(config, models);
                console.log(TerminalUI.formatSuccess(`AI Model updated to ${status.shortLine}.`));
                return;
            } else {
                console.log(chalk.yellow('\n⚠️  Model change rejected. Kept current model.\n'));
            }
        }
    }
}

async function handleBudgetLimits(config) {
    console.log(chalk.cyan.bold('\n⚖️  Orchestrator Budget Limits\n'));
    
    const costRes = await new Input({
        message: 'Max Cost (USD) per task (0 for unlimited):',
        initial: String(config.getMaxCostUsd())
    }).run().catch(() => null);

    const tokenRes = await new Input({
        message: 'Max Tokens per task (0 for unlimited):',
        initial: String(config.getMaxTokens())
    }).run().catch(() => null);

    const callsRes = await new Input({
        message: 'Max Tool Calls per task:',
        initial: String(config.getMaxToolCalls())
    }).run().catch(() => null);

    if (costRes != null && tokenRes != null && callsRes != null) {
        config.setMaxCostUsd(costRes);
        config.setMaxTokens(tokenRes);
        config.setMaxToolCalls(callsRes);
        console.log(TerminalUI.formatSuccess('Budget limits updated successfully.', config));
    }
}

/**
 * Display settings interactive selection menu.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - Config manager instance
 * @returns {Promise<{ success: boolean, message?: string }>} Execution result status
 */
async function showSettings(agent, config) {
    while (true) {
        const select = new Select({
            name: 'setting',
            message: 'Settings & Preferences',
            styles: { underline: str => str, em: chalk.cyan.bold },
            pointer(choice, i) {
                return this.state.index === i ? chalk.cyan.bold('❯ ') : '  ';
            },
            choices: [
                menuChoice('name', '👤', 'Change user name'),
                menuChoice('model', '🧠', 'LLM model configuration'),
                menuChoice('sessions', '📁', 'Session info'),
                menuChoice('cache', '💾', 'Response cache'),
                menuChoice('limits', '⚖️', 'Orchestrator budget limits'),
                menuChoice('language', '🌐', 'Default language'),
                menuChoice('theme', '🎨', 'CLI theme'),
                menuChoice('logo', '🐛', 'Logo style (cyber / classic)'),
                menuChoice('key', '🔑', 'Update API key (encrypted vault)'),
                menuChoice('reset', '♻', 'Reset Lorapok AI'),
                backChoice('back')
            ],
            result(name) { return this.map(name)[name]; }
        });

        const choice = await select.run().catch(() => 'back');
        if (choice === 'back') return { success: true };

        let saved = false;

        if (choice === 'cache') {
            await handleCacheCommand(null, { agent, config, ui: TerminalUI });
            continue;
        }

        if (choice === 'limits') {
            await handleBudgetLimits(config);
            continue;
        }

        if (choice === 'sessions') {
            await showSessionInfo(config);
            continue;
        }

        if (choice === 'name') {
            const currentName = config.getUserName() || 'Developer';
            const nameRes = await new Input({
                message: 'Enter new user name:',
                initial: currentName
            }).run().catch(() => null);

            if (nameRes && nameRes.trim() !== currentName) {
                const ans = await new Select({
                    message: `Save user name as '${nameRes.trim()}'?`,
                    choices: [
                        menuChoice('save', '✓', 'Save changes'),
                        backChoice('reject')
                    ]
                }).run().catch(() => 'reject');
                if (ans === 'save') {
                    config.setUserName(nameRes.trim());
                    console.log(TerminalUI.formatSuccess(`User name updated to '${nameRes.trim()}'.`, config));
                    saved = true;
                }
            }
        } else if (choice === 'model') {
            await handleModelSelection(agent, config);
            continue;
        } else if (choice === 'language') {
            const langRes = await new Input({ message: 'Default language:' }).run().catch(() => null);
            if (langRes) {
                const ans = await new Select({
                    message: `Set default language to '${langRes.trim()}'?`,
                    choices: [
                        menuChoice('save', '✓', 'Save language preference'),
                        backChoice('reject')
                    ]
                }).run().catch(() => 'reject');
                if (ans === 'save') {
                    config.setLanguage(langRes.trim());
                    console.log(TerminalUI.formatSuccess('Language preference updated.', config));
                    saved = true;
                }
            }
        } else if (choice === 'key') {
            await handleApiKeySettings(config, agent);
            continue;
        } else if (choice === 'theme') {
            await TerminalUI.previewThemes(config);
            continue;
        } else if (choice === 'logo') {
            await TerminalUI.previewLogos(config);
            continue;
        } else if (choice === 'reset') {
            const mode = await new Select({
                message: 'Reset Lorapok AI to factory defaults?',
                choices: [
                    menuChoice('soft', '🔄', 'Soft reset — theme/prefs (keep vault keys)'),
                    menuChoice('hard', '⚠', 'Hard reset — clear prefs, history, and vault keys'),
                    backChoice('cancel')
                ]
            }).run().catch(() => 'cancel');
            if (mode === 'cancel') continue;
            const confirm = await new Select({
                message: mode === 'hard'
                    ? 'Confirm HARD reset? Clears preferences, history, and encrypted secrets.'
                    : 'Confirm soft reset? Theme returns to Lorapok; vault keys kept.',
                choices: [
                    menuChoice('yes', '✓', 'Yes, reset now'),
                    backChoice('no')
                ]
            }).run().catch(() => 'no');
            if (confirm !== 'yes') continue;
            const modelCacheSvc = require('../services/ModelCacheService');
            const modelAccessSvc = require('../services/ModelAccessService');
            modelCacheSvc.clearFailedModels();
            modelAccessSvc.clearCache();
            const result = config.resetToDefaults({ hard: mode === 'hard' });
            console.log(TerminalUI.formatSuccess(`Lorapok AI reset complete (theme: ${result.theme}).`, config));
            const pkg = require('../package.json');
            TerminalUI.showHeader(pkg.version, config.getModel() || '', process.cwd(), config);
            saved = true;
        }

        if (saved) {
            console.log(TerminalUI.formatSuccess('Settings updated.', config));
        }
    }
}

/**
 * Display formatted system diagnostic logs table.
 * @returns {Promise<{ success: boolean, error?: string }>} Execution status
 */
async function showLogs(config = null) {
    const { getTheme, getDefaultThemeId } = require('../lib/theme');
    const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
    const logPath = path.join(os.homedir(), '.lorapok', 'logs', 'combined.log');
    const cols = process.stdout.columns || 100;
    const msgW = Math.max(40, Math.min(80, cols - 28));

    console.log(theme.box(theme.color('info', 'System logs'), {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 1, bottom: 1 }
    }));

    try {
        if (!fs.existsSync(logPath)) {
            console.log(theme.warning('  No log file found yet.'));
        } else {
            const rawLogs = fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-30);
            const Table = require('cli-table3');
            const table = new Table({
                head: [theme.color('info', 'Time'), theme.color('info', 'Level'), theme.color('info', 'Message')],
                style: { head: [], border: [] },
                colWidths: [10, 8, msgW],
                wordWrap: true
            });

            rawLogs.forEach(line => {
                try {
                    const log = JSON.parse(line);
                    const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false });
                    const lvl = String(log.level || 'info').toUpperCase();
                    let levelBadge = theme.muted(` ${lvl.padEnd(5)} `);
                    if (lvl === 'ERROR') levelBadge = theme.error(` ${lvl.padEnd(5)} `);
                    else if (lvl === 'WARN') levelBadge = theme.warning(` ${lvl.padEnd(5)} `);
                    else if (lvl === 'INFO') levelBadge = theme.color('info', ` ${lvl.padEnd(5)} `);
                    table.push([theme.muted(time), levelBadge, theme.color('text', String(log.message || ''))]);
                } catch (e) {
                    if (line.trim()) table.push(['—', theme.muted(' RAW '), theme.muted(line.trim())]);
                }
            });
            console.log(table.toString());
        }
    } catch (e) {
        console.log(TerminalUI.formatError(`Could not read logs: ${e.message}`, config));
        return { success: false, error: e.message };
    }
    console.log('');
    await new Select({
        message: 'Logs',
        choices: [backChoice()]
    }).run().catch(() => 'back');
    return { success: true };
}

/**
 * Browse persisted SESSION RECAP files under ~/.lorapok/sessions.
 */
async function showSessionInfo(config = null) {
    const { SessionStore } = require('../services/SessionStore');
    const { getTheme, getDefaultThemeId } = require('../lib/theme');
    const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
    const store = new SessionStore(config && config.configDir);

    while (true) {
        const rows = store.list(20);
        if (rows.length === 0) {
            console.log(theme.box(theme.muted('No saved sessions yet. Exit a chat (/q) to save a recap.'), {
                padding: { top: 0, bottom: 0, left: 1, right: 1 },
                margin: { top: 1, bottom: 1 }
            }));
            await new Select({
                message: 'Session info',
                choices: [backChoice()]
            }).run().catch(() => 'back');
            return { success: true };
        }

        const choice = await new Select({
            message: 'Session info',
            choices: [
                ...rows.map(r => ({
                    name: r.id,
                    message: `  ${r.id}  ·  ${r.savedAt ? r.savedAt.slice(0, 19).replace('T', ' ') : '—'}  ·  ${r.count || 0} turns`
                })),
                backChoice()
            ]
        }).run().catch(() => 'back');

        if (choice === 'back') return { success: true };
        const data = store.load(choice);
        if (data) {
            TerminalUI.showInteractionSummary(data, { themeId: theme.id, viewOnly: true });
            await new Select({
                message: 'Session recap',
                choices: [backChoice()]
            }).run().catch(() => 'back');
        }
    }
}

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
        let providerLabel = chalk.gray(meta?.provider || 'unknown');
        if (meta?.provider === 'openrouter') providerLabel = chalk.cyan('OpenRouter API');
        else if (meta?.provider === 'perplexity') providerLabel = chalk.magenta('Perplexity API');
        else if (meta?.provider === 'google-ai-studio') providerLabel = chalk.green('Google AI Studio');
        else if (agent?.modelManager) {
            const p = agent.modelManager.getProviderForModel(activeModelId);
            if (p === 'google-ai-studio') providerLabel = chalk.green('Google AI Studio');
            else if (p === 'openrouter') providerLabel = chalk.cyan('OpenRouter API');
            else providerLabel = chalk.magenta('Perplexity API');
        }
        console.log(`  Provider:        ${providerLabel}`);
        const displayCat = meta?.category ? (Array.isArray(meta.category) ? meta.category.map(c => c.toUpperCase()).join(', ') : meta.category.toUpperCase()) : 'General';
        console.log(`  Category:        ${displayCat}`);
        console.log(`  Context Window:  ${meta?.contextLength ? `${(meta.contextLength / 1000).toFixed(0)}k tokens` : 'N/A'}`);
        if (meta?.rateLimit) console.log(`  Rate Limit:      ${meta.rateLimit}`);
        if (meta?.resetWindow) console.log(`  Reset Window:    ${meta.resetWindow}`);
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

        const usableIds = agent.modelManager.getUsableModelIds(models);
        console.log(chalk.cyan.bold(`\n🧠 CURRENTLY USABLE MODELS (${usableIds.length})\n`));
        const categories = agent.modelManager.getChatCategoryIds();
        const Table = require('cli-table3');

        categories.forEach(cat => {
            const catModels = agent.modelManager.getModelsByCategoryView(models, cat);
            if (catModels.length === 0) return;

            const table = new Table({
                head: [chalk.cyan('Model ID'), chalk.cyan('Provider'), chalk.cyan('Context'), chalk.cyan('Status')],
                style: { head: [], border: ['gray'] }
            });

            catModels.slice(0, 12).forEach(id => {
                const item = models[id];
                const status = chalk.green('🟢 Ready');
                let provider = chalk.gray(item.provider || '');
                if (item.provider === 'openrouter') provider = chalk.cyan('OpenRouter');
                else if (item.provider === 'perplexity') provider = chalk.magenta('Perplexity');
                else if (item.provider === 'google-ai-studio') provider = chalk.green('Google');
                const ctx = item.contextLength ? `${(item.contextLength / 1000).toFixed(0)}k` : 'N/A';
                table.push([chalk.bold(item.name || id), provider, ctx, status]);
            });

            console.log(chalk.yellow.bold(`📁 Category: ${cat.toUpperCase()} (${catModels.length} models)`));
            console.log(table.toString() + '\n');
        });
        return { success: true };
    }

    const nextModel = (cleanSub === 'set' && targetModel) ? targetModel : sub;
    const modelId = String(nextModel).trim();
    try {
        const models = await agent.checkAvailableModels();
        if (!agent.modelManager.canSelectModel(modelId, models)) {
            console.log(chalk.red(`\n❌ Cannot select '${modelId}' — not accessible with your keys or not a usable chat model.`));
            console.log(chalk.gray('   Use /model for the interactive picker, or /refresh-models to refresh the catalog.\n'));
            return { success: false, error: 'Model not accessible' };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
    config.setModel(modelId);
    console.log(ui.formatSuccess(`Active model changed to ${modelId}`));
    return { success: true, model: modelId };
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
    const { getTheme, getDefaultThemeId } = require('../lib/theme');
    const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
    if (!key) {
        const body = [
            theme.color('info', 'Config summary'),
            '',
            theme.muted('Model') + '     ' + theme.color('text', config.getModel() || '—'),
            theme.muted('Language') + '  ' + theme.color('text', config.getLanguage() || '—'),
            theme.muted('User') + '      ' + theme.color('text', config.getUserName() || '—'),
            theme.muted('Theme') + '     ' + theme.color('text', config.getBrandingFont() || '—'),
            theme.muted('Logo') + '      ' + theme.color('text', (config.getLogoStyle && config.getLogoStyle()) || 'cyber')
        ].join('\n');
        console.log(theme.box(body, {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            margin: { top: 1, bottom: 1 }
        }));
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
    if (cleanKey === 'model') {
        const { agent } = context;
        if (agent && typeof agent.checkAvailableModels === 'function') {
            try {
                const models = await agent.checkAvailableModels();
                if (!agent.modelManager.canSelectModel(cleanVal, models)) {
                    console.log(ui.formatError
                        ? ui.formatError(`Cannot set model '${cleanVal}' — not accessible.`)
                        : chalk.red(`Cannot set model '${cleanVal}' — not accessible.`));
                    return { success: false, error: 'Model not accessible' };
                }
            } catch (e) {
                return { success: false, error: e.message };
            }
        }
        config.setModel(cleanVal);
    } else if (cleanKey === 'language') config.setLanguage(cleanVal);
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
            menuChoice('toggle', stats.enabled ? '⏸' : '▶', stats.enabled ? 'Disable Response Caching' : 'Enable Response Caching'),
            menuChoice('clear', '🗑', 'Clear All Cached Responses'),
            backChoice()
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
    showSessionInfo,
    handleModelCommand,
    handleConfigCommand,
    handleCacheCommand,
    saveAndVerifyApiKey
};

