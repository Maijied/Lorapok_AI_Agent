const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const Table = require('cli-table3');
const ora = require('ora');

class TerminalUI {
    static getLogo() {
        const logo = figlet.textSync(' L O R A P O K ', { font: 'Slant' });
        return chalk.cyan.bold(logo);
    }

    static showHeader(version = '1.0.0', model = '', path = '') {
        console.clear();
        const logo = chalk.cyan.bold(
            figlet.textSync('LORAPOK', { font: 'Standard', horizontalLayout: 'fitted' })
        );

        console.log(logo);
        console.log(chalk.gray('───────────────────────────────────────────────────'));
        console.log(
            chalk.white.bold(' 🐛 EXPERT CODING AGENT ') +
            chalk.gray(`v${version}`.padEnd(10)) +
            chalk.blue('🧠 ') + chalk.white(model.padEnd(10))
        );
        console.log(chalk.gray(` 📂 ${path}`));
        console.log(chalk.gray('───────────────────────────────────────────────────') + '\n');
    }

    static showWelcome() {
        console.log(chalk.white.bold('  Tips for getting started:'));
        console.log(chalk.gray('  1. Ask questions, edit files, or run commands.'));
        console.log(chalk.gray('  2. Use ') + chalk.cyan('@') + chalk.gray(' to mention files.'));
        console.log(chalk.gray('  3. Use ') + chalk.cyan('/') + chalk.gray(' for commands.'));
        console.log(chalk.gray('  4. Type ') + chalk.cyan('/help') + chalk.gray(' to see all commands.'));
        console.log(chalk.gray('  5. Press ') + chalk.cyan('Ctrl+C') + chalk.gray(' twice to exit.\n'));
    }

    static showHelp() {
        const table = new Table({
            head: [chalk.cyan('Command'), chalk.cyan('Description'), chalk.cyan('Shortcuts')],
            style: { head: [], border: [] },
            colWidths: [15, 30, 20]
        });

        table.push(
            ['/chat', '💬 Chat', 'Enter'],
            ['/plan', '📝 Plan & Execute', '-'],
            ['/analyze', '🔍 Analyze Project', '-'],
            ['/files', '📁 Files', '-'],
            ['/git', '🔗 Git Ops', '-'],
            ['/logs', '📊 Logs', '-'],
            ['/settings', '⚙️  Settings', '-'],
            ['/clear', '🧹 Clear', 'clear'],
            ['/help', '❓ Help', '?'],
            ['/exit', '❌ Exit', 'Ctrl+C x2']
        );

        console.log(boxen(
            chalk.cyan.bold(' Lorapok command Reference\n\n') + table.toString(),
            { padding: 1, borderStyle: 'round', borderColor: 'cyan' }
        ));
    }

    static showInteractionSummary(sessionData) {
        const table = new Table({
            head: [chalk.cyan('Metric'), chalk.cyan('Value')],
            style: { head: [], border: [] }
        });

        table.push(
            ['Session ID', chalk.yellow(sessionData.id)],
            ['Interaction#', chalk.yellow(sessionData.count)],
            ['Success Rate', chalk.green(`${sessionData.successRate}%`)]
        );

        console.log(boxen(
            chalk.blue('Interaction Summary\n\n') + table.toString(),
            { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'blue' }
        ));
    }

    static async showPlanning(plan) {
        const { renderMarkdownSync } = require('./renderer');
        console.log(chalk.magenta.bold('\n📝 PLANNING\n'));

        // Render markdown (especially code blocks) before boxing
        const renderedPlan = renderMarkdownSync(plan);

        console.log(boxen(renderedPlan, {
            title: chalk.magenta.bold(' Implementation Strategy '),
            titleAlignment: 'center',
            padding: 1,
            borderStyle: 'double',
            borderColor: 'magenta'
        }));
    }

    static async showTasks(tasks) {
        const { renderMarkdownSync } = require('./renderer');
        console.log(chalk.yellow.bold('\n📋 TASKS\n'));
        const renderedTasks = renderMarkdownSync(tasks);
        console.log(boxen(renderedTasks, {
            title: chalk.yellow.bold(' Checklist '),
            titleAlignment: 'center',
            padding: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
    }

    static async showWalkthrough(walkthrough) {
        const { renderMarkdownSync } = require('./renderer');
        console.log(chalk.green.bold('\n🚀 WALKTHROUGH\n'));
        const renderedWalk = renderMarkdownSync(walkthrough);
        console.log(boxen(renderedWalk, {
            title: chalk.green.bold(' Completion Report '),
            titleAlignment: 'center',
            padding: 1,
            borderStyle: 'bold',
            borderColor: 'green'
        }));
    }

    static createSpinner(text = 'Lorapok Thinking...') {
        return ora({
            text: chalk.gray(text),
            spinner: {
                interval: 80,
                frames: ['🐛', '🐌', '🦋', '🐞', '🦗']
            }
        });
    }

    static formatError(msg) {
        return chalk.red(`\n❌ ${msg}`);
    }

    static formatSuccess(msg) {
        return chalk.green.bold(`\n✅ ${msg}`);
    }

    static truncateCode(code, lines = 10) {
        const split = code.split('\n');
        if (split.length <= lines) return code;
        const half = Math.floor(lines / 2);
        return [
            ...split.slice(0, half),
            chalk.gray(`\n... [${split.length - lines} lines truncated] ...\n`),
            ...split.slice(-half)
        ].join('\n');
    }

    static hideLongCodeBlocks(content, threshold = 50) {
        // Regex to match code blocks
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
        return content.replace(codeBlockRegex, (match, code) => {
            const lines = code.trim().split('\n');

            // Heuristic to detect directory trees (contains many ├──, └──, or /)
            const isTree = (code.match(/├──/g) || []).length > 3 || (code.match(/└──/g) || []).length > 3;

            // Heuristic to detect logs (contains timestamps or "info"/"error")
            const isLog = (code.match(/\d{4}-\d{2}-\d{2}T/g) || []).length > 3;

            // Do NOT hide if it's a tree, log, or under threshold
            if (isTree || isLog || lines.length <= threshold) {
                return match;
            }

            return `\n${chalk.gray(`[... ${lines.length} lines of code hidden ...]`)}\n${chalk.cyan(`(Use /logs or apply actions to see more)`)}\n`;
        });
    }

    static showDiff(filePath, oldContent, newContent) {
        console.log(chalk.cyan.bold(`\n📝 PROPOSED CHANGES: `) + chalk.yellow(filePath));

        const oldLines = oldContent ? oldContent.split('\n') : [];
        const newLines = newContent ? newContent.split('\n') : [];

        let output = '';
        const maxLines = Math.max(oldLines.length, newLines.length);

        // Simple line-by-line diff for visualization
        let addedEllipsis = false;
        for (let i = 0; i < maxLines; i++) {
            if (oldLines[i] !== newLines[i]) {
                if (oldLines[i] !== undefined) {
                    output += chalk.red(`- L${i + 1}: ${oldLines[i]}\n`);
                }
                if (newLines[i] !== undefined) {
                    output += chalk.green(`+ L${i + 1}: ${newLines[i]}\n`);
                }
                addedEllipsis = false; // Reset ellipsis flag if a change is found
            } else if (oldLines[i] !== undefined) {
                // Show early/late context lines
                if (i < 3 || i >= maxLines - 3) {
                    output += chalk.gray(`  L${i + 1}: ${oldLines[i]}\n`);
                    addedEllipsis = false;
                } else if (!addedEllipsis) {
                    output += chalk.gray(`  ...\n`);
                    addedEllipsis = true;
                }
            }
        }

        console.log(boxen(output, {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            title: 'Code Viewport',
            backgroundColor: '#111111'
        }));
    }

    static showEditStatus(action, file, range = '') {
        console.log(chalk.cyan(`🐛 Agent is ${action.toUpperCase()}: `) + chalk.yellow(file) + chalk.gray(range ? ` (${range})` : ''));
    }

    static showCommand(description, command) {
        console.log('\n' + boxen(chalk.whiteBright.bold(command), {
            padding: 1,
            title: `💻 BASH COMMAND: ${description.toUpperCase()}`,
            titleAlignment: 'left',
            borderColor: 'yellow',
            borderStyle: 'double',
            backgroundColor: '#1a1a1a'
        }));
    }

    static showGitStatus(status) {
        const table = new Table({
            head: [chalk.cyan('File'), chalk.cyan('Status')],
            style: { head: [], border: ['gray'] }
        });

        if (status.files.length === 0) {
            console.log(chalk.green('\n✨ Clean working directory. Nothing to commit.'));
            return;
        }

        status.files.forEach(f => {
            let statusColor;
            switch (f.status) {
                case 'Modified': statusColor = chalk.yellow; break;
                case 'Added': statusColor = chalk.green; break;
                case 'Deleted': statusColor = chalk.red; break;
                case 'Untracked': statusColor = chalk.magenta; break;
                default: statusColor = chalk.white;
            }
            table.push([f.file, statusColor(f.status)]);
        });

        console.log(boxen(table.toString(), {
            title: chalk.cyan.bold(' 🔗 GIT STATUS '),
            padding: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        }));
    }

    static showGitLog(commits) {
        let output = '';
        commits.forEach((c, i) => {
            output += `${chalk.yellow(c.hash)} ${chalk.white.bold(c.message)}\n`;
            output += `${chalk.gray(c.author)} ${chalk.blue(`(${c.date})`)}\n`;
            if (i < commits.length - 1) output += chalk.gray('─'.repeat(40)) + '\n';
        });

        console.log(boxen(output || chalk.gray('No commits found.'), {
            title: chalk.magenta.bold(' 📜 COMMIT HISTORY '),
            padding: 1,
            borderStyle: 'round',
            borderColor: 'magenta'
        }));
    }

    static showGitBranches(branches) {
        const table = new Table({
            head: [chalk.cyan('Status'), chalk.cyan('Branch Name')],
            style: { head: [], border: ['gray'] }
        });

        branches.forEach(b => {
            const status = b.current ? chalk.green('● Active') : chalk.gray('  ○');
            const name = b.current ? chalk.green.bold(b.name) : b.name;
            table.push([status, name]);
        });

        console.log(boxen(table.toString(), {
            title: chalk.blue.bold(' 🌿 BRANCHES '),
            padding: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));
    }

    static showGitRemotes(remotes) {
        const table = new Table({
            head: [chalk.cyan('Remote'), chalk.cyan('Fetch URL'), chalk.cyan('Push URL')],
            style: { head: [], border: ['gray'] }
        });

        if (remotes.length === 0) {
            console.log(chalk.yellow('\nNo remotes configured.'));
            return;
        }

        remotes.forEach(r => {
            table.push([chalk.bold(r.name), r.fetch || 'N/A', r.push || 'N/A']);
        });

        console.log(boxen(table.toString(), {
            title: chalk.cyan.bold(' 🔗 GIT REMOTES '),
            padding: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        }));
    }

    static showGitSync(type, remote, branch, success, output) {
        const icon = type === 'Push' ? '📤' : '📥';
        const color = success ? chalk.green : chalk.red;
        const statusText = success ? 'SUCCESS' : 'FAILED';

        let content = `${icon}  ${chalk.bold(type)}: ${chalk.cyan(remote)} / ${chalk.cyan(branch)}\n`;
        content += `${chalk.gray('──────────────────────────────────────')}\n`;
        content += `Status: ${color.bold(statusText)}\n\n`;

        if (output) {
            const lines = output.split('\n');
            const preview = lines.slice(-5).join('\n');
            content += chalk.white(preview);
            if (lines.length > 5) content += chalk.gray(`\n... (${lines.length - 5} more lines)`);
        } else if (success) {
            content += chalk.green('Everything up-to-date.');
        }

        console.log(boxen(content, {
            title: chalk.blue.bold(` 🔄 GIT SYNC: ${type.toUpperCase()} `),
            padding: 1,
            borderStyle: 'double',
            borderColor: success ? 'green' : 'red'
        }));
    }

    static showGitProcess(command, output, success = true) {
        let terminalContent = chalk.greenBright(`$ git ${command}\n\n`);

        if (output) {
            terminalContent += chalk.white(output);
        } else if (success) {
            terminalContent += chalk.gray('(No output - Success)');
        }

        console.log(boxen(terminalContent, {
            title: chalk.green.bold(' 📜 GIT PROCESS LOG '),
            padding: 1,
            borderStyle: 'round',
            borderColor: success ? 'green' : 'red',
            backgroundColor: '#1a1a1a'
        }));
    }

    static showGitDiagnostics(info) {
        let output = chalk.cyan.bold('\n📊 Git Diagnostics\n\n');

        output += chalk.white('User: ') + chalk.green(`${info.user.name} <${info.user.email}>`) + '\n';
        output += chalk.white('Branch: ') + chalk.green(info.branch) + '\n';
        output += chalk.white('Staged: ') + chalk.green(info.stagedCount) + ' files\n';

        if (info.ignored && info.ignored.length > 0) {
            output += chalk.white('\nIgnored Files Preview:\n');
            info.ignored.slice(0, 5).forEach(f => output += chalk.gray(`  - ${f}\n`));
            if (info.ignored.length > 5) output += chalk.gray(`  ... and ${info.ignored.length - 5} more\n`);
        }

        console.log(boxen(output, {
            padding: 1,
            borderStyle: 'single',
            borderColor: 'cyan'
        }));
    }

    static showWorkflowRuns(runs) {
        const table = new Table({
            head: [chalk.cyan('Status'), chalk.cyan('Event'), chalk.cyan('Commit'), chalk.cyan('Branch'), chalk.cyan('Time')],
            style: { head: [], border: ['gray'] },
            colWidths: [10, 15, 30, 15, 20]
        });

        if (!runs || runs.length === 0) {
            console.log(chalk.yellow('\n⚠️  No workflow runs found.'));
            return;
        }

        runs.slice(0, 10).forEach(run => {
            let statusIcon;
            switch (run.conclusion) {
                case 'success': statusIcon = chalk.green('✔ Success'); break;
                case 'failure': statusIcon = chalk.red('✖ Failure'); break;
                case 'cancelled': statusIcon = chalk.gray('🚫 Cancel'); break;
                case 'skipped': statusIcon = chalk.gray('⏭ Skip'); break;
                default:
                    if (run.status === 'in_progress') statusIcon = chalk.yellow('⏳ Running');
                    else if (run.status === 'queued') statusIcon = chalk.blue('zzz Queued');
                    else statusIcon = chalk.white(run.status);
            }

            const time = new Date(run.updated_at).toLocaleString();
            const msg = run.head_commit?.message?.split('\n')[0] || 'No commit message';

            table.push([
                statusIcon,
                run.event,
                chalk.white(msg.substring(0, 28) + (msg.length > 28 ? '..' : '')),
                chalk.blue(run.head_branch),
                chalk.gray(time)
            ]);
        });

        console.log(boxen(table.toString(), {
            title: chalk.magenta.bold(' ⚡ GITHUB ACTIONS RUNS '),
            padding: 1,
            borderStyle: 'round',
            borderColor: 'magenta'
        }));
    }

    static showRunDetails(run, jobs) {
        let output = `${chalk.bold(run.name)} ${chalk.gray('#' + run.run_number)}\n`;
        output += `${chalk.cyan(run.status)}: ${chalk.white(run.conclusion || 'pending')}\n`;
        output += `${chalk.gray('Triggered by:')} ${run.event} ${chalk.gray('on')} ${chalk.blue(run.head_branch)}\n\n`;

        if (jobs && jobs.length > 0) {
            jobs.forEach(job => {
                const icon = job.conclusion === 'success' ? chalk.green('✔') :
                    job.conclusion === 'failure' ? chalk.red('✖') :
                        job.status === 'in_progress' ? chalk.yellow('⏳') : chalk.gray('⚪');

                output += `${icon} ${chalk.bold(job.name)} ${chalk.gray(`(${job.steps.length} steps)`)}\n`;

                job.steps.forEach(step => {
                    const stepIcon = step.conclusion === 'success' ? chalk.green('  ✓') :
                        step.conclusion === 'failure' ? chalk.red('  ✕') :
                            step.status === 'in_progress' ? chalk.yellow('  ➜') : chalk.gray('  -');
                    output += `${stepIcon} ${step.name}\n`;
                });
                output += '\n';
            });
        }

        console.log(boxen(output, {
            title: chalk.cyan.bold(' 📜 RUN DETAILS '),
            padding: 1,
            borderStyle: 'double',
            borderColor: 'cyan'
        }));
    }
}

module.exports = TerminalUI;
