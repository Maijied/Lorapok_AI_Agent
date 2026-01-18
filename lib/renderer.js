const chalk = require('chalk');

/**
 * Terminal Markdown Renderer for Lorapok
 * Professional code viewer with high-contrast colors for dark terminals
 */

let marked = null;
let isInitialized = false;

// Language aliases for display
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
    'clojure': 'Clojure',
    'elixir': 'Elixir',
    'erlang': 'Erlang',
    'fsharp': 'F#',
    'fs': 'F#',
    'powershell': 'PowerShell',
    'ps1': 'PowerShell',
    'makefile': 'Makefile',
    'diff': 'Diff',
    '': 'Code'
};

/**
 * Creates a styled code block box with high-contrast colors
 */
function createCodeBox(code, lang = '') {
    const displayLang = LANG_DISPLAY[lang.toLowerCase()] || lang || 'Code';
    const termWidth = process.stdout.columns || 80;
    // Allow up to 90% of terminal width or 120 chars
    const width = Math.min(termWidth - 2, 120);
    const lines = code.trim().split('\n');

    // High-contrast colors for dark terminals
    const isShell = ['bash', 'sh', 'shell', 'terminal', 'powershell', 'ps1'].includes(lang.toLowerCase());
    const borderChar = isShell ? chalk.greenBright : chalk.cyanBright;
    const codeColor = isShell ? chalk.greenBright : chalk.whiteBright;
    const labelColor = isShell ? chalk.bgGreen.black.bold : chalk.bgCyan.black.bold;

    let output = '\n';

    // Top border with language label
    const labelText = ` ${displayLang.toUpperCase()} `;
    const lineBefore = '─'.repeat(2);
    const lineAfterLen = Math.max(0, width - labelText.length - 5);
    const lineAfter = '─'.repeat(lineAfterLen);

    output += borderChar(' ┌' + lineBefore) + labelColor(labelText) + borderChar(lineAfter + '┐') + '\n';

    // Code lines with line numbers
    lines.forEach((line, i) => {
        const lineNum = chalk.gray(String(i + 1).padStart(3) + ' │ '); // 6 chars
        const processedLine = line;

        // Note: No truncation here to ensure full code is visible. 
        // Terminal will handle wrapping if it exceeds physical bounds, 
        // but we'll try to keep the box consistent.
        output += borderChar(' │') + lineNum + codeColor(processedLine) + borderChar(' │') + '\n';
    });

    // Bottom border
    output += borderChar(' └' + '─'.repeat(width - 2) + '┘') + '\n';

    return output;
}

/**
 * Initialize the markdown renderer
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
 * Renders markdown text for the terminal.
 */
async function renderMarkdown(text) {
    if (!text) return '';

    const processedText = preprocessCodeBlocks(text);

    // Prefer the high-contrast sync renderer as it matches the user's preferred "Plan" aesthetic
    // and is more reliable across different terminal environments.
    try {
        const syncResult = renderMarkdownSync(processedText);

        // If the sync renderer didn't do much (e.g. no headers, no lists), 
        // and we have marked available, try to use it for better structural parsing.
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
 * Pre-process code blocks
 */
function preprocessCodeBlocks(text) {
    return text.replace(/\[\d+\]/g, '');
}

/**
 * Synchronous fallback with high-contrast colors
 */
function renderMarkdownSync(text) {
    if (!text) return '';

    let result = text;

    // Replace code blocks with styled versions
    result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return createCodeBox(code, lang);
    });

    // Headers - bright colors
    result = result.replace(/^#### (.+)$/gm, chalk.cyanBright('    ▸ $1'));
    result = result.replace(/^### (.+)$/gm, chalk.cyanBright.bold('\n   ### $1\n'));
    result = result.replace(/^## (.+)$/gm, chalk.blueBright.bold('\n  ## $1\n'));
    result = result.replace(/^# (.+)$/gm, chalk.magentaBright.bold.underline('\n # $1\n'));

    // Bold & Italic - high contrast (using [\s\S] to match across lines if needed)
    result = result.replace(/\*\*\*([\s\S]+?)\*\*\*/g, chalk.whiteBright.bold.italic('$1'));
    result = result.replace(/\*\*([\s\S]+?)\*\*/g, chalk.whiteBright.bold('$1'));
    result = result.replace(/__([\s\S]+?)__/g, chalk.whiteBright.bold('$1'));
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, chalk.cyanBright.italic('$1'));
    result = result.replace(/_(.+?)_/g, chalk.cyanBright.italic('$1'));

    // Inline code - bright yellow, removed literal backticks for a cleaner look
    result = result.replace(/`([^`]+)`/g, chalk.yellowBright('$1'));

    // Links - bright blue
    result = result.replace(/\[(.+?)\]\((.+?)\)/g, chalk.blueBright.underline('$1') + chalk.gray(' ($2)'));

    // Lists - with bright bullets and checkbox support
    result = result.replace(/^[\s]*[-*+]\s+\[ \]\s+(.+)$/gm, chalk.cyanBright('  ▢ ') + chalk.whiteBright('$1'));
    result = result.replace(/^[\s]*[-*+]\s+\[x\]\s+(.+)$/gm, chalk.greenBright('  ✔ ') + chalk.whiteBright('$1'));
    result = result.replace(/^[\s]*[-*+]\s+(.+)$/gm, chalk.cyanBright('  • ') + chalk.whiteBright('$1'));
    result = result.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, chalk.cyanBright('  → ') + chalk.whiteBright('$2'));

    // Tables - Professional Terminal-Aware Rendering (Smart Pivot)
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
            // conservative width to account for boxen borders (approx 6-8 chars) and side padding
            const safeTermWidth = (process.stdout.columns || 100) - 12;

            // SMART PIVOT: If table is too dense for terminal columns, use Card View
            // Adjusted triggers to be safer
            if (colCount > 4 || (colCount > 2 && safeTermWidth < 100) || (colCount * 20 > safeTermWidth)) {
                let cardView = '\n';
                data.forEach((row, rowIndex) => {
                    const title = row[0] || `Item #${rowIndex + 1}`;
                    cardView += chalk.cyanBright(`  ┏━ ${title.toUpperCase()} ━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`);
                    headers.slice(rowIndex === 0 && row[0] === headers[0] ? 1 : 0).forEach((h, i) => {
                        const actualIdx = (rowIndex === 0 && row[0] === headers[0] && i >= 0) ? i + 1 : i;
                        const val = row[actualIdx] || chalk.gray('N/A');

                        // Recursive-like rendering for value content (limited to inline styles)
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

            // Standard Table View (Optimized for cli-table3)
            const Table = require('cli-table3');
            // Ensure total table width doesn't exceed safe width. 
            // cli-table3 adds 3 chars per column (padding+border) + 1 outer border.  ~ (colCount * 3) + 1 overhead
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
                    // Inline styles for table cells
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

    // Horizontal rule
    result = result.replace(/^---$/gm, chalk.gray('─'.repeat(60)));

    // Blockquotes - with visible border
    result = result.replace(/^> (.+)$/gm, chalk.cyanBright('  ┃ ') + chalk.whiteBright.italic('$1'));

    return result;
}

module.exports = { renderMarkdown, renderMarkdownSync, initRenderer, createCodeBox };
