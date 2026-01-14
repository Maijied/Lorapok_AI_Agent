const { marked } = require('marked');
const TerminalRenderer = require('marked-terminal');
const chalk = require('chalk');

// Initialize the renderer
marked.setOptions({
    renderer: new TerminalRenderer({
        code: chalk.yellow,      // Code blocks in yellow
        blockquote: chalk.gray.italic, // Quotes in gray italic
        html: chalk.reset,       // HTML tags
        heading: chalk.bold.cyan, // Headers in bold cyan
        firstHeading: chalk.bold.underline.blue, // H1
        strong: chalk.bold.red,  // Bold text in red
        em: chalk.italic.green,  // Italic text in green
        codespan: chalk.yellow,  // Inline code code spans
        del: chalk.dim.gray.strikethrough, // Strikethrough
        link: chalk.blue,        // Links
        href: chalk.blue.underline, // Hrefs
        width: 80,               // Word wrap at 80 chars
        reflowText: true,        // Reflow text
        showSectionPrefix: false, // Don't show section prefix
        unescape: true,          // Unescape HTML entities
        emoji: true,             // Support emojis (basic support)
        list: (body, ordered) => {
            // Custom list logic if needed, but default is usually fine
            return body;
        }
    })
});

/**
 * Renders markdown text for the terminal.
 * @param {string} text The markdown string to render.
 * @returns {string} The formatted terminal string.
 */
function renderMarkdown(text) {
    if (!text) return '';
    try {
        return marked(text);
    } catch (e) {
        return text; // Fallback to raw text on error
    }
}

module.exports = { renderMarkdown };
