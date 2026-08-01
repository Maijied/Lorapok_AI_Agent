/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const boxen = require('boxen');
const path = require('path');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');
const ActionsManager = require('../services/ActionsManager');
const { executeCommand } = require('./utils');
const { menuChoice, backChoice, menuMessage } = require('../lib/menu-format');

/**
 * Interactive menu explorer for GitHub Actions workflows, runs, and jobs.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - Config manager instance
 * @returns {Promise<{ success: boolean, error?: string }>} Execution result
 */
async function showActionsMenu(agent, config) {
    const actionsManager = new ActionsManager(agent.gitManager);

    // Check Auth
    if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
        console.log(chalk.red('\n🚫 No GitHub Token found.'));

        const authSelect = new Select({
            message: 'Authentication required. How would you like to login?',
            choices: [
                menuChoice('browser', '🌐', 'Login via Browser (Recommended)'),
                menuChoice('token', '🔑', 'Enter Token Manually'),
                menuChoice('cancel', '❌', 'Cancel')
            ]
        });

        const authChoice = await authSelect.run().catch(() => 'cancel');

        if (authChoice === 'cancel') return { success: false, error: 'Cancelled' };

        if (authChoice === 'browser') {
            const GithubAuth = require('../services/GithubAuth');
            const ghAuth = new GithubAuth();
            const url = ghAuth.getSmartAuthUrl();
            await ghAuth.openBrowser(url);

            const msg = '1. Browser should open... or click: ' + chalk.underline.bold(url);
            console.log(boxen(chalk.cyan(`${msg}\n2. Scroll down and click "Generate token"\n3. Copy the token and paste it below.`), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

            const token = await new Input({ message: 'Paste Token:' }).run();
            if (token) {
                process.env.GH_TOKEN = token;
                config.setGitHubToken(token);
                agent.gitManager.configureTokenAuth(token);
            } else return { success: false, error: 'No token provided' };
        } else if (authChoice === 'token') {
            const token = await new Input({ message: 'GitHub Token:' }).run();
            if (token) {
                process.env.GH_TOKEN = token;
                config.setGitHubToken(token);
                agent.gitManager.configureTokenAuth(token);
            } else return { success: false, error: 'No token provided' };
        }
    }

    while (true) {
        console.clear();
        console.log(chalk.magenta.bold('\n⚡ GitHub Actions Explorer\n'));

        const spinner = TerminalUI.createSpinner('Fetching workflows...');
        spinner.start();
        const wfRes = await actionsManager.getWorkflows();
        spinner.stop();

        if (!wfRes.success) {
            console.log(TerminalUI.formatError(wfRes.error));

            if (wfRes.error && wfRes.error.includes('No GitHub remote found')) {
                console.log(chalk.gray('\n  💡 Local Git repository detected, but no GitHub remote URL is linked yet.'));
                console.log(chalk.gray('     GitHub Actions CI/CD requires a GitHub repository link (https://github.com/owner/repo).\n'));

                const gitUserRes = agent.gitManager.getUserConfig();
                const gitUser = gitUserRes.data || gitUserRes;
                const userName = gitUser.name && gitUser.name !== 'Not set' ? gitUser.name : (config.getUserName() || 'username');
                const folderName = path.basename(agent.projectRoot);
                const suggestedUrl = `https://github.com/${userName}/${folderName}.git`;

                const addOpt = new Select({
                    message: 'How would you like to link a GitHub remote?',
                    styles: { underline: str => str, em: chalk.cyan.bold },
                    pointer(choice, i) { return this.state.index === i ? chalk.cyan.bold('❯ ') : '  '; },
                    choices: [
                        menuChoice('suggested', '🔍', `Auto-link suggested: ${suggestedUrl}`),
                        menuChoice('custom', '🟢', 'Enter custom GitHub Repo URL'),
                        menuChoice('cancel', '❌', 'Return to Main Menu')
                    ],
                    result(name) { return this.map(name)[name]; }
                });

                const choice = await addOpt.run().catch(() => 'cancel');
                let targetUrl = '';

                if (choice === 'suggested') {
                    targetUrl = suggestedUrl;
                } else if (choice === 'custom') {
                    targetUrl = await new Input({ message: 'GitHub Repo URL:' }).run().catch(() => null);
                }

                if (targetUrl && targetUrl.trim()) {
                    const addRes = agent.gitManager.addRemote('origin', targetUrl.trim());
                    if (addRes.success) {
                        console.log(TerminalUI.formatSuccess(`Remote 'origin' linked to ${targetUrl.trim()}`));
                        continue;
                    } else {
                        console.log(TerminalUI.formatError(`Failed to add remote: ${addRes.error}`));
                    }
                }
            }

            await new Input({ message: 'Press Enter to return ⏎' }).run().catch(() => null);
            return { success: false, error: wfRes.error };
        }

        const workflows = wfRes.data?.workflows || wfRes.workflows || [];
        const total = wfRes.data?.total !== undefined ? wfRes.data.total : wfRes.total;

        if (total === 0 || workflows.length === 0) {
            console.log(chalk.yellow('\nNo workflows found in this repository.'));
            await new Input({ message: 'Press Enter to return' }).run();
            return { success: true };
        }

        const choices = workflows.map(w => ({
            name: w.id.toString(),
            message: `${chalk.bold(w.name)} ${chalk.gray('(' + w.path + ')')}`,
            value: w
        }));

        choices.push(menuChoice('exit', '❌', 'Exit'));

        const wfSelect = new Select({
            message: 'Select Workflow:',
            choices: choices,
            result(name) { return this.map(name)[name]; }
        });

        const selectedWf = await wfSelect.run().catch(() => 'exit');
        if (selectedWf === 'exit' || !selectedWf.id) break;

        // Fetch Runs
        const runSpinner = TerminalUI.createSpinner(`Fetching runs for ${selectedWf.name}...`);
        runSpinner.start();
        const runsRes = await actionsManager.getWorkflowRuns(selectedWf.id);
        runSpinner.stop();

        if (!runsRes.success) {
            console.log(TerminalUI.formatError(runsRes.error));
            await new Input({ message: 'Press Enter manually' }).run();
            continue;
        }

        const runs = runsRes.data || runsRes.runs || [];
        TerminalUI.showWorkflowRuns(runs);

        const runChoices = runs.slice(0, 5).map(r => ({
            name: r.id.toString(),
            message: menuMessage(
                r.status === 'completed' ? (r.conclusion === 'success' ? '✔' : '✖') : '⏳',
                `${r.name} #${r.run_number} (${r.event})`
            ),
            value: r
        }));
        runChoices.push(menuChoice('back', '←', 'Back to Workflows'));

        const runSelect = new Select({
            message: 'Select Run to view details:',
            choices: runChoices,
            result(name) { return this.map(name)[name]; }
        });

        const selectedRun = await runSelect.run().catch(() => 'back');
        if (selectedRun === 'back' || !selectedRun.id) continue;

        // Fetch Jobs
        const jobSpinner = TerminalUI.createSpinner('Fetching job logs...');
        jobSpinner.start();
        const jobsRes = await actionsManager.getRunJobs(selectedRun.id);
        jobSpinner.stop();

        if (jobsRes.success) {
            const jobs = jobsRes.data || jobsRes.jobs || [];
            TerminalUI.showRunDetails(selectedRun, jobs);

            const afterRunSelect = new Select({
                message: 'Actions:',
                choices: [
                    menuChoice('continue', '←', 'Back to Runs'),
                    menuChoice('rerun', '🔄', 'Rerun this workflow')
                ]
            });

            const afterAction = await afterRunSelect.run().catch(() => 'continue');
            if (afterAction === 'rerun') {
                const rerunSpinner = TerminalUI.createSpinner('Requesting rerun...');
                rerunSpinner.start();
                const rerunRes = await actionsManager.rerunWorkflowRun(selectedRun.id);
                rerunSpinner.stop();

                if (rerunRes.success) {
                    console.log(TerminalUI.formatSuccess('Workflow rerun requested!'));
                } else {
                    console.log(TerminalUI.formatError(rerunRes.error));
                }
                await new Input({ message: 'Press Enter to continue' }).run();
            }
        } else {
            console.log(TerminalUI.formatError(jobsRes.error));
            await new Input({ message: 'Press Enter to continue' }).run();
        }
    }
    return { success: true };
}

const allowedCommands = new Set();

/**
 * Execute a list of proposed file mutation actions and shell commands sequentially.
 * @param {Array<Object>} actions - Parsed action block objects from AI response
 * @param {Object} context - CommandContext containing { agent, config, ui }
 * @returns {Promise<{ success: boolean, appliedCount: number, error?: string }>} Execution result summary
 */
async function executeFileActions(actions, context) {
    const { agent, config, ui } = context;
    let appliedCount = 0;

    if (!actions || actions.length === 0) {
        return { success: true, appliedCount: 0 };
    }

    let bypassMode = config && typeof config.getAutoApprove === 'function' ? config.getAutoApprove() : false;

    console.log(chalk.cyan.bold(`📝 AGENT PROPOSES ${actions.length} ACTIONS` + (bypassMode ? chalk.green(' [BYPASS MODE ACTIVE]') : '')));

    for (const action of actions) {
        if (action.type === 'COMMAND') {
            const cmdRes = await executeShellAction(action, context, bypassMode);
            if (cmdRes.bypassAll) bypassMode = true;
            if (cmdRes.aborted) break;
            if (cmdRes.success) appliedCount++;
        } else {
            let current = '';
            const readRes = agent.fileManager.readFile(action.filePath);
            if (readRes.success) current = readRes.data;

            ui.showDiff(action.filePath, current, action.content);

            let choice = 'once';
            if (!bypassMode && !allowedCommands.has('FILE_EDITS')) {
                const confirm = new Select({
                    message: `Allow ${action.type} to ${action.filePath}?`,
                    choices: [
                        menuChoice('once', '🟢', 'Yes, allow this time'),
                        menuChoice('project', '📁', 'Yes, and always allow file edits in this project'),
                        menuChoice('bypass', '🚀', 'Yes, and always allow globally (Bypass Mode)'),
                        menuChoice('no', '❌', 'No (tell the agent what to do instead)')
                    ],
                    result(name) { return this.map(name)[name]; }
                });

                const selected = await confirm.run().catch(() => 'no');
                
                if (selected === 'project') {
                    allowedCommands.add('FILE_EDITS');
                    console.log(chalk.green('\n✔ Added file edits to allowed actions for this project.'));
                    choice = 'once';
                } else if (selected === 'bypass') {
                    bypassMode = true;
                    if (config && typeof config.setAutoApprove === 'function') config.setAutoApprove(true);
                    choice = 'once';
                } else if (selected === 'once') {
                    choice = 'once';
                } else {
                    choice = 'no';
                }
            } else {
                console.log(chalk.green(`🚀 Auto-applying ${action.type} to ${action.filePath}...`));
            }

            if (choice === 'no') break;

            ui.showEditStatus(action.type, action.filePath);
            if (action.type === 'DELETE') {
                agent.fileManager.deleteFile(action.filePath);
            } else {
                agent.fileManager.writeFile(action.filePath, action.content);
            }
            console.log(ui.formatSuccess(`${action.type} applied.`));
            appliedCount++;
        }
    }

    return { success: true, appliedCount };
}

/**
 * Prompt user and execute a single shell command action.
 * @param {Object} action - Action block object containing description and content (command)
 * @param {Object} context - CommandContext containing { ui, config }
 * @param {boolean} [bypassMode=false] - Whether auto-approve mode is active
 * @returns {Promise<{ success: boolean, aborted?: boolean, bypassAll?: boolean, error?: string }>} Execution result
 */
async function executeShellAction(action, context, bypassMode = false) {
    const { ui, config } = context;
    const commandText = (action.content && action.content.trim()) ? action.content.trim() : (action.description || '').trim();
    const displayDescription = action.description && action.description !== commandText ? action.description : `Execute command: ${commandText}`;

    ui.showCommand(displayDescription, commandText);

    const cmdKey = commandText.trim().split(/\s+/)[0];
    let choice = 'once';
    let bypassAll = false;

    if (!bypassMode && !allowedCommands.has(cmdKey) && !allowedCommands.has(commandText)) {
        const confirm = new Select({
            message: `Allow command: ${commandText}?`,
            choices: [
                menuChoice('once', '🟢', 'Yes, allow this time'),
                menuChoice('project', '📁', `Yes, and always allow '${cmdKey}' in this project`),
                menuChoice('bypass', '🚀', 'Yes, and always allow globally (Bypass Mode)'),
                menuChoice('no', '❌', 'No (tell the agent what to do instead)')
            ],
            result(name) { return this.map(name)[name]; }
        });

        const selected = await confirm.run().catch(() => 'no');

        if (selected === 'project') {
            allowedCommands.add(cmdKey);
            allowedCommands.add(commandText);
            console.log(chalk.green(`\n✔ Added '${cmdKey}' to allowed commands for this project.`));
            choice = 'once';
        } else if (selected === 'bypass') {
            bypassAll = true;
            if (config && typeof config.setAutoApprove === 'function') config.setAutoApprove(true);
            choice = 'once';
        } else if (selected === 'once') {
            choice = 'once';
        } else {
            choice = 'no';
        }
    } else {
        console.log(chalk.green(`🚀 Auto-executing command...`));
    }

    if (choice === 'no') return { success: false, aborted: true };

    const result = executeCommand(commandText);
    if (result.success) {
        console.log(ui.formatSuccess(`Command executed.`));
        return { success: true, bypassAll };
    } else {
        console.log(ui.formatError(`Command failed.`));
        return { success: false, error: result.error, bypassAll };
    }
}


module.exports = {
    showActionsMenu,
    executeFileActions,
    executeShellAction
};
