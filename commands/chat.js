/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const { renderMarkdown } = require('../lib/renderer');
const { withCancellation, handleError } = require('./utils');
const { executeFileActions } = require('./actions');
const { promptSmartCommit } = require('./git');

/**
 * Parse and interpolate @file mentions in user input text.
 * @param {string} input - User input string containing @file syntax
 * @param {Object} agent - Lorapok agent instance containing fileManager
 * @returns {{ processedInput: string, filesFound: string[] }} Result object with interpolated prompt
 */
function handleFileMentions(input, agent) {
    const fs = require('fs');
    const path = require('path');
    const mentionRegex = /(?<=^|\s)@(\S+)/g;
    const fileMatches = input.match(mentionRegex);
    let processedInput = input;
    const filesFound = [];

    if (fileMatches) {
        for (const match of fileMatches) {
            const targetPath = match.substring(1);
            const absolutePath = path.join(agent.projectRoot, targetPath);
            const exists = fs.existsSync(absolutePath);

            if (exists && fs.statSync(absolutePath).isDirectory()) {
                const dirFilesRes = agent.fileManager.listFiles(targetPath, { recursive: true });
                const dirFiles = dirFilesRes.success ? dirFilesRes.data : [];
                let aggregatedContent = '';

                for (const f of dirFiles) {
                    const fPath = typeof f === 'string' ? f : f.path;
                    if (fPath && (typeof f === 'string' || f.type !== 'directory')) {
                        const readRes = agent.fileManager.readFile(fPath);
                        if (readRes.success && readRes.data) {
                            aggregatedContent += `\n--- File: ${fPath} ---\n${readRes.data}\n`;
                            filesFound.push(fPath);
                        }
                    }
                }

                if (aggregatedContent) {
                    processedInput = processedInput.replace(
                        match,
                        `\n--- Folder Context: ${targetPath} ---\n${aggregatedContent}\n---\n`
                    );
                }
            } else {
                const readRes = agent.fileManager.readFile(targetPath);
                if (readRes.success) {
                    processedInput = processedInput.replace(
                        match,
                        `\n--- File: ${targetPath} ---\n${readRes.data}\n---\n`
                    );
                    filesFound.push(targetPath);
                } else {
                    console.log(chalk.yellow(`\n⚠️  Warning: File or folder '${targetPath}' not found.`));
                }
            }
        }
    }

    return { processedInput, filesFound };
}

/**
 * Build rich project awareness context metadata.
 * @param {Object} agent - Lorapok agent instance
 * @returns {string} Formatted project metadata string
 */
function getProjectOverviewContext(agent) {
    const fs = require('fs');
    const path = require('path');
    const projectRoot = agent.projectRoot || process.cwd();
    const folderName = path.basename(projectRoot);
    let pkgDetails = '';

    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pkgDetails = `Package Name: ${pkg.name || 'unnamed'}, Version: ${pkg.version || '1.0.0'}, Description: ${pkg.description || 'N/A'}\nDependencies: ${Object.keys(pkg.dependencies || {}).join(', ') || 'none'}\nDevDependencies: ${Object.keys(pkg.devDependencies || {}).join(', ') || 'none'}`;
        } catch {}
    }

    const treeStr = agent.showFileTree ? agent.showFileTree() : '';

    return `Working Directory: ${projectRoot}\nFolder Name: ${folderName}\n${pkgDetails ? pkgDetails + '\n' : ''}Project File Hierarchy:\n${treeStr.substring(0, 1500)}`;
}

/**
 * Handle primary LLM chat interaction, token usage tracking, and action block execution.
 * @param {string} input - Input message string
 * @param {Object} context - CommandContext containing { agent, config, sessionData, ui }
 * @param {Object} [options={}] - Execution options (e.g. AbortSignal)
 * @returns {Promise<{ success: boolean, content?: string, usage?: Object, error?: string }>} Execution result
 */
async function handleChat(input, context, options = {}) {
    const { agent, config, sessionData, ui } = context;

    if (!input || !input.trim()) {
        return { success: true, content: '' };
    }

    try {
        sessionData.count++;
        const { processedInput } = handleFileMentions(input, agent);
        const projectInfo = getProjectOverviewContext(agent);

        const response = await withCancellation('Thinking...', (signal) =>
            agent.chat(processedInput, null, { signal, fileTree: projectInfo, ...options })
        );

        if (!response || response.aborted) {
            return { success: false, error: 'Request cancelled by user.' };
        }

        // Active model metadata & token calculation
        const activeModelId = config.getModel();
        const allModels = agent.modelManager ? agent.modelManager.cache.get('allModels') : null;
        const activeModelMeta = allModels ? allModels[activeModelId] : null;
        const icon = activeModelMeta?.icon || (agent.modelManager ? agent.modelManager.getModelIcon(activeModelId) : '🧠');
        const displayName = activeModelMeta?.name || `${icon} ${activeModelId}`;

        let promptTokens = response.usage?.prompt_tokens || 0;
        let completionTokens = response.usage?.completion_tokens || 0;
        let totalTokens = response.usage?.total_tokens || 0;

        if (!totalTokens && response.content) {
            promptTokens = Math.max(10, Math.ceil((processedInput.length + projectInfo.length) / 4));
            completionTokens = Math.max(5, Math.ceil(response.content.length / 4));
            totalTokens = promptTokens + completionTokens;
        }

        // Aggregate token stats per model and session
        if (sessionData) {
            if (!sessionData.tokens) {
                sessionData.tokens = { prompt: 0, completion: 0, total: 0 };
            }
            sessionData.tokens.prompt += promptTokens;
            sessionData.tokens.completion += completionTokens;
            sessionData.tokens.total += totalTokens;

            if (!sessionData.modelUsage) {
                sessionData.modelUsage = {};
            }
            if (!sessionData.modelUsage[activeModelId]) {
                sessionData.modelUsage[activeModelId] = {
                    name: displayName,
                    prompt: 0,
                    completion: 0,
                    total: 0,
                    requests: 0
                };
            }
            sessionData.modelUsage[activeModelId].prompt += promptTokens;
            sessionData.modelUsage[activeModelId].completion += completionTokens;
            sessionData.modelUsage[activeModelId].total += totalTokens;
            sessionData.modelUsage[activeModelId].requests += 1;
        }

        console.log(chalk.cyan.bold('\n🐛 LORAPOK:'));

        const cleanContent = ui.hideLongCodeBlocks(response.content);
        console.log(await renderMarkdown(cleanContent));

        // Render dynamic token consumption footer bar
        const termWidth = process.stdout.columns || 80;
        const cacheTag = response.cached ? chalk.green.bold(' [⚡ CACHED] ') : '';
        const contextLenStr = activeModelMeta?.contextLength ? ` | Context: ${(activeModelMeta.contextLength / 1000).toFixed(0)}k` : '';
        const modelTotalStr = sessionData.modelUsage?.[activeModelId]?.total ? sessionData.modelUsage[activeModelId].total.toLocaleString() : totalTokens.toLocaleString();

        const boxen = require('boxen');
        const tokenBar = chalk.cyan(`📊 Tokens: ${promptTokens} In | ${completionTokens} Out | ${totalTokens} Total`) + chalk.gray(`  (Model Session Total: ${modelTotalStr}${contextLenStr})`);
        const modelLabel = chalk.bold(`🧠 Active Model: ${displayName} ${cacheTag}`);

        const usageBox = boxen(`${modelLabel}\n${tokenBar}`, {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            margin: { top: 1, bottom: 1 },
            borderStyle: 'round',
            borderColor: 'cyan'
        });

        console.log(usageBox);



        // Parse & execute file/shell action blocks
        const actions = agent.parseActions(response.content);
        if (actions.length > 0) {
            await executeFileActions(actions, context);
            await promptSmartCommit(context);
        }

        return { success: true, content: response.content, usage: response.usage };
    } catch (err) {
        if (sessionData && typeof sessionData.successRate === 'number') {
            sessionData.successRate = Math.max(0, sessionData.successRate - 5);
        }
        await handleError(err, agent, config);
        return { success: false, error: err.message || String(err) };
    }
}

/**
 * Handle project repository analysis command (`/analyze`).
 * @param {Object} context - CommandContext containing { agent, ui }
 * @returns {Promise<{ success: boolean, content?: string, error?: string }>} Analysis result
 */
async function handleAnalyze(context) {
    const { agent } = context;
    try {
        const result = await withCancellation('Analyzing project...', (signal) =>
            agent.analyzeProject({ signal })
        );

        if (result && !result.aborted) {
            console.log(await renderMarkdown(result.content));
            return { success: true, content: result.content };
        }
        return { success: false, error: 'Analysis cancelled.' };
    } catch (err) {
        return { success: false, error: err.message || String(err) };
    }
}

module.exports = {
    handleChat,
    handleFileMentions,
    handleAnalyze
};
