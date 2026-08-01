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
                        const abs = path.join(agent.projectRoot, fPath);
                        try {
                            const st = fs.statSync(abs);
                            if (st.size > 512 * 1024) {
                                console.log(chalk.yellow(`\n⚠️  Skipping large file '${fPath}' (${Math.round(st.size / 1024)}KB).`));
                                continue;
                            }
                        } catch (_) { /* ignore */ }
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
                if (!exists) {
                    console.log(chalk.yellow(`\n⚠️  @mention path not found: '${targetPath}'`));
                    console.log(chalk.gray('   Tip: type @ alone for the file picker, or use a path relative to the workspace.\n'));
                    continue;
                }
                try {
                    const st = fs.statSync(absolutePath);
                    if (st.size > 1024 * 1024) {
                        console.log(chalk.yellow(`\n⚠️  Skipping large file '${targetPath}' (${Math.round(st.size / 1024)}KB > 1MB).`));
                        continue;
                    }
                } catch (_) { /* ignore */ }
                const readRes = agent.fileManager.readFile(targetPath);
                if (readRes.success) {
                    processedInput = processedInput.replace(
                        match,
                        `\n--- File: ${targetPath} ---\n${readRes.data}\n---\n`
                    );
                    filesFound.push(targetPath);
                } else {
                    console.log(chalk.yellow(`\n⚠️  Warning: Could not read '${targetPath}': ${readRes.error || 'unknown error'}`));
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
 * Helper to render structured model name and token usage footer card after AI responses.
 */
function renderTokenUsageBox(context, response, activeModelIdOverride) {
    const { agent, config, sessionData } = context;
    const { getTheme, getDefaultThemeId } = require('../lib/theme');
    const { ActiveModelService } = require('../services/ActiveModelService');
    const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());

    const activeModelId = response?.model || activeModelIdOverride || (config && typeof config.getModel === 'function' ? config.getModel() : 'sonar');
    const allModels = agent && agent.modelManager ? agent.modelManager.cache.get('allModels') : null;
    const activeModelMeta = (agent && typeof agent.getModelMetadata === 'function' ? agent.getModelMetadata(activeModelId) : null) || (allModels ? allModels[activeModelId] : null);
    const displayNameFallback = activeModelMeta?.name || activeModelId;

    let promptTokens = response?.usage?.prompt_tokens || 0;
    let completionTokens = response?.usage?.completion_tokens || 0;
    let totalTokens = response?.usage?.total_tokens || 0;

    if (!totalTokens && response?.content) {
        promptTokens = Math.max(10, Math.ceil(response.content.length / 4));
        completionTokens = Math.max(5, Math.ceil(response.content.length / 8));
        totalTokens = promptTokens + completionTokens;
    }

    if (sessionData) {
        if (!sessionData.tokens) sessionData.tokens = { prompt: 0, completion: 0, total: 0 };
        sessionData.tokens.prompt += promptTokens;
        sessionData.tokens.completion += completionTokens;
        sessionData.tokens.total += totalTokens;

        if (!sessionData.modelUsage) sessionData.modelUsage = {};
        if (!sessionData.modelUsage[activeModelId]) {
            sessionData.modelUsage[activeModelId] = { name: displayNameFallback, prompt: 0, completion: 0, total: 0, requests: 0 };
        }
        sessionData.modelUsage[activeModelId].prompt += promptTokens;
        sessionData.modelUsage[activeModelId].completion += completionTokens;
        sessionData.modelUsage[activeModelId].total += totalTokens;
        sessionData.modelUsage[activeModelId].requests += 1;
    }

    const status = agent && agent.modelManager
        ? new ActiveModelService(agent.modelManager).getStatus(
            { getModel: () => activeModelId },
            { [activeModelId]: { ...(activeModelMeta || {}), id: activeModelId } },
            sessionData
        )
        : null;
    const budget = status?.contextBudget;
    const remStr = budget && budget.remaining >= 1000000
        ? `${(budget.remaining / 1000000).toFixed(2)}M`
        : `${Math.round((budget?.remaining || 0) / 1000)}k`;
    const maxCtxStr = budget && budget.maxCtx >= 1000000
        ? `${(budget.maxCtx / 1000000).toFixed(1)}M`
        : `${Math.round((budget?.maxCtx || 0) / 1000)}k`;

    // Compact turn metrics (no duplicate model/% — those live on the prompt status bar)
    const sessionTurns = sessionData?.count || 1;
    const sessionTotal = sessionData?.tokens?.total || totalTokens;
    const cached = Boolean(response?.cached);
    const latencyMs = response?.latencyMs || response?.durationMs || null;
    const latencyStr = latencyMs != null ? `${(latencyMs / 1000).toFixed(1)}s` : null;

    console.log(theme.rule());
    console.log('  ' + theme.sepJoin([
        { text: `${promptTokens} in`, color: 'muted' },
        { text: `${completionTokens} out`, color: 'muted' },
        { text: `${totalTokens} tok`, color: 'muted' },
        { text: `sess ${sessionTurns}`, color: 'muted' },
        { text: `${Number(sessionTotal).toLocaleString()} life`, color: 'muted' },
        { text: cached ? 'cache hit' : 'cache miss', color: 'muted' },
        latencyStr ? { text: latencyStr, color: 'muted' } : null,
        { text: `${remStr}/${maxCtxStr} left`, color: 'muted' }
    ]));
}

/**
 * Handle primary LLM chat interaction, token usage tracking, and action block execution.
 * @param {string} input - Input message string
 * @param {Object} context - CommandContext containing { agent, config, sessionData, ui, orchestrator, modeRouter, sessionManager }
 * @param {Object} [options={}] - Execution options (e.g. AbortSignal)
 * @returns {Promise<{ success: boolean, content?: string, usage?: Object, error?: string }>} Execution result
 */
async function handleChat(input, context, options = {}) {
    const { agent, config, sessionData, ui, orchestrator, modeRouter, sessionManager } = context;

    if (!input || !input.trim()) {
        return { success: true, content: '' };
    }

    try {
        sessionData.count++;
        const { processedInput } = handleFileMentions(input, agent);
        const projectInfo = getProjectOverviewContext(agent);

        // Route the mode using ModeRouter
        const currentMode = context.currentMode || 'chat';
        let targetMode = currentMode;
        if (modeRouter) {
            const routeResult = modeRouter.route(processedInput, currentMode);
            targetMode = routeResult.mode;
        }

        // Add message to new SessionManager
        if (sessionManager) {
            const { UnifiedMessage } = require('../lib/core/UnifiedMessage');
            sessionManager.addMessage(UnifiedMessage.userText(processedInput));
        }

        const startedAt = Date.now();
        
        // Dispatch the turn. We pass targetMode in options to potentially guide provider selection later
        const response = await withCancellation('Thinking...', (signal) =>
            agent.chat(processedInput, null, { signal, fileTree: projectInfo, mode: targetMode, ...options })
        );

        if (!response || response.aborted) {
            return { success: false, error: 'Request cancelled by user.' };
        }
        response.latencyMs = Date.now() - startedAt;

        // Log assistant message to SessionManager
        if (sessionManager) {
            const { UnifiedMessage } = require('../lib/core/UnifiedMessage');
            sessionManager.addMessage(UnifiedMessage.assistantText(response.content));
        }

        let cleanContent = ui.hideLongCodeBlocks(response.content);
        
        // Extract suggested follow-up questions
        let suggestedQuestions = [];
        const suggestionsMatch = cleanContent.match(/<suggestions>([\s\S]*?)<\/suggestions>/i);
        if (suggestionsMatch) {
            const sqBlock = suggestionsMatch[1];
            const sqRegex = /<sq>(.*?)<\/sq>/gi;
            let match;
            while ((match = sqRegex.exec(sqBlock)) !== null) {
                if (match[1].trim()) suggestedQuestions.push(match[1].trim());
            }
            // Remove the suggestions block from the rendered output
            cleanContent = cleanContent.replace(/<suggestions>[\s\S]*?<\/suggestions>/i, '').trim();
        }

        const rendered = await renderMarkdown(cleanContent);
        if (ui && typeof ui.printAgentResponse === 'function') {
            ui.printAgentResponse(rendered, config);
        } else {
            console.log(rendered);
        }

        renderTokenUsageBox(context, response);

        // Parse & execute file/shell action blocks
        const actions = agent.parseActions(response.content);
        let executedActions = [];
        if (actions.length > 0) {
            // Future step: orchestrator.processToolCalls(actions)
            const executeRes = await executeFileActions(actions, context);
            if (executeRes && executeRes.executedActions) executedActions = executeRes.executedActions;
            
            const hasFileEdits = actions.some(a => a.type !== 'COMMAND');
            if (hasFileEdits) {
                await promptSmartCommit(context);
            }
        }

        return { success: true, content: response.content, usage: response.usage, suggestedQuestions, executedActions };
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
    const { agent, config, ui } = context;
    const { getTheme, getDefaultThemeId } = require('../lib/theme');
    const { ActiveModelService } = require('../services/ActiveModelService');
    const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());

    try {
        const result = await withCancellation('Analyzing project structure & architecture...', (signal) =>
            agent.analyzeProject({ signal })
        );

        if (result && result.content) {
            const activeModelId = result.model || (config && typeof config.getModel === 'function' ? config.getModel() : 'gemini-flash-latest');
            const allModels = agent && agent.modelManager ? agent.modelManager.cache.get('allModels') : null;
            const activeModelMeta = (agent && typeof agent.getModelMetadata === 'function' ? agent.getModelMetadata(activeModelId) : null) || (allModels ? allModels[activeModelId] : null);
            const status = agent && agent.modelManager
                ? new ActiveModelService(agent.modelManager).getStatus(
                    { getModel: () => activeModelId },
                    { [activeModelId]: { ...(activeModelMeta || {}), id: activeModelId } }
                )
                : null;
            const displayName = status?.displayName || activeModelMeta?.name || activeModelId;
            const icon = status?.icon || '\u25C6';

            console.log(theme.panel(
                theme.muted('Active engine') + theme.muted('  ·  ') +
                theme.color('text', `${icon} ${displayName}`) +
                theme.muted('  ·  ') + theme.success('Analysis complete'),
                {
                    padding: { top: 0, bottom: 0, left: 2, right: 2 },
                    margin: { top: 1, bottom: 0 }
                }
            ));

            const renderedMarkdown = await renderMarkdown(result.content);
            if (ui && typeof ui.printAgentResponse === 'function') {
                ui.printAgentResponse(renderedMarkdown, config);
            } else {
                console.log(renderedMarkdown);
            }

            console.log(theme.panel(
                theme.color('info', 'Next steps') + '\n' +
                theme.muted('  ·  ') + theme.warning('/chat') + theme.muted('  discuss findings') + '\n' +
                theme.muted('  ·  ') + theme.warning('/plan') + theme.muted('  implementation roadmap') + '\n' +
                theme.muted('  ·  ') + theme.warning('/help') + theme.muted('  response & model color legend'),
                {
                    padding: { top: 0, bottom: 0, left: 1, right: 1 },
                    margin: { top: 1, bottom: 1 }
                }
            ));

            renderTokenUsageBox(context, result, activeModelId);

            return { success: true, content: result.content };
        }
        if (result && result.aborted) {
            console.log(theme.warning('\nAnalysis cancelled by user.\n'));
            return { success: false, error: 'Analysis cancelled.' };
        }
        console.log(ui && ui.formatError
            ? ui.formatError('Project analysis produced no output.', config)
            : theme.error('\nProject analysis produced no output.\n'));
        return { success: false, error: 'No content' };
    } catch (err) {
        console.log(ui && ui.formatError
            ? ui.formatError(`Project Analysis Error: ${err.message || String(err)}`, config)
            : theme.error(`\nProject Analysis Error: ${err.message || String(err)}\n`));
        return { success: false, error: err.message || String(err) };
    }
}

module.exports = {
    handleChat,
    handleFileMentions,
    handleAnalyze
};
