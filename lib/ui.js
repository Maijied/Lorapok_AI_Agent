const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const Table = require('cli-table3');
const ora = require('ora');
const readline = require('readline');

/**
 * Enhanced Pixel-Art Larva Frames (Copilot-style Ghost)
 */
const LARVA_FRAMES = [
    // Frame 0: Normal
    [
        "      ▄▄██████▄▄      ",
        "    ▄████████████▄    ",
        "  ▄████████████████▄  ",
        " ▐████▀   ▀██▀   ▀████▌ ",
        " ▐████  ▄  ▐▌  ▄  ████▌ ",
        " ▐████  ▀  ▐▌  ▀  ████▌ ",
        "  ▀████▄   ▐▌   ▄████▀  ",
        "    ▀▀████████████▀▀    ",
        "       ▀▀▀▀  ▀▀▀▀       "
    ],
    // Frame 1: Blink
    [
        "      ▄▄██████▄▄      ",
        "    ▄████████████▄    ",
        "  ▄████████████████▄  ",
        " ▐████▄   ▄██▄   ▄████▌ ",
        " ▐████  ▄  ▐▌  ▄  ████▌ ",
        " ▐████  ▀  ▐▌  ▀  ████▌ ",
        "  ▀████▄   ▐▌   ▄████▀  ",
        "    ▀▀████████████▀▀    ",
        "       ▀▀▀▀  ▀▀▀▀       "
    ],
    // Frame 2: Look Left
    [
        "      ▄▄██████▄▄      ",
        "    ▄████████████▄    ",
        "  ▄████████████████▄  ",
        " ▐████   ▀██▀   ▀████▌ ",
        " ▐████ ▄  ▐▌  ▄   ████▌ ",
        " ▐████ ▀  ▐▌  ▀   ████▌ ",
        "  ▀████▄   ▐▌   ▄████▀  ",
        "    ▀▀████████████▀▀    ",
        "       ▀▀▀▀  ▀▀▀▀       "
    ],
    // Frame 3: Look Right
    [
        "      ▄▄██████▄▄      ",
        "    ▄████████████▄    ",
        "  ▄████████████████▄  ",
        " ▐████▀   ▀██▀   ████▌ ",
        " ▐████   ▄  ▐▌  ▄ ████▌ ",
        " ▐████   ▀  ▐▌  ▀ ████▌ ",
        "  ▀████▄   ▐▌   ▄████▀  ",
        "    ▀▀████████████▀▀    ",
        "       ▀▀▀▀  ▀▀▀▀       "
    ]
];

class TerminalUI {
    static async showBranding() {
        const logoPath = require('path').join(__dirname, '..', 'public', 'Resources', 'img', 'logo.png');
        if (require('fs').existsSync(logoPath)) {
            try {
                const terminalImage = require('terminal-image');
                const image = await terminalImage.file(logoPath, { width: 32 });
                console.log('\n' + image);
            } catch (e) {
                // Silently fallback if image fails
            }
        }
    }

    static getBranding(font = 'Small', bugFrame = 0, version = '1.0.0') {
        // Fallback if font is invalid or empty
        if (!font) font = 'Small';

        // Map "Unique Stack" themes
        const fontMapping = {
            'Roman': 'Small Shadow',
            'Big': 'Standard',
            'Graceful': 'ANSI Shadow',
            'Cyberlarge': 'Small',
            'Straight': 'Small Slant',
            'Executive': 'Calvin S',
            'Engineering': 'Delta Corps Priest 1'
        };

        const actualFont = fontMapping[font] || font;

        let brandingText;
        try {
            brandingText = figlet.textSync('LORAPOK   CLI', { font: actualFont });
        } catch (e) {
            brandingText = figlet.textSync('LORAPOK   CLI', { font: 'Small' });
        }

        const brandingLines = brandingText.split('\n').map(l => chalk.cyan.bold(l));
        
        // Prepare Larva (Bug) - AI Agent style
        const rawLarvaLines = LARVA_FRAMES[bugFrame % LARVA_FRAMES.length];
        const larvaColor = chalk.hex('#A020F0');
        const larvaLines = rawLarvaLines.map(l => larvaColor(l));

        // Combine
        const textWidth = Math.max(...brandingLines.map(l => l.replace(/\u001b\[\d+m/g, '').length));
        
        let content = [];
        const maxLines = Math.max(brandingLines.length, larvaLines.length);

        for (let i = 0; i < maxLines; i++) {
            const textLine = (brandingLines[i] || '').padEnd(textWidth, ' ');
            const larvaLine = larvaLines[i] || '';
            content.push("    " + textLine + "    " + larvaLine);
        }

        const contentWidth = Math.max(...content.map(l => l.replace(/\u001b\[\d+m/g, '').length));
        const topFrame = chalk.gray('┏' + '━'.repeat(contentWidth + 6) + '┓');
        const bottomFrame = chalk.gray('┗' + '━'.repeat(contentWidth + 6) + '┛');

        const boxedContent = content.map(row => {
            const rowLen = row.replace(/\u001b\[\d+m/g, '').length;
            const pad = contentWidth - rowLen;
            return chalk.gray('┃  ') + row + ' '.repeat(pad) + chalk.gray('  ┃');
        }).join('\n');

        return '\n' + topFrame + '\n' + boxedContent + '\n' + bottomFrame + '\n';
    }

    /**
     * Animate the Bug Logo on startup
     */
    static async animateLogo(duration = 1500, font = 'Slant', version = '1.0.0') {
        const frames = [0, 0, 1, 0, 2, 0, 3, 0];
        let i = 0;
        const interval = 150;
        const totalSteps = Math.floor(duration / interval);

        return new Promise(resolve => {
            const timer = setInterval(() => {
                console.clear();
                const frameIdx = frames[i % frames.length];
                console.log(this.getBranding(font, frameIdx, version));
                i++;
                if (i >= totalSteps) {
                    clearInterval(timer);
                    setTimeout(resolve, 300);
                }
            }, interval);
        });
    }

    /**
     * Interactive Theme Preview System
     */
    static async previewThemes(config) {
        const enquirer = require('enquirer');
        const fonts = [
            { name: 'Graceful', desc: '🎯 Professional (Clean & Shadowed)' },
            { name: 'Executive', desc: '💼 Executive (Calvin S - Premium)' },
            { name: 'Engineering', desc: '⚙️  Engineering (Technical)' },
            { name: 'Big', desc: '🔥 Primary Stack (Modern & Bold)' },
            { name: 'Cyberlarge', desc: '⚡ Personality (Hacker / Agent vibe)' },
            { name: 'Straight', desc: '🧪 AI Researcher (Experimental & Dense)' },
            { name: 'Roman', desc: '🧘 Calm (Analytical & Serious)' },
            { name: 'separator', desc: '──────────────────────────────' },
            { name: 'Slant', desc: '🚀 Premium Slant (Classic Modern)' },
            { name: 'Standard', desc: '📏 Standard (Clean & Bold)' },
            { name: 'Small', desc: '🤏 Small (Compact & Efficient)' },
            { name: 'Mini', desc: '🧊 Mini (Ultra Minimalist)' }
        ];

        console.clear();
        console.log(chalk.cyan.bold('\n🎨 SELECT YOUR BRANDING STYLE\n'));

        const choice = await new enquirer.Select({
            message: 'Choose a font for your Lorapok branding:',
            choices: fonts.map(f => {
                if (f.name === 'separator') return { name: 'sep', message: f.desc, role: 'separator' };
                return { name: f.name, message: f.desc };
            }),
            footer: chalk.gray('Use arrows to preview styles...')
        }).run().catch(() => null);

        if (choice) {
            config.setBrandingFont(choice);
            console.clear();
            const version = require('../package.json').version;
            console.log(this.getBranding(choice, 0, version));
            console.log(chalk.green(`\n✅ Theme saved: ${choice}!\n`));
            await new enquirer.Input({ message: 'Press Enter to continue ⏎ ‣' }).run();
        }
    }

    static getLogo(config = null) {
        const font = config ? config.getBrandingFont() : 'Slant';
        return this.getBranding(font);
    }

    static showHeader(version = '1.0.0', model = '', path = '', branch = '', config = null) {
        const font = config ? config.getBrandingFont() : 'Slant';
        const dirName = require('path').basename(path) || path;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        console.clear();
        console.log(this.getBranding(font));
        
        const hr = chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(hr);
        
        const dirInfo = chalk.cyan('📂 ') + chalk.white.bold(dirName);
        const branchInfo = branch ? (chalk.green(' 🌿 ') + chalk.white(branch)) : '';
        const timeInfo = chalk.gray(' ⏱️  ') + chalk.white(now);
        
        const leftSide = `  ${dirInfo}${branchInfo}${timeInfo}`;
        const rightSide = chalk.blue('🧠 ') + chalk.white(model);
        
        // Calculate padding to push model to the right
        const termWidth = process.stdout.columns || 80;
        const leftLen = leftSide.replace(/\u001b\[\d+m/g, '').length;
        const rightLen = rightSide.replace(/\u001b\[\d+m/g, '').length;
        const padLen = Math.max(0, termWidth - leftLen - rightLen - 4);
        
        console.log(leftSide + ' '.repeat(padLen) + rightSide);
        console.log(hr + '\n');
    }

    static showWelcome() {
        console.log(chalk.white.bold('  Quick Start:'));
        console.log(chalk.gray('  • Ask questions or describe tasks.'));
        console.log(chalk.gray('  • Use ') + chalk.cyan('@') + chalk.gray(' to mention files/folders.'));
        console.log(chalk.gray('  • Use ') + chalk.cyan('/') + chalk.gray(' to trigger commands (ex: /git).'));
        console.log(chalk.gray('  • Type ') + chalk.cyan('exit') + chalk.gray(' or ') + chalk.cyan('/q') + chalk.gray(' to quit.\n'));
    }

    static showHelp() {
        const table = new Table({
            head: [chalk.cyan('Command'), chalk.cyan('Description'), chalk.cyan('Aliases')],
            style: { head: [], border: [] },
            colWidths: [15, 45, 15]
        });

        table.push(
            [chalk.white.bold('/chat'), '💬 Interactive AI chat session', 'Enter'],
            [chalk.white.bold('/plan'), '📝 Professional Plan-Execute workflow', 'plan'],
            [chalk.white.bold('/analyze'), '🔍 Deep project structure analysis', 'analyze'],
            [chalk.white.bold('/git'), '🔗 Advanced Git & GitHub Auth suite', 'git'],
            [chalk.white.bold('/actions'), '⚡ GitHub Actions CI/CD monitoring', 'ci, actions'],
            [chalk.white.bold('/files'), '📁 Visual project file explorer', 'files'],
            [chalk.white.bold('/logs'), '📊 Diagnostic system log viewer', 'logs'],
            [chalk.white.bold('/settings'), '⚙️  Customize themes & AI behavior', 'settings'],
            [chalk.white.bold('/clear'), '🧹 Clear terminal screen', 'clear'],
            [chalk.white.bold('/help'), '❓ Show this command reference', '?, help'],
            [chalk.white.bold('/exit'), '❌ Professional session shutdown', 'exit, /q']
        );

        console.log(boxen(
            chalk.cyan.bold(' LORAPOK COMMAND REFERENCE\n\n') + table.toString(),
            { padding: 1, borderStyle: 'round', borderColor: 'cyan' }
        ));
    }

    static showInteractionSummary(sessionData) {
        console.log(chalk.yellow('\n   Returning to hangar...\n'));

        const table = new Table({
            head: [chalk.cyan('📊 Session Metric'), chalk.cyan('Value')],
            style: { head: [], border: ['gray'] },
            colWidths: [25, 25]
        });

        table.push(
            ['Session ID', chalk.white.bold(sessionData.id)],
            ['Interactions', chalk.white(sessionData.count)],
            ['Success Rate', chalk.green.bold(`${sessionData.successRate}%`)],
            ['Prompt Tokens', chalk.gray(sessionData.tokens?.prompt || 0)],
            ['Completion Tokens', chalk.gray(sessionData.tokens?.completion || 0)],
            ['Total Token Usage', chalk.cyan.bold(sessionData.tokens?.total || 0)]
        );

        console.log(boxen(
            table.toString(),
            { 
                title: ' 🏁 SESSION RECAP ', 
                titleAlignment: 'center', 
                padding: 1, 
                borderStyle: 'double', 
                borderColor: 'blue' 
            }
        ));

        console.log(chalk.cyan('\n   Exiting Lorapok. Goodbye! 🐛\n'));
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
                case 'success': statusIcon = chalk.green('🟢 Success'); break;
                case 'failure': statusIcon = chalk.red('🔴 Failure'); break;
                case 'cancelled': statusIcon = chalk.gray('⚪ Cancel'); break;
                case 'skipped': statusIcon = chalk.gray('⚪ Skip'); break;
                default:
                    if (run.status === 'in_progress') statusIcon = chalk.yellow('🟡 Running');
                    else if (run.status === 'queued') statusIcon = chalk.yellow('🟡 Queued');
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
                const icon = job.conclusion === 'success' ? chalk.green('🟢') :
                    job.conclusion === 'failure' ? chalk.red('🔴') :
                        job.status === 'in_progress' ? chalk.yellow('🟡') : chalk.gray('⚪');

                output += `${icon} ${chalk.bold(job.name)} ${chalk.gray(`(${job.steps.length} steps)`)}\n`;

                job.steps.forEach(step => {
                    const stepIcon = step.conclusion === 'success' ? chalk.green('  🟢') :
                        step.conclusion === 'failure' ? chalk.red('  🔴') :
                            step.status === 'in_progress' ? chalk.yellow('  🟡') : chalk.gray('  ⚪');
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
