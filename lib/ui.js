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

    static showPlanning(plan) {
        console.log(chalk.magenta.bold('\n📝 PLANNING\n'));
        console.log(boxen(chalk.white(plan), {
            title: 'Implementation Strategy',
            padding: 1,
            borderStyle: 'double',
            borderColor: 'magenta'
        }));
    }

    static showTasks(tasks) {
        console.log(chalk.yellow.bold('\n📋 TASKS\n'));
        console.log(boxen(chalk.white(tasks), {
            title: 'Checklist',
            padding: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
    }

    static showWalkthrough(walkthrough) {
        console.log(chalk.green.bold('\n🚀 WALKTHROUGH\n'));
        console.log(boxen(chalk.white(walkthrough), {
            title: 'Completion Report',
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
}

module.exports = TerminalUI;
