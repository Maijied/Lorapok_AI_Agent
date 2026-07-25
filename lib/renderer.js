/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');

/**
 * Language display aliases mapping.
 */
const LANG_DISPLAY = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'jsx': 'React JS',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'tsx': 'React TS',
    'json': 'JSON',
    'bash': 'Terminal',
    'sh': 'Shell',
    'shell': 'Shell',
    'yaml': 'YAML',
    'yml': 'YAML',
    'html': 'HTML',
    'css': 'CSS',
    'python': 'Python',
    'py': 'Python',
    'sql': 'SQL',
    'markdown': 'Markdown',
    'md': 'Markdown',
    'dockerfile': 'Dockerfile',
    'docker': 'Docker',
    'go': 'Go',
    'rust': 'Rust',
    'rs': 'Rust',
    'php': 'PHP',
    'rb': 'Ruby',
    'ruby': 'Ruby',
    'java': 'Java',
    'kotlin': 'Kotlin',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'perl': 'Perl',
    'pl': 'Perl',
    'r': 'R',
    'haskell': 'Haskell',
    'hs': 'Haskell',
    'lua': 'Lua',
    'asm': 'Assembly',
    'nasm': 'Assembly',
    'cmake': 'CMake',
    'nix': 'Nix',
    'zig': 'Zig',
    'groovy': 'Groovy',
    'clojure': 'Clojure',
    'clj': 'Clojure',
    'elixir': 'Elixir',
    'ex': 'Elixir',
    'erlang': 'Erlang',
    'erl': 'Erlang',
    'ocaml': 'OCaml',
    'ml': 'OCaml',
    'elm': 'Elm',
    'lisp': 'Lisp',
    'vue': 'Vue.js',
    'svelte': 'Svelte',
    'scss': 'SCSS',
    'sass': 'Sass',
    'less': 'Less',
    'xml': 'XML',
    'toml': 'TOML',
    'graphql': 'GraphQL',
    'gql': 'GraphQL',
    'proto': 'Protocol Buffers',
    'thrift': 'Thrift',
    'julia': 'Julia',
    'sas': 'SAS',
    'solidity': 'Solidity',
    'sol': 'Solidity',
    'pascal': 'Pascal',
    'prolog': 'Prolog',
    'pro': 'Prolog',
    'd': 'D',
    'crystal': 'Crystal',
    'cobol': 'COBOL',
    'c': 'C',
    'cpp': 'C++',
    'cs': 'C#',
    'csharp': 'C#',
    'dart': 'Dart',
    'swift': 'Swift',
    'hcl': 'HCL/Terraform',
    'tf': 'HCL/Terraform',
    'fsharp': 'F#',
    'fs': 'F#',
    'powershell': 'PowerShell',
    'ps1': 'PowerShell',
    'makefile': 'Makefile',
    'diff': 'Diff',
    '': 'Code'
};

let marked = null;
let isInitialized = false;

/**
 * Creates a styled code block box with high-contrast colors and line numbers.
 * @param {string} code - Raw code string
 * @param {string} [lang=''] - Code language tag
 * @returns {string} Formatted code box string for terminal display
 */
function createCodeBox(code, lang = '') {
    const displayLang = LANG_DISPLAY[lang.toLowerCase()] || lang || 'Code';
    const termWidth = process.stdout.columns || 80;
    const width = Math.min(termWidth - 4, 100);
    const lines = code.trim().split('\n');

    const isShell = ['bash', 'sh', 'shell', 'terminal', 'powershell', 'ps1'].includes(lang.toLowerCase());
    const borderChar = isShell ? chalk.greenBright : chalk.cyanBright;
    const codeColor = isShell ? chalk.greenBright : chalk.whiteBright;
    const labelColor = isShell ? chalk.bgGreen.black.bold : chalk.bgCyan.black.bold;

    let output = '\n';

    const labelText = ` ${displayLang.toUpperCase()} `;
    const lineBefore = '─'.repeat(2);
    const lineAfterLen = Math.max(0, width - labelText.length - 4);
    const lineAfter = '─'.repeat(lineAfterLen);

    output += borderChar('  ┌' + lineBefore) + labelColor(labelText) + borderChar(lineAfter + '┐') + '\n';

    lines.forEach((line, i) => {
        const lineNum = chalk.gray(String(i + 1).padStart(3) + ' │ ');
        const maxCodeWidth = width - 9;
        let processedLine = line;

        if (processedLine.length > maxCodeWidth) {
            processedLine = processedLine.substring(0, maxCodeWidth - 3) + '...';
        }

        const padding = ' '.repeat(Math.max(0, maxCodeWidth - processedLine.length));
        output += borderChar('  │') + lineNum + codeColor(processedLine) + padding + borderChar(' │') + '\n';
    });

    output += borderChar('  └' + '─'.repeat(width - 2) + '┘') + '\n';

    return output;
}

/**
 * Initialize dynamic marked terminal renderer.
 * @returns {Promise<boolean>} Success status
 */
async function initRenderer() {
    if (isInitialized) return true;

    try {
        const markedModule = await import('marked');
        const terminalModule = await import('marked-terminal');

        marked = markedModule.marked;
        const TerminalRenderer = terminalModule.markedTerminal || terminalModule.default;

        if (typeof TerminalRenderer !== 'function') {
            throw new Error('TerminalRenderer is not a function');
        }

        marked.use(TerminalRenderer({
            code: (code, lang) => createCodeBox(code, lang),
            blockquote: chalk.gray.italic,
            html: chalk.reset,
            heading: chalk.cyanBright.bold,
            firstHeading: chalk.magentaBright.bold.underline,
            strong: chalk.whiteBright.bold,
            em: chalk.cyanBright.italic,
            codespan: (text) => chalk.bgGray.yellowBright(` ${text} `),
            del: chalk.dim.strikethrough,
            link: chalk.blueBright.underline,
            href: chalk.blueBright.underline,
            width: process.stdout.columns || 100,
            reflowText: true,
            showSectionPrefix: true,
            unescape: true,
            emoji: true,
            tab: 2,
            listitem: (text) => chalk.whiteBright('  • ') + text
        }));

        isInitialized = true;
        return true;
    } catch (e) {
        isInitialized = false;
        return false;
    }
}

/**
 * Clean numeric citation artifacts from text before rendering.
 * @param {string} text - Raw input text
 * @returns {string} Pre-processed text
 */
function preprocessCodeBlocks(text) {
    return text.replace(/\[\d+\]/g, '');
}

/**
 * Render Markdown text for terminal display asynchronously.
 * @param {string} text - Raw Markdown content
 * @returns {Promise<string>} ANSI color rendered terminal text
 */
async function renderMarkdown(text) {
    if (!text) return '';

    const processedText = preprocessCodeBlocks(text);

    try {
        const syncResult = renderMarkdownSync(processedText);

        if (isInitialized && marked && !syncResult.includes('\x1b')) {
            return marked.parse(processedText);
        }

        return syncResult;
    } catch (e) {
        if (isInitialized && marked) {
            try { return marked.parse(processedText); } catch (i) { }
        }
        return processedText;
    }
}

/**
 * Synchronous Markdown renderer fallback with terminal styling.
 * @param {string} text - Raw Markdown string
 * @returns {string} Styled terminal output
 */
function renderMarkdownSync(text) {
    if (!text) return '';

    let result = text;

    result = result.replace(/```([^\n\r]*)\r?\n([\s\S]*?)```/g, (_, lang, code) => {
        return createCodeBox(code, lang.trim());
    });

    result = result.replace(/^#### (.+)$/gm, chalk.cyanBright('    ▸ $1'));
    result = result.replace(/^### (.+)$/gm, chalk.cyanBright.bold('\n   ### $1\n'));
    result = result.replace(/^## (.+)$/gm, chalk.blueBright.bold('\n  ## $1\n'));
    result = result.replace(/^# (.+)$/gm, chalk.magentaBright.bold.underline('\n # $1\n'));

    result = result.replace(/\*\*\*([\s\S]+?)\*\*\*/g, chalk.whiteBright.bold.italic('$1'));
    result = result.replace(/\*\*([\s\S]+?)\*\*/g, chalk.whiteBright.bold('$1'));
    result = result.replace(/__([\s\S]+?)__/g, chalk.whiteBright.bold('$1'));
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, chalk.cyanBright.italic('$1'));
    result = result.replace(/_(.+?)_/g, chalk.cyanBright.italic('$1'));

    result = result.replace(/`([^`]+)`/g, chalk.yellowBright('$1'));

    result = result.replace(/\[(.+?)\]\((.+?)\)/g, chalk.blueBright.underline('$1') + chalk.gray(' ($2)'));

    result = result.replace(/^[\s]*[-*+]\s+\[ \]\s+(.+)$/gm, chalk.cyanBright('  ▢ ') + chalk.whiteBright('$1'));
    result = result.replace(/^[\s]*[-*+]\s+\[x\]\s+(.+)$/gm, chalk.greenBright('  ✔ ') + chalk.whiteBright('$1'));
    result = result.replace(/^[\s]*[-*+]\s+(.+)$/gm, chalk.cyanBright('  • ') + chalk.whiteBright('$1'));
    result = result.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, chalk.cyanBright('  → ') + chalk.whiteBright('$2'));

    const tableRegex = /((?:^[\s]*\|.+\|[\s]*?\n?)+)/gm;
    result = result.replace(tableRegex, (match) => {
        try {
            const lines = match.trim().split('\n');
            if (lines.length < 2) return match;

            const rows = lines.map(line =>
                line.trim().slice(1, -1).split('|').map(c => c.trim())
            ).filter(row => row.length > 0 && !row.every(c => c.match(/^-+$/)));

            if (rows.length === 0) return match;

            const headers = rows[0];
            const data = rows.slice(1);
            const colCount = headers.length;
            const safeTermWidth = (process.stdout.columns || 100) - 12;

            if (colCount > 4 || (colCount > 2 && safeTermWidth < 100) || (colCount * 20 > safeTermWidth)) {
                let cardView = '\n';
                data.forEach((row, rowIndex) => {
                    const title = row[0] || `Item #${rowIndex + 1}`;
                    cardView += chalk.cyanBright(`  ┏━ ${title.toUpperCase()} ━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`);
                    headers.slice(rowIndex === 0 && row[0] === headers[0] ? 1 : 0).forEach((h, i) => {
                        const actualIdx = (rowIndex === 0 && row[0] === headers[0] && i >= 0) ? i + 1 : i;
                        const val = row[actualIdx] || chalk.gray('N/A');

                        let renderedVal = val;
                        renderedVal = renderedVal.replace(/`([^`]+)`/g, chalk.yellowBright('$1'));
                        renderedVal = renderedVal.replace(/\*\*([\s\S]+?)\*\*/g, chalk.whiteBright.bold('$1'));
                        renderedVal = renderedVal.replace(/_([^_]+)_/g, chalk.cyanBright.italic('$1'));

                        if (val && h) {
                            cardView += `  ┃ ` + chalk.cyan.bold(h.padEnd(16)) + ` │ ` + renderedVal + `\n`;
                        }
                    });
                    cardView += chalk.cyanBright(`  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`);
                });
                return cardView;
            }

            const Table = require('cli-table3');
            const availableForContent = safeTermWidth - (colCount * 4);
            const colWidth = Math.max(10, Math.floor(availableForContent / colCount));

            const table = new Table({
                head: headers.map(h => chalk.cyanBright.bold(h.toUpperCase())),
                style: { head: [], border: ['gray'] },
                wordWrap: true,
                colWidths: Array(colCount).fill(colWidth)
            });

            data.forEach(row => {
                const filledRow = Array(colCount).fill('').map((_, i) => {
                    let val = row[i] || '';
                    val = val.replace(/`([^`]+)`/g, chalk.yellowBright('$1'));
                    val = val.replace(/\*\*([\s\S]+?)\*\*/g, chalk.whiteBright.bold('$1'));
                    return val;
                });
                table.push(filledRow);
            });

            return '\n' + table.toString() + '\n';
        } catch (e) {
            return match;
        }
    });

    result = result.replace(/^---$/gm, chalk.gray('─'.repeat(60)));
    result = result.replace(/^> (.+)$/gm, chalk.cyanBright('  ┃ ') + chalk.whiteBright.italic('$1'));

    return result;
}

module.exports = { renderMarkdown, renderMarkdownSync, initRenderer, createCodeBox, preprocessCodeBlocks };
