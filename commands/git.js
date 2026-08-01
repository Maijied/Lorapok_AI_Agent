/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const { Select, Input } = require('enquirer');
const TerminalUI = require('../lib/ui');
const { renderMarkdown } = require('../lib/renderer');
const { withCancellation } = require('./utils');
const { showAuthMenu } = require('./auth');
const boxen = require('boxen');
const { menuChoice, backChoice } = require('../lib/menu-format');

/**
 * Interactive menu runner for Git operations.
 * @param {Object} agent - Lorapok agent instance
 * @param {Object} config - Lorapok config instance
 * @returns {Promise<{ success: boolean }>} Execution status
 */
async function showGitMenu(agent, config) {
    while (true) {
        const select = new Select({
            name: 'gitAction',
            message: '🔗 Git Operations',
            choices: [
                menuChoice('status', '🔍', 'Status'),
                menuChoice('diff', '📝', 'View Diff'),
                menuChoice('commit_ai', '🤖', 'Smart Commit (AI)'),
                menuChoice('commit_manual', '📝', 'Manual Commit'),
                menuChoice('branches', '🌿', 'Branches'),
                menuChoice('log', '📜', 'Commit Log'),
                menuChoice('sync', '🔄', 'Push/Pull'),
                menuChoice('stash', '📥', 'Stash Management'),
                menuChoice('remotes', '🌐', 'Manage Remotes'),
                menuChoice('auth', '🔑', 'Authentication'),
                menuChoice('advanced', '⚙', 'Advanced...'),
                backChoice()
            ]
        });

        const action = await select.run().catch(() => 'back');
        if (action === 'back') break;

        try {
            if (action === 'status') {
                const status = agent.getGitStatus();
                if (status.success) {
                    TerminalUI.showGitStatus(status);
                } else {
                    console.log(TerminalUI.formatError(status.error));
                }
            } else if (action === 'diff') {
                const res = agent.gitManager.getDiff();
                if (res.success) {
                    const diffText = res.data || res.output || '';
                    if (!diffText) {
                        console.log(chalk.gray('\nNo changes to show.'));
                    } else {
                        console.log(chalk.cyan('\nGit Diff:'));
                        console.log(await renderMarkdown(`\`\`\`diff\n${diffText.substring(0, 2000)}${diffText.length > 2000 ? '\n... (truncated)' : ''}\n\`\`\``));
                    }
                } else {
                    console.log(TerminalUI.formatError(res.error));
                }
            } else if (action === 'commit_ai') {
                const res = await withCancellation('Generating smart commit...', (signal) =>
                    agent.smartCommit('.', { signal })
                );
                if (res && res.success) {
                    console.log(TerminalUI.formatSuccess(`Changes committed: ${res.message}`));
                } else if (res && !res.aborted) {
                    console.log(TerminalUI.formatError(res.error || 'Commit failed.'));
                }
            } else if (action === 'commit_manual') {
                const status = agent.getGitStatus();
                const total = status.data?.total !== undefined ? status.data.total : status.total;
                if (status.success && total > 0) {
                    const msg = await new Input({ message: 'Commit message:' }).run();
                    if (msg) {
                        const res = await agent.commitChanges(msg);
                        if (res.success) {
                            console.log(TerminalUI.formatSuccess('Changes committed successfully.'));
                        } else {
                            console.log(TerminalUI.formatError(res.error));
                        }
                    }
                } else {
                    console.log(chalk.yellow('\nNothing to commit.'));
                }
            } else if (action === 'branches') {
                const res = agent.gitManager.getBranches();
                if (res.success) {
                    const branches = res.data || res.branches || [];
                    TerminalUI.showGitBranches(branches);
                    const branchAction = new Select({
                        name: 'bCmd',
                        message: 'Branch Operations:',
                        choices: [
                            menuChoice('create', '➕', 'Create New Branch'),
                            menuChoice('switch', '🔀', 'Switch Branch'),
                            backChoice()
                        ],
                        result(name) { return this.map(name)[name]; }
                    });
                    const bCmd = await branchAction.run().catch(() => 'back');
                    if (bCmd === 'create') {
                        const name = await new Input({ message: 'New branch name:' }).run();
                        if (name) {
                            const createRes = agent.createGitBranch(name);
                            if (createRes.success) console.log(TerminalUI.formatSuccess(`Switched to new branch: ${name}`));
                            else console.log(TerminalUI.formatError(createRes.error));
                        }
                    } else if (bCmd === 'switch') {
                        const swRes = new Select({
                            message: 'Select branch to switch to:',
                            choices: branches.map(b => menuChoice(b.name, '🌿', `${b.name}${b.current ? ' (current)' : ''}`))
                        });
                        const target = await swRes.run();
                        const switchRes = agent.switchGitBranch(target);
                        if (switchRes.success) console.log(TerminalUI.formatSuccess(`Switched to branch: ${target}`));
                        else console.log(TerminalUI.formatError(switchRes.error));
                    }
                }
            } else if (action === 'log') {
                const res = agent.getGitLog(15);
                if (res.success) {
                    const commits = res.data || res.commits || [];
                    TerminalUI.showGitLog(commits);
                } else {
                    console.log(TerminalUI.formatError(res.error));
                }
            } else if (action === 'sync') {
                const remotesRes = agent.gitManager.getRemotesDetailed();
                if (!remotesRes.success) {
                    console.log(TerminalUI.formatError(remotesRes.error));
                    continue;
                }

                const remotes = remotesRes.data || remotesRes.remotes || [];
                if (remotes.length === 0) {
                    console.log(chalk.yellow('\n⚠️  No remotes configured.'));
                    const addRemote = await new Select({
                        message: 'Add a remote now?',
                        choices: [
                            menuChoice('yes', '🟢', 'Yes, configure remote'),
                            menuChoice('no', '❌', 'No')
                        ],
                        result(name) { return this.map(name)[name]; }
                    }).run().catch(() => 'no');

                    if (addRemote === 'yes') {
                        await showRemoteMenu(agent);
                    }
                    continue;
                }

                const sSelect = new Select({
                    name: 'sCmd',
                    message: 'Sync Operation:',
                    choices: [
                        menuChoice('pull', '⬇', 'Pull (Fetch & Merge)'),
                        menuChoice('push', '⬆', 'Push (Upload Commits)'),
                        backChoice()
                    ],
                    result(name) { return this.map(name)[name]; }
                });
                const sCmd = await sSelect.run().catch(() => 'back');
                if (sCmd === 'back') continue;

                const remote = remotes.length === 1
                    ? remotes[0].name
                    : await new Select({ message: 'Select remote:', choices: remotes.map(r => r.name) }).run();

                const branchRes = agent.gitManager.getCurrentBranch();
                const branch = branchRes.success ? (branchRes.data || branchRes.output || 'main') : 'main';

                const performGitAction = async (actionFn, actionName) => {
                    let res = await withCancellation(`${actionName}ing ${remote}/${branch}...`, () =>
                        Promise.resolve(actionFn(branch, remote))
                    );

                    if (res && !res.success && ((res.output && (res.output.includes('Authentication failed') || res.output.includes('403') || res.output.includes('could not read Username') || res.output.includes('terminal prompts disabled'))) || (res.error && res.error.includes('Authentication failed')))) {
                        console.log(chalk.yellow(`\n⚠️  Authentication failed for ${remote}.`));

                        const sshAvailable = agent.gitManager.testSSHConnection().success;
                        const choices = [
                            menuChoice('browser', '🌐', 'Login via Browser (Recommended)'),
                            menuChoice('token', '🔑', 'Enter Token or Password')
                        ];
                        if (sshAvailable) choices.push(menuChoice('ssh', '🗝', 'Switch to SSH'));
                        choices.push(menuChoice('cancel', '❌', 'Cancel'));

                        const fixSelect = new Select({
                            message: 'Select Authentication Method:',
                            choices: choices
                        });

                        const fix = await fixSelect.run().catch(() => 'cancel');

                        if (fix === 'browser') {
                            const GithubAuth = require('../services/GithubAuth');
                            const ghAuth = new GithubAuth();
                            const url = ghAuth.getSmartAuthUrl();

                            await ghAuth.openBrowser(url);

                            console.log(boxen(chalk.cyan(`1. Browser should open... or click: ${chalk.underline.bold(url)}\n2. Scroll down and click "Generate token"\n3. Copy the token and paste it below.`), { padding: 1, borderStyle: 'round', borderColor: 'cyan' }));

                            const token = await new Input({ message: 'Paste Token:' }).run();
                            if (token) {
                                process.env.GH_TOKEN = token;
                                config.setGitHubToken(token);
                                agent.gitManager.configureTokenAuth(token);
                                res = await withCancellation(`Retrying with new token...`, () => Promise.resolve(actionFn(branch, remote)));
                            }
                        } else if (fix === 'token') {
                            const token = await new Input({ message: 'GitHub Token or Password:' }).run();
                            if (token) {
                                process.env.GH_TOKEN = token;
                                config.setGitHubToken(token);
                                agent.gitManager.configureTokenAuth(token);
                                res = await withCancellation(`Retrying with token...`, () => Promise.resolve(actionFn(branch, remote)));
                            }
                        } else if (fix === 'ssh') {
                            const sshRes = agent.gitManager.convertToSSH(remote);
                            if (sshRes.success) {
                                console.log(TerminalUI.formatSuccess('Switched remote to SSH.'));
                                res = await withCancellation(`Retrying via SSH...`, () => Promise.resolve(actionFn(branch, remote)));
                            } else {
                                console.log(TerminalUI.formatError(sshRes.error));
                            }
                        }
                    }
                    return res;
                };

                if (sCmd === 'Pull') {
                    const res = await performGitAction((b, r) => agent.gitManager.pull(b, r), 'Pull');
                    if (res) TerminalUI.showGitSync('Pull', remote, branch, res.success, res.output || res.error);
                } else {
                    const res = await performGitAction((b, r) => agent.gitManager.push(b, r), 'Push');
                    if (res) TerminalUI.showGitSync('Push', remote, branch, res.success, res.output || res.error);
                }
            } else if (action === 'stash') {
                await showStashMenu(agent);
                continue;
            } else if (action === 'remotes') {
                await showRemoteMenu(agent);
                continue;
            } else if (action === 'auth') {
                await showAuthMenu(agent, config);
                continue;
            } else if (action === 'advanced') {
                await showAdvancedGitMenu(agent);
                continue;
            }
        } catch (e) {
            console.log(TerminalUI.formatError(`Git operation failed: ${e.message}`));
        }

        await new Input({ message: 'Press Enter to continue' }).run().catch(() => null);
    }
    return { success: true };
}

/**
 * Manage Git stash operations menu.
 * @param {Object} agent - Lorapok agent instance
 * @returns {Promise<void>}
 */
async function showStashMenu(agent) {
    while (true) {
        const select = new Select({
            message: '📥 Git Stash Management',
            choices: [
                menuChoice('push', '📥', 'Push Stash'),
                menuChoice('pop', '📤', 'Pop Stash (Apply & Remove)'),
                menuChoice('list', '📋', 'List Stashes'),
                menuChoice('clear', '🔥', 'Clear All Stashes'),
                backChoice()
            ]
        });

        const action = await select.run().catch(() => 'back');
        if (action === 'back') break;

        try {
            if (action === 'push') {
                const msg = await new Input({ message: 'Stash message (optional):' }).run();
                const res = agent.gitManager.stash(msg);
                if (res.success) console.log(TerminalUI.formatSuccess('Changes stashed.'));
                else console.log(TerminalUI.formatError(res.error));
            } else if (action === 'pop') {
                const res = agent.gitManager.stashPop();
                if (res.success) console.log(TerminalUI.formatSuccess('Stash popped successfully.'));
                else console.log(TerminalUI.formatError(res.error));
            } else if (action === 'list') {
                const res = agent.gitManager.getStashes();
                if (res.success) {
                    console.log(chalk.cyan('\nStash List:'));
                    console.log(res.output || res.data || chalk.gray('No stashes found.'));
                } else console.log(TerminalUI.formatError(res.error));
            } else if (action === 'clear') {
                const res = agent.gitManager.stashClear();
                if (res.success) console.log(TerminalUI.formatSuccess('All stashes cleared.'));
                else console.log(TerminalUI.formatError(res.error));
            }
        } catch (e) {
            console.log(TerminalUI.formatError(e.message));
        }
        await new Input({ message: 'Press Enter' }).run().catch(() => null);
    }
}

/**
 * Manage advanced Git actions menu (amend, tags, merge, cherry-pick, clean, reset).
 * @param {Object} agent - Lorapok agent instance
 * @returns {Promise<void>}
 */
async function showAdvancedGitMenu(agent) {
    while (true) {
        const select = new Select({
            message: '⚙️  Advanced Git Operations',
            choices: [
                menuChoice('amend', '⚒', 'Amend Last Commit'),
                menuChoice('tags', '🏷', 'Manage Tags'),
                menuChoice('merge', '🤝', 'Merge Branch'),
                menuChoice('cherry', '🍒', 'Cherry-pick Commit'),
                menuChoice('diag', '🔍', 'Repo Diagnostics'),
                menuChoice('clean', '🧹', 'Clean Untracked Files'),
                menuChoice('reset', '⚠', 'Hard Reset (to HEAD)'),
                menuChoice('init', '🏁', 'Initialize Repository'),
                backChoice()
            ]
        });

        const action = await select.run().catch(() => 'back');
        if (action === 'back') break;

        try {
            if (action === 'amend') {
                const confirm = new Select({
                    message: 'Amend last commit?',
                    choices: ['Yes (Keep Message)', 'Yes (Change Message)', 'No']
                });
                const choice = await confirm.run();
                if (choice === 'No') continue;

                let msg = '';
                if (choice === 'Yes (Change Message)') {
                    msg = await new Input({ message: 'New commit message:' }).run();
                }

                const res = agent.gitManager.amendCommit(msg);
                if (res.success) console.log(TerminalUI.formatSuccess('Last commit amended.'));
                else console.log(TerminalUI.formatError(res.error));

            } else if (action === 'tags') {
                const tagRes = agent.gitManager.getTags();
                if (tagRes.success) {
                    const tags = tagRes.data || tagRes.tags || [];
                    console.log(chalk.cyan('\nTags: ') + (tags.join(', ') || chalk.gray('None')));
                    const tagAction = new Select({
                        message: 'Tag Operations',
                        choices: ['Create Tag', 'Back']
                    });
                    if (await tagAction.run() === 'Create Tag') {
                        const name = await new Input({ message: 'Tag name (v1.0):' }).run();
                        const msg = await new Input({ message: 'Tag message (optional):' }).run();
                        if (name) {
                            const res = agent.gitManager.createTag(name, msg);
                            if (res.success) console.log(TerminalUI.formatSuccess(`Tag ${name} created.`));
                            else console.log(TerminalUI.formatError(res.error));
                        }
                    }
                }
            } else if (action === 'merge') {
                const branchRes = agent.gitManager.getBranches();
                if (branchRes.success) {
                    const branches = branchRes.data || branchRes.branches || [];
                    const otherBranches = branches.filter(b => !b.current).map(b => b.name);
                    if (otherBranches.length === 0) {
                        console.log(chalk.yellow('\nNo other branches to merge from.'));
                    } else {
                        const target = await new Select({ message: 'Select branch to merge INTO current branch:', choices: otherBranches }).run();
                        const res = agent.gitManager.merge(target);
                        if (res.success) console.log(TerminalUI.formatSuccess(`Merged ${target} into current branch.`));
                        else console.log(TerminalUI.formatError(res.error));
                    }
                }
            } else if (action === 'cherry') {
                const hash = await new Input({ message: 'Enter commit hash to cherry-pick:' }).run();
                if (hash) {
                    const res = agent.gitManager.cherryPick(hash);
                    if (res.success) console.log(TerminalUI.formatSuccess(`Successfully cherry-picked ${hash}`));
                    else console.log(TerminalUI.formatError(res.error));
                }
            } else if (action === 'diag') {
                const userRes = agent.gitManager.getUserConfig();
                const branchRes = agent.gitManager.getCurrentBranch();
                const stagedCount = agent.gitManager.getStagedCount();
                const ignoredRes = agent.gitManager.listIgnored();

                TerminalUI.showGitDiagnostics({
                    user: userRes.data || userRes,
                    branch: branchRes.success ? (branchRes.data || branchRes.output) : 'Unknown',
                    stagedCount: stagedCount.data !== undefined ? stagedCount.data : stagedCount,
                    ignored: ignoredRes.success ? (ignoredRes.output || ignoredRes.data || '').split('\n').filter(l => l.trim()) : []
                });

                const checkIgnored = new Select({
                    message: 'Diagnostic Actions',
                    choices: ['Check if file is ignored', 'Back']
                });
                if (await checkIgnored.run() === 'Check if file is ignored') {
                    const file = await new Input({ message: 'Enter file path:' }).run();
                    if (file) {
                        const res = agent.gitManager.checkIgnore(file);
                        if (res.success) console.log(chalk.cyan(`\nIgnore Rule: `) + chalk.yellow(res.output || res.data));
                        else console.log(chalk.green('\nFile is NOT ignored.'));
                    }
                }
            } else if (action === 'clean') {
                const dry = agent.gitManager.clean(true);
                console.log(chalk.cyan('\nFiles to be removed:'));
                const dryOut = dry.data || dry.output || '';
                console.log(dryOut || chalk.gray('None.'));
                if (dryOut) {
                    const confirm = await new Select({ message: 'Remove these files forever?', choices: ['Yes', 'No'] }).run();
                    if (confirm === 'Yes') {
                        const res = agent.gitManager.clean(false);
                        if (res.success) console.log(TerminalUI.formatSuccess('Cleanup complete.'));
                        else console.log(TerminalUI.formatError(res.error));
                    }
                }
            } else if (action === 'reset') {
                const confirm = await new Select({ message: '⚠️ HARD RESET will discard all unstaged changes. Continue?', choices: ['Yes', 'No'] }).run();
                if (confirm === 'Yes') {
                    const res = agent.gitManager.reset('HEAD', '--hard');
                    if (res.success) console.log(TerminalUI.formatSuccess('Hard reset complete.'));
                    else console.log(TerminalUI.formatError(res.error));
                }
            } else if (action === 'init') {
                const res = agent.gitManager.initRepo();
                if (res.success) console.log(TerminalUI.formatSuccess('Git repository initialized.'));
                else console.log(TerminalUI.formatError(res.error));
            }
        } catch (e) {
            console.log(TerminalUI.formatError(e.message));
        }
        await new Input({ message: 'Press Enter' }).run().catch(() => null);
    }
}

/**
 * Manage Git remote configurations menu.
 * @param {Object} agent - Lorapok agent instance
 * @returns {Promise<void>}
 */
async function showRemoteMenu(agent) {
    while (true) {
        const res = agent.gitManager.getRemotesDetailed();
        const remotes = res.data || res.remotes || [];
        if (res.success) TerminalUI.showGitRemotes(remotes);

        const select = new Select({
            message: '🌐 Git Remote Management',
            choices: [
                menuChoice('add', '➕', 'Add Remote'),
                menuChoice('remove', '❌', 'Remove Remote'),
                menuChoice('rename', '✏', 'Rename Remote'),
                menuChoice('url', '🔗', 'Update Remote URL'),
                backChoice()
            ]
        });

        const action = await select.run().catch(() => 'back');
        if (action === 'back') break;

        try {
            if (action === 'add') {
                const name = await new Input({ message: 'Remote name (e.g., origin):' }).run();
                const url = await new Input({ message: 'URL:' }).run();
                if (name && url) {
                    const addRes = agent.gitManager.setRemote(name, url);
                    if (addRes.success) console.log(TerminalUI.formatSuccess(`Remote ${name} added.`));
                    else console.log(TerminalUI.formatError(addRes.error));
                }
            } else if (action === 'remove') {
                if (remotes.length === 0) {
                    console.log(chalk.yellow('\nNo remotes to remove.'));
                    continue;
                }
                const name = await new Select({ message: 'Select remote to remove:', choices: remotes.map(r => r.name) }).run();
                const confirm = await new Select({ message: `Remove remote ${name}?`, choices: ['Yes', 'No'] }).run();
                if (confirm === 'Yes') {
                    const remRes = agent.gitManager.removeRemote(name);
                    if (remRes.success) console.log(TerminalUI.formatSuccess(`Remote ${name} removed.`));
                    else console.log(TerminalUI.formatError(remRes.error));
                }
            } else if (action === 'rename') {
                if (remotes.length === 0) {
                    console.log(chalk.yellow('\nNo remotes to rename.'));
                    continue;
                }
                const oldName = await new Select({ message: 'Select remote to rename:', choices: remotes.map(r => r.name) }).run();
                const newName = await new Input({ message: 'New name:' }).run();
                if (oldName && newName) {
                    const renRes = agent.gitManager.renameRemote(oldName, newName);
                    if (renRes.success) console.log(TerminalUI.formatSuccess(`Remote renamed to ${newName}.`));
                    else console.log(TerminalUI.formatError(renRes.error));
                }
            } else if (action === 'url') {
                if (remotes.length === 0) {
                    console.log(chalk.yellow('\nNo remotes to update.'));
                    continue;
                }
                const name = await new Select({ message: 'Select remote:', choices: remotes.map(r => r.name) }).run();
                const url = await new Input({ message: 'New URL:' }).run();
                if (name && url) {
                    const setRes = agent.gitManager.setRemote(name, url);
                    if (setRes.success) console.log(TerminalUI.formatSuccess(`Remote ${name} URL updated.`));
                    else console.log(TerminalUI.formatError(setRes.error));
                }
            }
        } catch (e) {
            console.log(TerminalUI.formatError(e.message));
        }
        await new Input({ message: 'Press Enter' }).run().catch(() => null);
    }
}

/**
 * Proactive commit prompt logic following file modifications.
 * @param {Object} context - CommandContext containing { agent, ui }
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>} Commit result
 */
async function promptSmartCommit(context) {
    const { agent, ui } = context;
    const status = agent.getGitStatus();
    const isSuccess = status.success;
    const total = status.data?.total !== undefined ? status.data.total : status.total;

    if (isSuccess && total > 0) {
        const commitConfirm = new Select({
            message: chalk.cyan.bold(`Implementation complete. Commit these ${total} changes now?`),
            choices: [
                menuChoice('Yes (AI Message)', '✨', 'Yes (Generate AI Message)'),
                menuChoice('Yes (Manual Message)', '✏', 'Yes (Write Manual Message)'),
                menuChoice('No', '❌', 'No (Do not commit)')
            ],
            result(name) { return this.map(name)[name]; }
        });
        const commitChoice = await commitConfirm.run().catch(() => 'No');
        if (commitChoice !== 'No') {
            if (commitChoice === 'Yes (AI Message)') {
                const res = await withCancellation('Generating commit message...', (signal) =>
                    agent.smartCommit('.', { signal })
                );
                if (res?.success) {
                    console.log(ui.formatSuccess(`Changes committed: ${res.output || res.message || 'Commit successful'}`));
                    return { success: true, message: res.message };
                }
            } else {
                const msg = await new Input({ message: 'Commit message:' }).run();
                if (msg) {
                    const res = await agent.commitChanges(msg);
                    if (res.success) {
                        console.log(ui.formatSuccess('Changes committed.'));
                        return { success: true, message: msg };
                    }
                }
            }
        }
    }
    return { success: true };
}

/**
 * Dispatcher for /git slash commands (/status, /commit, /diff, /branch, etc.).
 * @param {string} subCommand - Slash subcommand name
 * @param {string[]} args - Command arguments array
 * @param {Object} context - CommandContext containing { agent, config, ui }
 * @returns {Promise<{ success: boolean, message?: string, data?: any, error?: string }>} Slash command result
 */
async function handleGitSlashCommand(subCommand, args, context) {
    const { agent, config, ui } = context;
    const cmd = subCommand ? subCommand.toLowerCase() : 'menu';

    switch (cmd) {
        case 'status': {
            const status = agent.getGitStatus();
            if (status.success) {
                ui.showGitStatus(status);
                return { success: true, data: status };
            }
            console.log(ui.formatError(status.error));
            return { success: false, error: status.error };
        }
        case 'diff': {
            const file = args[0] || '';
            const res = agent.gitManager.getDiff(file);
            if (res.success) {
                const diffText = res.data || res.output || '';
                if (!diffText) {
                    console.log(chalk.gray('\nNo changes to show.'));
                } else {
                    console.log(chalk.cyan('\nGit Diff:'));
                    console.log(await renderMarkdown(`\`\`\`diff\n${diffText.substring(0, 2000)}${diffText.length > 2000 ? '\n... (truncated)' : ''}\n\`\`\``));
                }
                return { success: true, data: diffText };
            }
            console.log(ui.formatError(res.error));
            return { success: false, error: res.error };
        }
        case 'commit': {
            const msg = args.join(' ');
            if (msg) {
                const res = await agent.commitChanges(msg);
                if (res.success) {
                    console.log(ui.formatSuccess('Changes committed successfully.'));
                    return { success: true, message: msg };
                }
                console.log(ui.formatError(res.error));
                return { success: false, error: res.error };
            } else {
                return promptSmartCommit(context);
            }
        }
        case 'branch': {
            const res = agent.gitManager.getBranches();
            if (res.success) {
                const branches = res.data || res.branches || [];
                ui.showGitBranches(branches);
                return { success: true, data: branches };
            }
            console.log(ui.formatError(res.error));
            return { success: false, error: res.error };
        }
        case 'menu':
        default:
            await showGitMenu(agent, config);
            return { success: true };
    }
}

module.exports = {
    showGitMenu,
    handleGitSlashCommand,
    promptSmartCommit
};
