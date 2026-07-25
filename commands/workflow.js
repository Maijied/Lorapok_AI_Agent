/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');
const { executeCommand, withCancellation, handleError } = require('./utils');

/**
 * Execute end-to-end Pro Planning, Task generation, Code generation, and Walkthrough workflow.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - Config manager instance
 * @param {string} objective - Goal objective text
 * @returns {Promise<void>}
 */
async function runProWorkflow(agent, config, objective) {
    try {
        let bypassMode = config ? config.getAutoApprove() : false;

        const planRes = await withCancellation('Planning...', (signal) =>
            agent.plan(objective, { signal })
        );
        if (!planRes || planRes.aborted) return;

        await TerminalUI.showPlanning(planRes.content);

        let planChoice = 'Yes, proceed with tasks';
        if (!bypassMode) {
            const confirmPlan = new Select({
                message: 'Approve plan?',
                choices: [
                    'Yes, proceed with tasks (Step-by-Step)',
                    'Yes to All (Bypass Mode - Auto-Approve full execution) 🚀',
                    'No, revise objective',
                    'Cancel'
                ]
            });
            planChoice = await confirmPlan.run().catch(() => 'Cancel');
        } else {
            console.log(chalk.green('\n🚀 [BYPASS MODE] Auto-approving plan execution...'));
        }

        if (planChoice === 'Yes to All (Bypass Mode - Auto-Approve full execution) 🚀') {
            bypassMode = true;
            if (config) config.setAutoApprove(true);
            planChoice = 'Yes, proceed with tasks';
        }

        if (planChoice !== 'Yes, proceed with tasks' && !planChoice.startsWith('Yes')) return;

        const taskRes = await withCancellation('Generating Tasks...', (signal) =>
            agent.tasks(planRes.content, { signal })
        );
        if (!taskRes || taskRes.aborted) return;

        await TerminalUI.showTasks(taskRes.content);

        let taskChoice = 'Yes, generate code';
        if (!bypassMode) {
            const confirmTasks = new Select({
                message: 'Start implementation?',
                choices: [
                    'Yes, generate code',
                    'Yes to All (Bypass Mode) 🚀',
                    'Cancel'
                ]
            });
            taskChoice = await confirmTasks.run().catch(() => 'Cancel');
        }

        if (taskChoice === 'Yes to All (Bypass Mode) 🚀') {
            bypassMode = true;
            if (config) config.setAutoApprove(true);
            taskChoice = 'Yes, generate code';
        }

        if (taskChoice !== 'Yes, generate code' && !taskChoice.startsWith('Yes')) return;

        const implRes = await withCancellation('Generating Implementation...', (signal) =>
            agent.generateCode(objective, { signal })
        );
        if (!implRes || implRes.aborted) return;

        const actions = agent.parseActions(implRes.content);

        if (actions.length === 0) {
            console.log(chalk.yellow('\n⚠️  No specific file actions identified. Showing general response:'));
            console.log(implRes.content);
        } else {
            console.log(chalk.cyan.bold(`\n📝 PROPOSED IMPLEMENTATION (${actions.length} actions)` + (bypassMode ? chalk.green(' [BYPASS MODE]') : '')));

            for (const action of actions) {
                if (action.type === 'COMMAND') {
                    TerminalUI.showCommand(action.description, action.content);
                    let actionChoice = 'Yes';
                    if (!bypassMode) {
                        const confirmAction = new Select({
                            message: `Execute this bash command?`,
                            choices: ['Yes', 'Yes to All (Bypass)', 'No', 'Cancel']
                        });
                        actionChoice = await confirmAction.run().catch(() => 'Cancel');
                    } else {
                        console.log(chalk.green(`🚀 [BYPASS MODE] Auto-executing command...`));
                    }

                    if (actionChoice === 'Yes to All (Bypass)') {
                        bypassMode = true;
                        if (config) config.setAutoApprove(true);
                        actionChoice = 'Yes';
                    }

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
                        const readRes = agent.fileManager.readFile(action.filePath);
                        currentContent = readRes.success ? readRes.data : '';
                    } catch { }

                    TerminalUI.showDiff(action.filePath, currentContent, action.content);

                    let actionChoice = 'Yes';
                    if (!bypassMode) {
                        const confirmAction = new Select({
                            message: `Apply ${action.type} to ${action.filePath}?`,
                            choices: ['Yes', 'Yes to All (Bypass)', 'No', 'Cancel']
                        });
                        actionChoice = await confirmAction.run().catch(() => 'Cancel');
                    } else {
                        console.log(chalk.green(`🚀 [BYPASS MODE] Auto-applying ${action.type} to ${action.filePath}...`));
                    }

                    if (actionChoice === 'Yes to All (Bypass)') {
                        bypassMode = true;
                        if (config) config.setAutoApprove(true);
                        actionChoice = 'Yes';
                    }

                    if (actionChoice === 'Cancel') break;
                    if (actionChoice === 'No') continue;

                    TerminalUI.showEditStatus(action.type, action.filePath);

                    if (action.type === 'DELETE') {
                        agent.fileManager.deleteFile(action.filePath);
                    } else if (action.type === 'CREATE' || action.type === 'UPDATE') {
                        agent.fileManager.writeFile(action.filePath, action.content);
                    }
                }
            }

            const status = agent.getGitStatus();
            const total = status.data?.total !== undefined ? status.data.total : status.total;
            if (status.success && total > 0) {
                let commitChoice = 'Yes (AI Message)';
                if (!bypassMode) {
                    const commitConfirm = new Select({
                        message: chalk.cyan.bold(`Implementation complete. Commit these ${total} changes now?`),
                        choices: [
                            { name: 'Yes (AI Message)', message: '✨ Yes (Generate AI Message)' },
                            { name: 'Yes (Manual Message)', message: '✏️ Yes (Write Manual Message)' },
                            { name: 'No', message: '❌ No (Do not commit)' }
                        ],
                        result(name) { return this.map(name)[name]; }
                    });
                    commitChoice = await commitConfirm.run().catch(() => 'No');
                } else {
                    console.log(chalk.green(`🚀 [BYPASS MODE] Auto-committing implementation changes via AI...`));
                }

                if (commitChoice !== 'No') {
                    if (commitChoice === 'Yes (AI Message)') {
                        const res = await withCancellation('Generating commit message...', (signal) => agent.smartCommit('.', { signal }));
                        if (res?.success) console.log(TerminalUI.formatSuccess(`Changes committed: ${res.output || res.message || 'Commit successful'}`));
                    } else {
                        const msg = await new Input({ message: 'Commit message:' }).run();
                        if (msg) {
                            const res = await agent.commitChanges(msg);
                            if (res.success) console.log(TerminalUI.formatSuccess('Changes committed.'));
                        }
                    }
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
        await handleError(err, agent, config);
    }
}

module.exports = { runProWorkflow };
