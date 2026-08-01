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
const { getTheme, listThemes, getDefaultThemeId, BOLD_FONT_FALLBACKS } = require('./theme');
const {
    renderLarvaBlock,
    renderAiCodingBadge,
    getLarvaSpinnerFrames,
    renderPromptGlyph,
    getLarvaWidth,
    resolveLogoStyle,
    listLogoStyles
} = require('./larva-art');
const { menuChoice, backChoice } = require('./menu-format');
const MOTTO = 'Lorapok Labs — Expert agents. Code that ships.';

function stripAnsi(str) {
    return String(str || '').replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Dual-tone wordmark: solid fills in primary.bold, edges/shadows in secondary.
 * Makes hollow fonts (3D-ASCII, Slant) and block fonts (ANSI Shadow, Banner3) read as filled.
 */
function colorizeWordmarkLine(line, theme) {
    const fillFn = (theme.chalk.primary && theme.chalk.primary.bold)
        ? theme.chalk.primary.bold
        : theme.chalk.primary;
    const edgeFn = theme.chalk.secondary || theme.chalk.accent || fillFn;
    const softFn = theme.chalk.accent || theme.chalk.primary;
    const FILL = /[█▓▒░▀▄▌▐■▪#]/;
    const EDGE = /[╔╗╚╝║═┌┐└┘│─┬┴┼╭╮╰╯┏┓┗┛┃━]/;
    return String(line).split('').map(ch => {
        if (ch === ' ') return ch;
        if (FILL.test(ch)) return fillFn(ch);
        if (EDGE.test(ch)) return edgeFn(ch);
        if (/\S/.test(ch)) return softFn(ch);
        return ch;
    }).join('');
}

/** Center a multi-line block within terminal columns */
function centerBlock(block, cols) {
    const lines = String(block || '').split('\n');
    const maxW = Math.max(...lines.map(l => stripAnsi(l).length), 0);
    const pad = Math.max(0, Math.floor((Math.min(cols, 120) - maxW) / 2));
    if (pad <= 0) return block;
    return lines.map(l => (l.length ? ' '.repeat(pad) + l : l)).join('\n');
}

/**
 * Pad lines to equal width (ANSI-aware).
 */
function padLines(lines, width) {
    return lines.map(l => {
        const len = stripAnsi(l).length;
        return l + ' '.repeat(Math.max(0, width - len));
    });
}

/**
 * Draw a left-aligned frame around lines without boxen
 * (boxen collapses newlines when content exceeds terminal width).
 */
function frameLines(lines, theme) {
    const frame = theme.frame || {};
    const h = frame.h || '\u2500';
    const v = frame.v || '\u2502';
    const tl = frame.tl || '\u256D';
    const tr = frame.tr || '\u256E';
    const bl = frame.bl || '\u2570';
    const br = frame.br || '\u256F';
    const border = theme.chalk && theme.chalk.border ? theme.chalk.border : (s) => s;
    const width = Math.max(...lines.map(l => stripAnsi(l).length), 1);
    const padded = padLines(lines, width);
    const edge = border(h.repeat(width + 2));
    const out = [
        border(tl) + edge + border(tr),
        ...padded.map(l => border(v) + ' ' + l + ' ' + border(v)),
        border(bl) + edge + border(br)
    ];
    return out.join('\n');
}

/**
 * Measure column where "POK" begins for the active figlet font.
 * Uses width of "LORA" rendered in the same font.
 */
function measurePokColumn(fontName, topLines) {
    try {
        const lora = figlet.textSync('LORA', { font: fontName });
        const loraLines = lora.split('\n').map(l => l.trimRight()).filter(l => l.length);
        if (loraLines.length) {
            return Math.max(...loraLines.map(l => l.length));
        }
    } catch (_) { /* fall through */ }
    const topW = Math.max(...topLines.map(l => l.length), 1);
    return Math.floor(topW * (4 / 7));
}

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
    /**
     * Professional CLI header:
     * themed welcome panel → wordmark + per-theme larva → meta line.
     */
    /**
     * @param {string} [font='Lorapok']
     * @param {number} [bugFrame=0]
     * @param {string} [version='1.0.0']
     * @param {string} [model='']
     * @param {string} [pathStr='']
     * @param {string|Object|null} [logoStyleOrConfig=null] - 'cyber'|'classic' or config with getLogoStyle()
     */
    static getBranding(font = 'Lorapok', bugFrame = 0, version = '1.0.0', model = '', pathStr = '', logoStyleOrConfig = null) {
        const theme = getTheme(font || getDefaultThemeId());
        const cols = process.stdout.columns || 100;

        let logoStyleId = 'classic';
        if (typeof logoStyleOrConfig === 'string') {
            logoStyleId = logoStyleOrConfig;
        } else if (logoStyleOrConfig && typeof logoStyleOrConfig.getLogoStyle === 'function') {
            logoStyleId = logoStyleOrConfig.getLogoStyle();
        }
        const logoStyle = resolveLogoStyle(logoStyleId);
        const isClassic = logoStyle.id === 'classic';

        // Wordmark font comes from the active theme (each theme has a distinct bold face)
        const fontCandidates = [
            theme.font,
            ...(BOLD_FONT_FALLBACKS || [])
        ].filter((f, i, arr) => f && arr.indexOf(f) === i);

        let usedFont = fontCandidates[0] || 'ANSI Shadow';
        let wordTop = 'LORAPOK';
        let wordBottom = null;
        for (const f of fontCandidates) {
            try {
                if (isClassic) {
                    wordTop = figlet.textSync('LORAPOK', { font: f });
                    wordBottom = figlet.textSync('AI', { font: f });
                } else {
                    // Cyber ref: LORAPOK AI on one band (AI beside LORAPOK, not under it)
                    wordTop = figlet.textSync('LORAPOK AI', { font: f });
                    wordBottom = null;
                }
                usedFont = f;
                break;
            } catch (_) { /* try next bold font */ }
        }

        const topLines = wordTop.split('\n').map(l => l.trimRight()).filter((l, i, arr) => l.length || i < arr.length - 1);
        const bottomLines = wordBottom
            ? wordBottom.split('\n').map(l => l.trimRight()).filter((l, i, arr) => l.length || i < arr.length - 1)
            : [];
        const pokStart = measurePokColumn(usedFont, topLines);
        const larvaRaw = renderLarvaBlock(bugFrame, theme, {
            themeId: theme.id,
            columns: cols,
            logoStyle: logoStyle.id
        });
        const larvaW = getLarvaWidth(theme.id, logoStyle.id);
        const topW = Math.max(...topLines.map(l => l.length), 1);
        const pokBlockW = Math.max(1, topW - pokStart);
        const larvaPad = pokStart + Math.max(0, Math.floor((pokBlockW - larvaW) / 2));

        // Left-align welcome (no centering)
        const welcomeInner = theme.color('text', 'Welcome to Lorapok AI') +
            theme.muted(' | ') + theme.color('secondary', MOTTO);
        const welcomeBox = theme.box(welcomeInner, {
            padding: { top: 0, bottom: 0, left: 1, right: 1 }
        });

        const themeLabel = theme.muted(theme.label || theme.id);
        let body = '';
        let showOuterMeta = true;

        if (isClassic) {
            // Classic: LORAPOK → AI | Agent Core| panel | plump larva
            const header = topLines.map(l => colorizeWordmarkLine(l, theme));
            const aiColored = bottomLines.map(l => colorizeWordmarkLine(l, theme));
            const badge = renderAiCodingBadge(theme);
            const badgeW = Math.max(...badge.map(l => stripAnsi(l).length), 1);
            const aiW = Math.max(...aiColored.map(l => stripAnsi(l).length), 0);
            const larvaStart = Math.max(larvaPad, aiW + badgeW + 6);
            const gapStart = aiW + 2;
            const gapEnd = larvaStart;
            const badgeStart = gapStart + Math.max(0, Math.floor((gapEnd - gapStart - badgeW) / 2));

            const bandH = Math.max(aiColored.length, badge.length, larvaRaw.length, 1);
            for (let i = 0; i < bandH; i++) {
                const left = aiColored[i] || '';
                const leftLen = stripAnsi(left).length;
                const mid = badge[i] || '';
                const midLen = mid ? stripAnsi(mid).length : 0;
                const right = larvaRaw[i] || '';
                if (mid) {
                    const pad1 = Math.max(0, badgeStart - leftLen);
                    const pad2 = Math.max(1, larvaStart - badgeStart - midLen);
                    header.push(left + ' '.repeat(pad1) + mid + ' '.repeat(pad2) + right);
                } else {
                    header.push(left + ' '.repeat(Math.max(1, larvaStart - leftLen)) + right);
                }
            }
            const labelPad = larvaStart + Math.max(0, Math.floor((larvaW - stripAnsi(themeLabel).length) / 2));
            header.push(' '.repeat(labelPad) + themeLabel);
            body = header.join('\n');
        } else {
            // Cyber: LORAPOK AI centered in left pane | divider | clear soldier-fly larva
            const wordLines = topLines.map(l => colorizeWordmarkLine(l, theme));
            const wordW = Math.max(...wordLines.map(l => stripAnsi(l).length), 1);
            const emblem = larvaRaw;
            const emblemW = larvaW;
            const gap = 3;
            const divW = 1;
            const bandH = Math.max(wordLines.length, emblem.length, 1);
            const wordTopPad = Math.max(0, Math.floor((bandH - wordLines.length) / 2));
            const emblemTop = Math.max(0, Math.floor((bandH - emblem.length) / 2));
            const divider = theme.muted(theme.frame.v || '\u2502');

            // Build wordmark | emblem rows first
            const pairRows = [];
            for (let i = 0; i < bandH; i++) {
                const wIdx = i - wordTopPad;
                const left = (wIdx >= 0 && wIdx < wordLines.length)
                    ? wordLines[wIdx] + ' '.repeat(Math.max(0, wordW - stripAnsi(wordLines[wIdx]).length))
                    : ' '.repeat(wordW);
                const eIdx = i - emblemTop;
                const right = (eIdx >= 0 && eIdx < emblem.length)
                    ? emblem[eIdx]
                    : ' '.repeat(emblemW);
                const rightPad = ' '.repeat(Math.max(0, emblemW - stripAnsi(right).length));
                pairRows.push(`${left}${' '.repeat(gap)}${divider}${' '.repeat(gap)}${right}${rightPad}`);
            }

            const pairW = Math.max(...pairRows.map(l => stripAnsi(l).length), 1);
            // Horizontally center LORAPOK|larva block in the outer box
            const targetW = Math.max(pairW, Math.min(cols - 4, pairW + 8));
            const lead = Math.max(0, Math.floor((targetW - pairW) / 2));
            const rowsOut = pairRows.map(r => ' '.repeat(lead) + r);

            const splitW = Math.max(...rowsOut.map(l => stripAnsi(l).length), targetW, 1);
            const pathShort = pathStr
                ? (pathStr.length > 42 ? '\u2026' + pathStr.slice(-40) : pathStr)
                : '';
            const footer = theme.sepJoin([
                { text: `Lorapok AI Coding Agent \u00b7 v${version}`, color: 'muted' },
                model ? { text: String(model), color: 'modelBadge' } : null,
                pathShort ? { text: pathShort, color: 'muted' } : null
            ]);
            const footerPlain = stripAnsi(footer);
            const footLead = Math.max(0, Math.floor((splitW - footerPlain.length) / 2));
            rowsOut.push(theme.muted('\u2500'.repeat(splitW)));
            rowsOut.push(' '.repeat(footLead) + footer);

            body = frameLines(rowsOut, theme);
            showOuterMeta = false;
        }

        if (showOuterMeta) {
            const metaLine = '  ' + theme.sepJoin([
                { text: `Lorapok AI Coding Agent \u00b7 v${version}`, color: 'muted' },
                model ? { text: String(model), color: 'modelBadge' } : null,
                pathStr ? { text: pathStr.length > 42 ? '\u2026' + pathStr.slice(-40) : pathStr, color: 'muted' } : null
            ]);
            return welcomeBox + '\n' + body + '\n' + theme.rule() + '\n' + metaLine + '\n';
        }
        return welcomeBox + '\n' + body + '\n';
    }

    static async animateLogo(duration = 600, font = 'Lorapok', version = '1.0.0', config = null) {
        const motion = getTheme(font || getDefaultThemeId()).motion;
        const logoStyle = config && typeof config.getLogoStyle === 'function' ? config.getLogoStyle() : 'classic';
        if (!process.stdout.isTTY || motion === 'off') {
            console.log(this.getBranding(font, 0, version, '', '', logoStyle));
            return;
        }
        const steps = Math.max(1, Math.min(3, Math.floor(duration / 200)));
        for (let i = 0; i < steps; i++) {
            console.clear();
            console.log(this.getBranding(font, i, version, '', '', logoStyle));
            await new Promise(r => setTimeout(r, 180));
        }
    }

    /**
     * Preview & save logo style (cyber vs classic).
     * @param {Object} config
     */
    static async previewLogos(config) {
        const enquirer = require('enquirer');
        const theme = getTheme(config.getBrandingFont());
        const styles = listLogoStyles();
        const current = config.getLogoStyle ? config.getLogoStyle() : 'cyber';

        console.clear();
        console.log(theme.panel(theme.primary('Select logo style') + theme.muted('  ·  cyber or classic larva')));
        console.log('');

        const choice = await new enquirer.Select({
            message: 'Logo',
            choices: [
                ...styles.map(s => ({
                    name: s.id,
                    message: s.id === current
                        ? `  ${s.label}  ·  current`
                        : `  ${s.label}  ·  ${s.hint}`
                })),
                backChoice()
            ]
        }).run().catch(() => null);

        if (!choice || choice === 'back') return;

        console.clear();
        const version = require('../package.json').version;
        console.log(this.getBranding(config.getBrandingFont(), 0, version, 'gemini-flash-latest', process.cwd(), choice));
        console.log(theme.muted(`  Preview: ${resolveLogoStyle(choice).label}\n`));

        const action = await new enquirer.Select({
            message: `Apply logo '${choice}'?`,
            choices: [
                menuChoice('save', '✓', `Apply & save '${choice}'`),
                backChoice('reject')
            ]
        }).run().catch(() => 'reject');

        if (action === 'save') {
            config.setLogoStyle(choice);
            console.log(theme.success(`\nLogo style saved: ${choice}\n`));
        } else {
            console.log(theme.warning('\nLogo unchanged.\n'));
        }
        await new enquirer.Input({ message: 'Press Enter to continue' }).run().catch(() => null);
    }

    /**
     * Interactive CLI theme preview and configuration menu.
     * @param {Object} config - LorapokConfig instance
     * @returns {Promise<void>}
     */
    static async previewThemes(config) {
        const enquirer = require('enquirer');
        const themes = listThemes();
        console.clear();
        const t = getTheme(config.getBrandingFont());
        console.log(t.panel(t.primary('Select Lorapok theme') + t.muted(' | header font, larva, prompt, boxes')));
        console.log('');

        const choice = await new enquirer.Select({
            message: 'Theme',
            choices: [
                ...themes.map(th => ({
                    name: th.id,
                    message: th.id === getDefaultThemeId()
                        ? `  ${th.label} | ${th.font} | default`
                        : `  ${th.label} | ${th.font}`
                })),
                backChoice()
            ]
        }).run().catch(() => null);

        if (!choice || choice === 'back') return;

        console.clear();
        const version = require('../package.json').version;
        console.log(this.getBranding(choice, 0, version, 'gemini-flash-latest', process.cwd(), config));
        const previewTheme = getTheme(choice);
        console.log(previewTheme.muted('  Prompt preview'));
        console.log(previewTheme.rule());
        console.log(previewTheme.statusBar(
            previewTheme.color('text', 'Maizied'),
            previewTheme.color('modelBadge', '\u26A1 gemini-flash-latest') + previewTheme.muted(' | ') + previewTheme.success('100%')
        ));
        console.log(previewTheme.rule());
        console.log('  ' + previewTheme.primary('\u276F') + '\n');

        const action = await new enquirer.Select({
            message: `Apply & save theme '${choice}'?`,
            choices: [
                menuChoice('save', '✓', `Apply & save '${choice}'`),
                backChoice('reject')
            ]
        }).run().catch(() => 'reject');

        if (action === 'save') {
            config.setBrandingFont(choice);
            console.log(previewTheme.success(`\nTheme saved: ${choice}\n`));
        } else {
            console.log(previewTheme.warning(`\nTheme unchanged.\n`));
        }
        await new enquirer.Input({ message: 'Press Enter to continue' }).run().catch(() => null);
    }

    static getLogo(config = null) {
        const font = config ? config.getBrandingFont() : getDefaultThemeId();
        return this.getBranding(font, 0, '1.0.0', '', '', config);
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
        const font = config ? config.getBrandingFont() : getDefaultThemeId();
        console.clear();
        console.log(this.getBranding(font, 0, version, model, path, config) + '\n');
    }

    /**
     * Display quick start welcome instructions.
     * @returns {void}
     */
    static showWelcome(config = null) {
        const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
        console.log(theme.muted('  lorapok.tech') + theme.muted('  ·  ') + theme.muted('type /help for commands\n'));
        console.log(theme.muted('  ') + theme.color('text', '/') + theme.muted(' commands   ') +
            theme.color('text', '@') + theme.muted(' attach files   ') +
            theme.color('text', 'Ctrl+C') + theme.muted(' twice to exit\n'));
    }

    /**
     * Display command reference guide table.
     * @returns {void}
     */
    static showHelp(config = null) {
        const { getCommands } = require('../commands/registry');
        const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
        const cols = process.stdout.columns || 100;
        const cmdW = Math.min(22, Math.max(18, Math.floor(cols * 0.22)));
        const aliasW = Math.min(18, Math.max(12, Math.floor(cols * 0.16)));
        const descW = Math.max(28, cols - cmdW - aliasW - 14);
        const table = new Table({
            head: [theme.color('info', 'Command'), theme.color('info', 'Description'), theme.color('info', 'Aliases')],
            style: { head: [], border: [] },
            colWidths: [cmdW, descW, aliasW],
            wordWrap: true
        });

        const cmds = getCommands().filter(c => c.inAutocomplete !== false || c.inSystemMenu);
        for (const c of cmds) {
            table.push([
                theme.color('text', c.name),
                theme.muted(`${c.icon || '·'} ${c.description}`),
                theme.muted((c.aliases || []).map(a => a.replace(/^\//, '')).join(', ') || '—')
            ]);
        }

        console.log(theme.box(
            theme.color('info', 'LORAPOK COMMAND REFERENCE') + '\n\n' + table.toString(),
            { padding: 1, margin: { top: 1, bottom: 1 } }
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
        content += `${chalk.gray('  • Run ')}${chalk.cyan('/settings')}${chalk.gray(' → ')}${chalk.cyan('Update API Key')}${chalk.gray(' — keys are stored encrypted in ~/.lorapok.')}\n\n`;

        content += `${chalk.yellow.bold('2. 🧠 Selecting & Switching AI Models')}\n`;
        content += `${chalk.gray('  • Type ')}${chalk.cyan('/model')}${chalk.gray(' to open the picker (Currently Usable / Category / Provider / View All).')}\n`;
        content += `${chalk.gray('    Categories: Coding | Reasoning | Research | Agent | Open Weights | Fast | General')}\n`;
        content += `${chalk.gray('  • Paid models appear only under View All → Paid Catalog. Use ')}${chalk.cyan('/refresh-models')}${chalk.gray(' to refresh.')}\n`;
        content += `${chalk.gray('  • Run ')}${chalk.cyan('/model info')}${chalk.gray(' / ')}${chalk.cyan('/model list')}${chalk.gray(' for specs and usable lists.')}\n\n`;

        content += `${chalk.yellow.bold('3. 💬 Context Mentions & Workspace Awareness')}\n`;
        content += `${chalk.gray('  • Type ')}${chalk.cyan('/')}${chalk.gray(' for the slash command palette; type ')}${chalk.cyan('@')}${chalk.gray(' for the file picker.')}\n`;
        content += `${chalk.gray('  • Mention files/folders in prompts with ')}${chalk.cyan('@path')}${chalk.gray(' syntax:')}\n`;
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
    static showInteractionSummary(sessionData, options = {}) {
        const theme = getTheme(options.themeId || getDefaultThemeId());
        const viewOnly = Boolean(options.viewOnly);

        if (!viewOnly) {
            console.log(theme.muted('\n  Session complete. Lorapok Labs — Expert agents. Code that ships.\n'));
        }

        const table = new Table({
            head: [theme.color('info', 'Metric'), theme.color('info', 'Value')],
            style: { head: [], border: [] },
            colWidths: [22, 22]
        });

        table.push(
            ['Session ID', theme.color('text', sessionData.id)],
            ['Interactions', theme.color('text', String(sessionData.count ?? 0))],
            ['Success Rate', theme.success(`${sessionData.successRate ?? 0}%`)],
            ['Prompt Tokens', theme.muted(String(sessionData.tokens?.prompt ? sessionData.tokens.prompt.toLocaleString() : 0))],
            ['Completion', theme.muted(String(sessionData.tokens?.completion ? sessionData.tokens.completion.toLocaleString() : 0))],
            ['Total Tokens', theme.color('info', String(sessionData.tokens?.total ? sessionData.tokens.total.toLocaleString() : 0))]
        );

        let summaryContent = table.toString();

        const modelUsageKeys = Object.keys(sessionData.modelUsage || {});
        if (modelUsageKeys.length > 0) {
            const modelTable = new Table({
                head: [theme.color('info', 'Model'), theme.color('info', 'Reqs'), theme.color('info', 'In'), theme.color('info', 'Out'), theme.color('info', 'Total')],
                style: { head: [], border: [] }
            });

            for (const key of modelUsageKeys) {
                const item = sessionData.modelUsage[key];
                modelTable.push([
                    theme.color('text', item.name || key),
                    String(item.requests || 1),
                    theme.muted((item.prompt || 0).toLocaleString()),
                    theme.muted((item.completion || 0).toLocaleString()),
                    theme.color('info', (item.total || 0).toLocaleString())
                ]);
            }

            summaryContent += '\n\n' + theme.muted('Model usage') + '\n' + modelTable.toString();
        }

        console.log(theme.box(summaryContent, {
            title: theme.color('info', ' SESSION RECAP '),
            titleAlignment: 'center',
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            margin: { top: 0, bottom: viewOnly ? 1 : 0 },
            borderStyle: theme.frame.boxen || 'double'
        }));

        if (!viewOnly) {
            console.log(theme.muted('\n  Exiting Lorapok.\n'));
        }
    }

    /**
     * Render workflow implementation plan display.
     * @param {string} plan - Markdown plan string
     * @returns {Promise<void>}
     */
    static async showPlanning(plan) {
        const { renderMarkdownSync } = require('./renderer');
        const theme = getTheme(getDefaultThemeId());
        console.log(theme.box(
            theme.color('info', 'PLANNING — Implementation Strategy') + '\n\n' + renderMarkdownSync(plan),
            { padding: 1, margin: { top: 1, bottom: 1 }, borderStyle: 'round' }
        ));
    }

    /**
     * Render workflow tasks checklist display.
     * @param {string} tasks - Markdown tasks checklist string
     * @returns {Promise<void>}
     */
    static async showTasks(tasks) {
        const { renderMarkdownSync } = require('./renderer');
        const theme = getTheme(getDefaultThemeId());
        console.log(theme.box(
            theme.warning('TASKS — Implementation Checklist') + '\n\n' + renderMarkdownSync(tasks),
            { padding: 1, margin: { top: 1, bottom: 1 }, borderStyle: 'round' }
        ));
    }

    /**
     * Render workflow completion report display.
     * @param {string} walkthrough - Markdown walkthrough report string
     * @returns {Promise<void>}
     */
    static async showWalkthrough(walkthrough) {
        const { renderMarkdownSync } = require('./renderer');
        const theme = getTheme(getDefaultThemeId());
        console.log(theme.box(
            theme.success('WALKTHROUGH — Completion Report') + '\n\n' + renderMarkdownSync(walkthrough),
            { padding: 1, margin: { top: 1, bottom: 1 }, borderStyle: 'round' }
        ));
    }

    /**
     * Create custom animated spinner with bug frames.
     * @param {string} [text='Lorapok Thinking...'] - Loading text message
     * @returns {Object} Ora spinner instance
     */
    static createSpinner(text = 'Lorapok Thinking...', config = null) {
        const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
        const frames = getLarvaSpinnerFrames(theme);
        const { geekLinesService } = require('../services/GeekLinesService');
        const first = geekLinesService.next();
        const spinner = ora({
            text: theme.muted(first.text),
            spinner: {
                interval: 120,
                frames
            }
        });
        theme.applyToOra(spinner);
        let timer = null;
        const stopAll = () => {
            if (timer) clearTimeout(timer);
            timer = null;
        };
        const schedule = () => {
            if (!spinner.isSpinning) return;
            const line = geekLinesService.next();
            spinner.text = theme.muted(line.text);
            timer = setTimeout(schedule, line.readMs);
        };
        const origStart = spinner.start.bind(spinner);
        spinner.start = (...args) => {
            const s = origStart(...args);
            stopAll();
            timer = setTimeout(schedule, first.readMs);
            return s;
        };
        for (const method of ['stop', 'succeed', 'fail', 'warn', 'info']) {
            if (typeof spinner[method] !== 'function') continue;
            const orig = spinner[method].bind(spinner);
            spinner[method] = (...args) => {
                stopAll();
                return orig(...args);
            };
        }
        return spinner;
    }

    /**
     * Professional boxed agent response — full theme box, no broken left-rail.
     * Markdown is already rendered; boxen wraps the block cleanly.
     */
    static printAgentResponse(renderedMarkdown, config = null) {
        const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
        const body = String(renderedMarkdown || '').trim();
        const cols = Math.min(process.stdout.columns || 80, 100);
        const title = theme.color('info', 'LORAPOK') + theme.muted(' | response');
        console.log(theme.box(`${title}\n${body}`, {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            margin: { top: 1, bottom: 0 },
            borderStyle: theme.frame.boxen || 'round',
            width: Math.max(40, cols - 2)
        }));
    }

    /**
     * Format error message as a professional themed panel.
     * @param {string} msg - Error message text
     * @param {Object|null} [config=null]
     * @returns {string} Formatted error string
     */
    static formatError(msg, config = null) {
        const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
        const cleaned = String(msg || '').replace(/(pplx-|sk-or-|AIza)[A-Za-z0-9_\-]{8,}/g, (m) => m.slice(0, 8) + '…');
        return '\n' + theme.box(
            theme.error('Error') + '\n' + theme.muted(cleaned),
            { padding: { top: 0, bottom: 0, left: 1, right: 1 }, margin: { top: 0, bottom: 0 } }
        );
    }

    /**
     * Format success message with green icon prefix.
     * @param {string} msg - Success message text
     * @returns {string} Formatted success string
     */
    static formatSuccess(msg, config = null) {
        const theme = getTheme(config && config.getBrandingFont ? config.getBrandingFont() : getDefaultThemeId());
        return '\n' + theme.success('✓ ') + theme.color('text', msg);
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
