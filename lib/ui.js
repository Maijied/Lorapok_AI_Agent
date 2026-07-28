/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

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
    // Frame 0: Normal — Caterpillar with antennae & glasses
    [
        "     (⊙)   (⊙)    ",
        "      │     │     ",
        "    ╭─┴─────┴─╮   ",
        "  ╭─┤  ⌐■_■   ├─╮ ",
        " ╭┴─┴─────────┴─┴╮",
        "(  (  )(  )(  )  )",
        " ╰───────────────╯"
    ],
    // Frame 1: Blink — Eyes closed
    [
        "     (⊙)   (⊙)    ",
        "      │     │     ",
        "    ╭─┴─────┴─╮   ",
        "  ╭─┤  - _ -  ├─╮ ",
        " ╭┴─┴─────────┴─┴╮",
        "(  (  )(  )(  )  )",
        " ╰───────────────╯"
    ],
    // Frame 2: Look Left
    [
        "     (●)   (●)    ",
        "      │     │     ",
        "    ╭─┴─────┴─╮   ",
        "  ╭─┤ ⌐■_■    ├─╮ ",
        " ╭┴─┴─────────┴─┴╮",
        "(  (  )(  )(  )  )",
        " ╰───────────────╯"
    ],
    // Frame 3: Look Right
    [
        "     (●)   (●)    ",
        "      │     │     ",
        "    ╭─┴─────┴─╮   ",
        "  ╭─┤    ⌐■_■ ├─╮ ",
        " ╭┴─┴─────────┴─┴╮",
        "(  (  )(  )(  )  )",
        " ╰───────────────╯"
    ]
];

/**
 * Terminal UI formatting and rendering helper system.
 */
class TerminalUI {
    /**
     * Generate terminal branding header box.
     * @param {string} [font='Slant'] - Branding font theme name
     * @param {number} [bugFrame=0] - Active caterpillar animation frame index
     * @param {string} [version='1.0.0'] - CLI version string
     * @param {string} [model=''] - Active model name
     * @param {string} [pathStr=''] - Active workspace path
     * @returns {string} Formatted header box string
     */
    static getBranding(font = 'Slant', bugFrame = 0, version = '1.0.0', model = '', pathStr = '') {
        const FRAMES = {
            round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
            double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
            single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
            bold: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' }
        };

        const THEMES = {
            'Slant': {
                font: 'Slant',
                style: 'round',
                border: chalk.yellow,
                text: chalk.yellow.bold,
                bug: chalk.cyan,
                welcome: chalk.white
            },
            'Graceful': {
                font: 'Graceful',
                style: 'round',
                border: chalk.cyan,
                text: chalk.cyan.bold,
                bug: chalk.green,
                welcome: chalk.white
            },
            'Executive': {
                font: 'Standard',
                style: 'double',
                border: chalk.blue,
                text: chalk.blue.bold,
                bug: chalk.yellow,
                welcome: chalk.white
            },
            'Engineering': {
                font: 'ANSI Shadow',
                style: 'bold',
                border: chalk.green,
                text: chalk.green.bold,
                bug: chalk.cyan,
                welcome: chalk.white
            },
            'Big': {
                font: 'Big',
                style: 'round',
                border: chalk.magenta,
                text: chalk.magenta.bold,
                bug: chalk.yellow,
                welcome: chalk.white
            },
            'Cyberlarge': {
                font: 'Cyberlarge',
                style: 'double',
                border: chalk.hex('#00FFCC'),
                text: chalk.hex('#00FFCC').bold,
                bug: chalk.hex('#FF007F'),
                welcome: chalk.white
            },
            'Mini': {
                font: 'Mini',
                style: 'single',
                border: chalk.white,
                text: chalk.white.bold,
                bug: chalk.gray,
                welcome: chalk.gray
            },
            'Roman': {
                font: 'Small Shadow',
                style: 'double',
                border: chalk.hex('#FF3333'),
                text: chalk.hex('#FF3333').bold,
                bug: chalk.hex('#FF9900'),
                welcome: chalk.white
            }
        };

        const theme = THEMES[font] || THEMES['Slant'];
        const border = theme.border;
        const frame = FRAMES[theme.style] || FRAMES.round;
        const textColor = theme.text;
        const bugColor = theme.bug;
        const welcomeColor = theme.welcome || chalk.white;

        let text1, text2;
        try {
            text1 = figlet.textSync('LORAPOK', { font: theme.font });
            text2 = figlet.textSync('CLI', { font: theme.font });
        } catch (e) {
            text1 = figlet.textSync('LORAPOK', { font: 'Small' });
            text2 = figlet.textSync('CLI', { font: 'Small' });
        }

        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');

        const maxH = Math.max(lines1.length, lines2.length);
        const trimmed1 = lines1.map(l => l.trimRight());
        const trimmed2 = lines2.map(l => l.trimRight());
        const maxW1 = Math.max(...trimmed1.map(l => l.length));

        const space = "      ";
        const brandingLines = [];

        for (let i = 0; i < maxH; i++) {
            const part1 = (trimmed1[i] || '').padEnd(maxW1, ' ');
            const part2 = trimmed2[i] || '';
            brandingLines.push(textColor(part1 + space + part2));
        }

        const welcomeLine = welcomeColor("   Welcome to Lorapok");
        const detailsLine = model
            ? (chalk.white.bold("   🐛 EXPERT CODING AGENT ") + chalk.gray(`v${version}   `) + chalk.magenta("🧠 ") + chalk.cyan.bold(model))
            : chalk.gray(`   CLI Version ${version}`);
        const pathLine = pathStr ? chalk.gray(`   📂 ${pathStr}`) : "";

        let leftBlock = [
            "",
            welcomeLine,
            "",
            ...brandingLines,
            "",
            detailsLine,
            ...(pathLine ? [pathLine] : []),
            ""
        ];

        const rawLarvaLines = LARVA_FRAMES[bugFrame % LARVA_FRAMES.length];
        const larvaLines = rawLarvaLines.map(l => bugColor(l));

        const stripAnsi = (str) => (str || '').replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');

        const leftWidth = Math.max(...leftBlock.map(l => stripAnsi(l).length));
        const totalRows = Math.max(leftBlock.length, larvaLines.length);

        const leftOffset = Math.floor((totalRows - leftBlock.length) / 2);
        const rightOffset = Math.floor((totalRows - larvaLines.length) / 2);

        let contentRows = [];
        for (let i = 0; i < totalRows; i++) {
            let rawLeft = '';
            if (i >= leftOffset && i < leftOffset + leftBlock.length) {
                rawLeft = leftBlock[i - leftOffset] || '';
            }

            const rawLeftLen = stripAnsi(rawLeft).length;
            const padLen = leftWidth - rawLeftLen;
            const paddedLeft = rawLeft + ' '.repeat(padLen);

            let right = '';
            if (i >= rightOffset && i < rightOffset + larvaLines.length) {
                right = larvaLines[i - rightOffset] || '';
            }

            contentRows.push(paddedLeft + "     " + right);
        }

        const contentWidth = Math.max(...contentRows.map(l => stripAnsi(l).length));
        const topFrame = border(frame.tl + frame.h.repeat(contentWidth + 2) + frame.tr);
        const bottomFrame = border(frame.bl + frame.h.repeat(contentWidth + 2) + frame.br);

        const boxedContent = contentRows.map(row => {
            const rowLen = stripAnsi(row).length;
            const pad = contentWidth - rowLen;
            return border(frame.v) + ' ' + row + ' '.repeat(pad) + ' ' + border(frame.v);
        }).join('\n');

        return topFrame + '\n' + boxedContent + '\n' + bottomFrame;
    }

    /**
     * Animate Bug Logo frames on CLI startup.
     * @param {number} [duration=1500] - Animation duration in milliseconds
     * @param {string} [font='Slant'] - Branding font theme
     * @param {string} [version='1.0.0'] - CLI version string
     * @returns {Promise<void>}
     */
    static async animateLogo(duration = 1500, font = 'Slant', version = '1.0.0') {
        const frames = [0, 1, 2, 3];
        let i = 0;
        const interval = 120;
        const totalSteps = Math.floor(duration / interval);

        return new Promise(resolve => {
            const timer = setInterval(() => {
                console.clear();
                const frameIdx = frames[i % frames.length];
                console.log(this.getBranding(font, frameIdx, version));
                i++;
                if (i >= totalSteps) {
                    clearInterval(timer);
                    setTimeout(resolve, 100);
                }
            }, interval);
        });
    }

    /**
     * Interactive CLI theme preview and configuration menu.
     * @param {Object} config - LorapokConfig instance
     * @returns {Promise<void>}
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
            console.clear();
            const version = require('../package.json').version;
            console.log(this.getBranding(choice, 0, version));

            const confirmTheme = new enquirer.Select({
                message: `Apply & save theme '${choice}'?`,
                choices: [
                    { name: 'save', message: `🟢 Apply & Save '${choice}' Theme` },
                    { name: 'reject', message: '❌ Reject / Cancel (Keep Current Theme)' }
                ],
                result(name) { return this.map(name)[name]; }
            });

            const action = await confirmTheme.run().catch(() => 'reject');
            if (action === 'save') {
                config.setBrandingFont(choice);
                console.log(chalk.green(`\n✅ Theme saved: ${choice}!\n`));
            } else {
                console.log(chalk.yellow(`\n⚠️ Theme change rejected. Kept current theme.\n`));
            }
            await new enquirer.Input({ message: 'Press Enter to continue ⏎' }).run().catch(() => null);
        }
    }

    /**
     * Get logo string for active configuration theme.
     * @param {Object|null} [config=null] - LorapokConfig instance
     * @returns {string} Logo string
     */
    static getLogo(config = null) {
        const font = config ? config.getBrandingFont() : 'Slant';
        return this.getBranding(font);
    }

    /**
     * Render main CLI application header banner.
     * @param {string} [version='1.0.0'] - Application version string
     * @param {string} [model=''] - Active model identifier
     * @param {string} [path=''] - Active workspace path
     * @param {Object|null} [config=null] - Config manager
     * @returns {void}
     */
    static showHeader(version = '1.0.0', model = '', path = '', config = null) {
        const font = config ? config.getBrandingFont() : 'Slant';
        console.clear();
        console.log(this.getBranding(font, 0, version, model, path) + '\n');
    }

    /**
     * Display quick start welcome instructions.
     * @returns {void}
     */
    static showWelcome() {
        console.log(chalk.cyan('  Built with 🐛 by Lorapok Labs (https://lorapok.tech)\n'));
        console.log(chalk.white.bold('  Quick Start & Key Features:'));
        console.log(chalk.gray('  • Ask questions, generate code, or describe multi-step coding objectives.'));
        console.log(chalk.gray('  • Use ') + chalk.cyan('@') + chalk.gray(' to attach workspace files/folders into AI context.'));
        console.log(chalk.gray('  • Use ') + chalk.cyan('/') + chalk.gray(' to trigger interactive commands (ex: /bypass, /git, /plan).'));
        console.log(chalk.gray('  • Use ') + chalk.green('/bypass') + chalk.gray(' or ') + chalk.green('-y') + chalk.gray(' flag for Auto-Approve mode (no permission prompts).'));
        console.log(chalk.gray('  • Double ') + chalk.yellow('Ctrl+C') + chalk.gray(' or type ') + chalk.cyan('exit') + chalk.gray(' to quit safely.\n'));
    }

    /**
     * Display command reference guide table.
     * @returns {void}
     */
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
            [chalk.white.bold('/bypass'), '🚀 Toggle Auto-Approve / Bypass mode', 'yolo, -y'],
            [chalk.white.bold('/git'), '🔗 Advanced Git & GitHub Auth suite', 'git'],
            [chalk.white.bold('/actions'), '⚡ GitHub Actions CI/CD monitoring', 'ci, actions'],
            [chalk.white.bold('/files'), '📁 Visual project file explorer', 'files'],
            [chalk.white.bold('/logs'), '📊 Diagnostic system log viewer', 'logs'],
            [chalk.white.bold('/settings'), '⚙️  Customize themes & AI behavior', 'settings'],
            [chalk.white.bold('/model'), '🧠 View, switch, or list AI models', 'models'],
            [chalk.white.bold('/guide'), '📖 Detailed user manual & workflow guide', 'guide, howtouse'],
            [chalk.white.bold('/clear'), '🧹 Clear terminal screen', 'clear'],
            [chalk.white.bold('/help'), '❓ Show this command reference', '?, help'],
            [chalk.white.bold('/exit'), '❌ Professional session shutdown', 'exit, /q']
        );


        console.log(boxen(
            chalk.cyan.bold(' LORAPOK COMMAND REFERENCE\n\n') + table.toString(),
            { padding: 1, borderStyle: 'round', borderColor: 'cyan' }
        ));
    }

    /**
     * Render comprehensive user guide and workflow manual box.
     * @returns {void}
     */
    static showHowToUse() {
        let content = chalk.cyan.bold('📖 LORAPOK AI CODING AGENT — USER GUIDE & WORKFLOW MANUAL\n\n');

        content += `${chalk.yellow.bold('1. 🔑 API Key & Authentication Setup')}\n`;
        content += `${chalk.gray('  • Lorapok supports Google AI Studio (Gemini), OpenRouter (Claude, DeepSeek, GPT-4o, Llama) & Perplexity.')}\n`;
        content += `${chalk.gray('  • Run ')}${chalk.cyan('/settings')}${chalk.gray(' -> ')}${chalk.cyan('🔑 Update API Key')}${chalk.gray(' or add keys to your local ')}${chalk.white('.env')}${chalk.gray(' file:')}\n`;
        content += `${chalk.green('    GEMINI_API_KEY=AIzaSy...')}\n`;
        content += `${chalk.green('    OPENROUTER_API_KEY=sk-or-v1-...')}\n`;
        content += `${chalk.green('    PERPLEXITY_API_KEY=pplx-...')}\n\n`;

        content += `${chalk.yellow.bold('2. 🧠 Selecting & Switching AI Models')}\n`;
        content += `${chalk.gray('  • Type ')}${chalk.cyan('/model')}${chalk.gray(' to open category-filtered model picker:')}\n`;
        content += `${chalk.gray('    💻 Coding & Engineering | 🔬 Logic & Reasoning | 🔍 Web Research | ⚡ Fast')}\n`;
        content += `${chalk.gray('  • Run ')}${chalk.cyan('/model info')}${chalk.gray(' to inspect current active model specs and session token stats.')}\n`;
        content += `${chalk.gray('  • Start Lorapok with flag: ')}${chalk.cyan('lorapok -m anthropic/claude-3.5-sonnet')}\n\n`;

        content += `${chalk.yellow.bold('3. 💬 Context Mentions & Workspace Awareness')}\n`;
        content += `${chalk.gray('  • Mention specific files or folders in your prompt using ')}${chalk.cyan('@')}${chalk.gray(' syntax:')}\n`;
        content += `${chalk.white('    "Refactor @lib/agent.js to optimize memory usage"')}\n`;
        content += `${chalk.white('    "Explain package structure in @src/components"')}\n\n`;

        content += `${chalk.yellow.bold('4. 🚀 Proactive Actions Engine & Diffs')}\n`;
        content += `${chalk.gray('  • Lorapok automatically proposes file edits and bash commands in code viewports.')}\n`;
        content += `${chalk.gray('  • Review side-by-side diffs and select ')}${chalk.green('Yes')}${chalk.gray(' to apply or ')}${chalk.red('No')}${chalk.gray(' to reject.')}\n`;
        content += `${chalk.gray('  • Enable Auto-Approve mode with ')}${chalk.cyan('/bypass')}${chalk.gray(' or startup flag ')}${chalk.cyan('lorapok -y')}\n\n`;

        content += `${chalk.yellow.bold('5. 📝 Pro Engineering Workflow (/plan)')}\n`;
        content += `${chalk.gray('  • Run ')}${chalk.cyan('/plan')}${chalk.gray(' -> enter objective -> Lorapok generates an Implementation Strategy.')}\n`;
        content += `${chalk.gray('  • Executes step-by-step tasks checklist and outputs final Walkthrough report.')}\n\n`;

        content += `${chalk.yellow.bold('6. 🔗 DevOps & Git Operations')}\n`;
        content += `${chalk.gray('  • ')}${chalk.cyan('/git')}${chalk.gray(': Switch branches, review commit history, manage remotes, & auth tokens.')}\n`;
        content += `${chalk.gray('  • ')}${chalk.cyan('/actions')}${chalk.gray(': Monitor GitHub Actions CI/CD runs and detailed job step logs.')}\n`;
        content += `${chalk.gray('  • ')}${chalk.cyan('/cache')}${chalk.gray(': Inspect hit rate & saved tokens from LLM response cache.')}\n\n`;

        content += `${chalk.yellow.bold('7. 🏁 Exit Summary & Multi-Model Breakdown')}\n`;
        content += `${chalk.gray('  • Type ')}${chalk.cyan('exit')}${chalk.gray(', ')}${chalk.cyan('/q')}${chalk.gray(', or press ')}${chalk.yellow('Ctrl+C')}${chalk.gray(' twice to quit cleanly.')}\n`;
        content += `${chalk.gray('  • Displays multi-model token usage breakdown table across all models used.')}\n`;

        console.log(boxen(content, {
            title: chalk.cyan.bold(' 📖 LORAPOK USER MANUAL '),
            padding: 1,
            borderStyle: 'double',
            borderColor: 'cyan'
        }));
    }


    /**
     * Resolve icon emoji for a target file path or directory.
     * @param {string} filePath - Path or name of file
     * @param {boolean} [isDirectory=false] - True if target is a directory
     * @returns {string} Icon emoji string
     */
    /**
     * Resolve icon emoji for a target file path or directory.
     * @param {string} filePath - Path or name of file
     * @param {boolean} [isDirectory=false] - True if target is a directory
     * @returns {string} Icon emoji string
     */
    static getFileIcon(filePath, isDirectory = false) {
        if (isDirectory) return '📁';
        const filename = String(filePath || '').split('/').pop().toLowerCase();
        const ext = filename.includes('.') ? filename.split('.').pop() : '';

        // Special filenames & project configuration manifests
        if (filename === 'package.json' || filename === 'package-lock.json' || filename === 'pnpm-lock.yaml' || filename === 'yarn.lock' || filename === 'bun.lockb') return '📦';
        if (filename.includes('tsconfig') || filename.includes('jsconfig') || filename.includes('config') || filename.startsWith('.eslintrc') || filename.startsWith('.prettierrc') || filename.startsWith('.babelrc')) return '⚙️';
        if (filename.includes('docker') || filename === 'dockerfile') return '🐳';
        if (filename === '.gitignore' || filename === '.gitattributes' || filename === '.gitmodules' || filename.startsWith('.env')) return '🔒';
        if (filename.includes('readme') || filename.includes('license') || filename.includes('changelog')) return '📖';
        if (filename === 'cargo.toml' || filename === 'cargo.lock') return '🦀';
        if (filename === 'go.mod' || filename === 'go.sum') return '🐹';
        if (filename === 'requirements.txt' || filename === 'pipfile' || filename === 'pyproject.toml') return '🐍';
        if (filename === 'pom.xml' || filename === 'build.gradle' || filename === 'settings.gradle') return '☕';
        if (filename === 'composer.json' || filename === 'composer.lock') return '🐘';

        // Extension-based mapping across all language families
        switch (ext) {
            case 'js':
            case 'mjs':
            case 'cjs':
                return '⚡';
            case 'jsx':
            case 'tsx':
                return '⚛️';
            case 'ts':
                return '📘';
            case 'vue':
                return '🟢';
            case 'svelte':
                return '🔥';
            case 'html':
            case 'htm':
                return '🌐';
            case 'css':
            case 'scss':
            case 'sass':
            case 'less':
            case 'styl':
                return '🎨';
            case 'json':
            case 'json5':
                return '📋';
            case 'py':
            case 'pyc':
            case 'pyd':
            case 'pyw':
            case 'ipynb':
                return '🐍';
            case 'rs':
                return '🦀';
            case 'go':
                return '🐹';
            case 'java':
            case 'jar':
            case 'class':
                return '☕';
            case 'kt':
            case 'kts':
                return '🎯';
            case 'swift':
                return '🐦';
            case 'c':
            case 'h':
                return '🔤';
            case 'cpp':
            case 'hpp':
            case 'cc':
            case 'cxx':
                return '➕';
            case 'cs':
            case 'csproj':
            case 'sln':
                return '🟣';
            case 'php':
                return '🐘';
            case 'rb':
            case 'erb':
            case 'gem':
                return '💎';
            case 'ex':
            case 'exs':
            case 'erl':
                return '💧';
            case 'scala':
                return '🔴';
            case 'hs':
            case 'lhs':
                return '💜';
            case 'lua':
                return '🌙';
            case 'dart':
                return '🎯';
            case 'r':
            case 'rmd':
                return '📊';
            case 'jl':
                return '🟣';
            case 'pl':
            case 'pm':
                return '🐪';
            case 'sh':
            case 'bash':
            case 'zsh':
            case 'fish':
            case 'ps1':
                return '🐚';
            case 'sql':
            case 'db':
            case 'sqlite':
            case 'sqlite3':
            case 'prisma':
                return '🗄️';
            case 'graphql':
            case 'gql':
                return '📐';
            case 'toml':
                return '⚙️';
            case 'ini':
            case 'cfg':
            case 'conf':
                return '🔧';
            case 'csv':
            case 'tsv':
                return '📊';
            case 'yml':
            case 'yaml':
                return '🔧';
            case 'xml':
            case 'svg':
                return '🎨';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'ico':
            case 'webp':
            case 'bmp':
            case 'avif':
            case 'tiff':
                return '🖼️';
            case 'mp3':
            case 'wav':
            case 'ogg':
            case 'flac':
            case 'm4a':
            case 'aac':
                return '🎵';
            case 'mp4':
            case 'webm':
            case 'mkv':
            case 'avi':
            case 'mov':
            case 'wmv':
                return '🎬';
            case 'ttf':
            case 'otf':
            case 'woff':
            case 'woff2':
            case 'eot':
                return '🔤';
            case 'zip':
            case 'tar':
            case 'gz':
            case '7z':
            case 'rar':
            case 'bz2':
                return '📦';
            case 'pdf':
                return '📕';
            case 'doc':
            case 'docx':
                return '📘';
            case 'xls':
            case 'xlsx':
                return '📊';
            case 'ppt':
            case 'pptx':
                return '📙';
            default:
                return '📄';
        }
    }

    /**
     * Display session recap and token usage metrics table on session exit.
     * @param {Object} sessionData - Session metrics data
     * @returns {void}
     */
    static showInteractionSummary(sessionData) {
        const FAREWELLS = [
            '👋 Agent powering down. Goodbye! 🐛',
            '✨ Returning to hangar. Catch you on the next commit! 🚀',
            '🐛 Lorapok shutting down cleanly. See you next time!',
            '👋 All engines offline. Happy coding! 💻',
            '🌟 Session completed. Until next time, developer! 🚀',
            '👋 Goodbye! Lorapok is always here when you need code done. 🐛',
            '⚡ Powering off. Keep building great things! 🛠️'
        ];
        const farewell = FAREWELLS[Math.floor(Math.random() * FAREWELLS.length)];
        console.log(chalk.yellow(`\n   ${farewell}\n`));

        const table = new Table({
            head: [chalk.cyan('📊 Session Metric'), chalk.cyan('Value')],
            style: { head: [], border: ['gray'] },
            colWidths: [25, 25]
        });

        table.push(
            ['Session ID', chalk.white.bold(sessionData.id)],
            ['Interactions', chalk.white(sessionData.count)],
            ['Success Rate', chalk.green.bold(`${sessionData.successRate}%`)],
            ['Prompt Tokens', chalk.gray(sessionData.tokens?.prompt ? sessionData.tokens.prompt.toLocaleString() : 0)],
            ['Completion Tokens', chalk.gray(sessionData.tokens?.completion ? sessionData.tokens.completion.toLocaleString() : 0)],
            ['Total Token Usage', chalk.cyan.bold(sessionData.tokens?.total ? sessionData.tokens.total.toLocaleString() : 0)]
        );

        let summaryContent = table.toString();

        const modelUsageKeys = Object.keys(sessionData.modelUsage || {});
        if (modelUsageKeys.length > 0) {
            const modelTable = new Table({
                head: [chalk.cyan('Model'), chalk.cyan('Reqs'), chalk.cyan('Prompt'), chalk.cyan('Completion'), chalk.cyan('Total Tokens')],
                style: { head: [], border: ['gray'] }
            });

            for (const key of modelUsageKeys) {
                const item = sessionData.modelUsage[key];
                modelTable.push([
                    chalk.bold(item.name || key),
                    chalk.white(item.requests || 1),
                    chalk.gray((item.prompt || 0).toLocaleString()),
                    chalk.gray((item.completion || 0).toLocaleString()),
                    chalk.cyan.bold((item.total || 0).toLocaleString())
                ]);
            }

            summaryContent += '\n\n' + chalk.magenta.bold(' 🧠 MULTI-MODEL TOKEN USAGE BREAKDOWN\n') + modelTable.toString();
        }

        console.log(boxen(
            summaryContent,
            { 
                title: ' 🏁 SESSION RECAP ', 
                titleAlignment: 'center', 
                padding: 1, 
                borderStyle: 'double', 
                borderColor: 'blue' 
            }
        ));


        console.log(chalk.cyan(`\n   Exiting Lorapok. ${farewell}\n`));
    }

    /**
     * Render workflow implementation plan display.
     * @param {string} plan - Markdown plan string
     * @returns {Promise<void>}
     */
    static async showPlanning(plan) {
        const { renderMarkdownSync } = require('./renderer');
        const termWidth = Math.min(process.stdout.columns || 90, 100);
        const titleStr = ' 📝 PLANNING — Implementation Strategy ';
        const availWidth = Math.max(0, termWidth - titleStr.length - 2);
        const leftLen = Math.floor(availWidth / 2);
        const rightLen = Math.ceil(availWidth / 2);

        const topBorder = chalk.magenta.bold('╔' + '═'.repeat(leftLen) + titleStr + '═'.repeat(rightLen) + '╗');
        const bottomBorder = chalk.magenta.bold('╚' + '═'.repeat(termWidth - 2) + '╝');

        console.log('\n' + topBorder + '\n');
        console.log(renderMarkdownSync(plan));
        console.log(bottomBorder + '\n');
    }

    /**
     * Render workflow tasks checklist display.
     * @param {string} tasks - Markdown tasks checklist string
     * @returns {Promise<void>}
     */
    static async showTasks(tasks) {
        const { renderMarkdownSync } = require('./renderer');
        const termWidth = Math.min(process.stdout.columns || 90, 100);
        const titleStr = ' 📋 TASKS — Implementation Checklist ';
        const availWidth = Math.max(0, termWidth - titleStr.length - 2);
        const leftLen = Math.floor(availWidth / 2);
        const rightLen = Math.ceil(availWidth / 2);

        const topBorder = chalk.yellow.bold('╔' + '═'.repeat(leftLen) + titleStr + '═'.repeat(rightLen) + '╗');
        const bottomBorder = chalk.yellow.bold('╚' + '═'.repeat(termWidth - 2) + '╝');

        console.log('\n' + topBorder + '\n');
        console.log(renderMarkdownSync(tasks));
        console.log(bottomBorder + '\n');
    }

    /**
     * Render workflow completion report display.
     * @param {string} walkthrough - Markdown walkthrough report string
     * @returns {Promise<void>}
     */
    static async showWalkthrough(walkthrough) {
        const { renderMarkdownSync } = require('./renderer');
        const termWidth = Math.min(process.stdout.columns || 90, 100);
        const titleStr = ' 🚀 WALKTHROUGH — Completion Report ';
        const availWidth = Math.max(0, termWidth - titleStr.length - 2);
        const leftLen = Math.floor(availWidth / 2);
        const rightLen = Math.ceil(availWidth / 2);

        const topBorder = chalk.green.bold('╔' + '═'.repeat(leftLen) + titleStr + '═'.repeat(rightLen) + '╗');
        const bottomBorder = chalk.green.bold('╚' + '═'.repeat(termWidth - 2) + '╝');

        console.log('\n' + topBorder + '\n');
        console.log(renderMarkdownSync(walkthrough));
        console.log(bottomBorder + '\n');
    }

    /**
     * Create custom animated spinner with bug frames.
     * @param {string} [text='Lorapok Thinking...'] - Loading text message
     * @returns {Object} Ora spinner instance
     */
    static createSpinner(text = 'Lorapok Thinking...') {
        return ora({
            text: chalk.gray(text),
            spinner: {
                interval: 80,
                frames: ['🐛', '🐌', '🦋', '🐞', '🦗']
            }
        });
    }

    /**
     * Format error message with red icon prefix.
     * @param {string} msg - Error message text
     * @returns {string} Formatted error string
     */
    static formatError(msg) {
        return chalk.red(`\n❌ ${msg}`);
    }

    /**
     * Format success message with green icon prefix.
     * @param {string} msg - Success message text
     * @returns {string} Formatted success string
     */
    static formatSuccess(msg) {
        return chalk.green.bold(`\n✅ ${msg}`);
    }

    /**
     * Truncate long code strings to specified line count with center ellipsis.
     * @param {string} code - Source code string
     * @param {number} [lines=10] - Maximum visible line threshold
     * @returns {string} Truncated code string
     */
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

    /**
     * Hide code blocks in AI response if they exceed line threshold (excluding trees/logs).
     * @param {string} content - Markdown content
     * @param {number} [threshold=50] - Line count threshold
     * @returns {string} Processed content
     */
    static hideLongCodeBlocks(content, threshold = 50) {
        const codeBlockRegex = /```[^\n\r]*\r?\n([\s\S]*?)```/g;
        return content.replace(codeBlockRegex, (match, code) => {
            const lines = code.trim().split('\n');

            const isTree = (code.match(/├──/g) || []).length > 3 || (code.match(/└──/g) || []).length > 3;
            const isLog = (code.match(/\d{4}-\d{2}-\d{2}T/g) || []).length > 3;

            if (isTree || isLog || lines.length <= threshold) {
                return match;
            }

            return `\n${chalk.gray(`[... ${lines.length} lines of code hidden ...]`)}\n${chalk.cyan(`(Use /logs or apply actions to see more)`)}\n`;
        });
    }

    /**
     * Render side-by-side / line-by-line diff preview box for proposed file changes.
     * @param {string} filePath - Path to file being modified
     * @param {string} oldContent - Original file content
     * @param {string} newContent - Proposed new file content
     * @returns {void}
     */
    static showDiff(filePath, oldContent, newContent) {
        console.log(chalk.cyan.bold(`\n📝 PROPOSED CHANGES: `) + chalk.yellow(filePath));

        const oldLines = oldContent ? oldContent.split('\n') : [];
        const newLines = newContent ? newContent.split('\n') : [];

        let output = '';
        const maxLines = Math.max(oldLines.length, newLines.length);

        let addedEllipsis = false;
        for (let i = 0; i < maxLines; i++) {
            if (oldLines[i] !== newLines[i]) {
                if (oldLines[i] !== undefined) {
                    output += chalk.red(`- L${i + 1}: ${oldLines[i]}\n`);
                }
                if (newLines[i] !== undefined) {
                    output += chalk.green(`+ L${i + 1}: ${newLines[i]}\n`);
                }
                addedEllipsis = false;
            } else if (oldLines[i] !== undefined) {
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

    /**
     * Show edit status notification line.
     * @param {string} action - Action name (CREATE, UPDATE, DELETE)
     * @param {string} file - Targeted file path
     * @param {string} [range=''] - Optional line range string
     * @returns {void}
     */
    static showEditStatus(action, file, range = '') {
        console.log(chalk.cyan(`🐛 Agent is ${action.toUpperCase()}: `) + chalk.yellow(file) + chalk.gray(range ? ` (${range})` : ''));
    }

    /**
     * Render proposed shell command execution box.
     * @param {string} description - Description of command purpose
     * @param {string} command - Bash command line
     * @returns {void}
     */
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

    /**
     * Render Git status table.
     * @param {Object} status - Status object containing files array
     * @returns {void}
     */
    static showGitStatus(status) {
        const table = new Table({
            head: [chalk.cyan('File'), chalk.cyan('Status')],
            style: { head: [], border: ['gray'] }
        });

        const files = status.data?.files || status.files || [];
        if (files.length === 0) {
            console.log(chalk.green('\n✨ Clean working directory. Nothing to commit.'));
            return;
        }

        files.forEach(f => {
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

    /**
     * Render Git commit log history box.
     * @param {Array<Object>} commits - List of commit objects
     * @returns {void}
     */
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

    /**
     * Render Git branches list box.
     * @param {Array<Object>} branches - List of branch objects
     * @returns {void}
     */
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

    /**
     * Render Git remotes table box.
     * @param {Array<Object>} remotes - List of remote objects
     * @returns {void}
     */
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

    /**
     * Render Git push/pull sync result box.
     * @param {string} type - Sync type ('Push' or 'Pull')
     * @param {string} remote - Remote name
     * @param {string} branch - Branch name
     * @param {boolean} success - Operation success status
     * @param {string} output - Command output or error string
     * @returns {void}
     */
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

    /**
     * Render Git execution log terminal output in a clean, professional format.
     * @param {string} command - Git command string
     * @param {string} output - Git output string
     * @param {boolean} [success=true] - Success status
     * @returns {void}
     */
    static showGitProcess(command, output, success = true) {
        if (!command) return;

        // Suppress noisy internal read-only checks from visual log clutter
        const internalChecks = [
            'rev-parse',
            'config user.name',
            'config user.email',
            'config --global user.name',
            'config --global user.email',
            'status --porcelain'
        ];

        const isInternalCheck = internalChecks.some(check => command.trim().startsWith(check));

        // Skip internal checks unless they fail
        if (isInternalCheck && success) {
            return;
        }

        const icon = success ? chalk.green('✔') : chalk.red('✖');
        const cleanCmd = chalk.cyan.bold(`git ${command}`);
        const lines = (output || '').trim().split('\n').filter(Boolean);

        // Simple short output (1-2 lines): compact single-line log
        if (lines.length <= 2) {
            const outputText = lines.length > 0 ? chalk.gray(` ‣ ${lines.join(' | ')}`) : chalk.gray(' (Success)');
            console.log(`\n  🔗 ${cleanCmd} ${icon}${outputText}`);
            return;
        }

        // Richer multi-line output (e.g. git log, git status, git diff)
        const header = chalk.gray(`─── 🔗 git ${command} `);
        const footer = chalk.gray('─'.repeat(50));
        console.log(`\n${header}`);
        lines.forEach(line => console.log(`  ${chalk.white(line)}`));
        console.log(`${footer}\n`);
    }

    /**
     * Render Git diagnostics overview card.
     * @param {Object} info - Diagnostics metadata object
     * @returns {void}
     */
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

    /**
     * Render GitHub Actions runs list table.
     * @param {Array<Object>} runs - List of workflow run objects
     * @returns {void}
     */
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

    /**
     * Render detailed job log steps tree for a specific workflow run.
     * @param {Object} run - Workflow run object
     * @param {Array<Object>} jobs - List of job objects
     * @returns {void}
     */
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
