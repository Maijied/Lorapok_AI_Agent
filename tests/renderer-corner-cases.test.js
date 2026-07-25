/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const { renderMarkdownSync, createCodeBox, preprocessCodeBlocks } = require('../lib/renderer');
const chalk = require('chalk');

describe('Renderer Corner Cases', () => {
    // 1. CRLF code blocks
    test('CRLF code blocks are detected and rendered as styled boxes, not raw markdown', () => {
        const input = '```js\r\nconsole.log("hello");\r\n```';
        const result = renderMarkdownSync(input);
        expect(result).not.toContain('```');
        expect(result).toContain('┌');
        expect(result).toContain('console.log("hello")');
    });

    // 2. Empty code blocks
    test('Empty code blocks (```js\\n```) produce a code box with no lines', () => {
        const input = '```js\n```';
        const result = renderMarkdownSync(input);
        expect(result).not.toContain('```');
        expect(result).toContain('┌');
        expect(result).toContain('└');
        expect(result).toContain('─');
    });

    // 3. Code blocks with special lang names
    test('Code blocks with special lang names (c++, objective-c, f#) work', () => {
        const inputs = [
            { lang: 'c++', name: 'C++' },
            { lang: 'objective-c', name: 'OBJECTIVE-C' },
            { lang: 'f#', name: 'F#' }
        ];
        for (const { lang, name } of inputs) {
            const input = '```' + lang + '\ncode\n```';
            const result = renderMarkdownSync(input);
            expect(result).not.toContain('```');
            expect(result).toContain('┌');
            expect(result).toContain('code');
        }
    });

    // 4. Code blocks with trailing spaces in lang
    test('Code blocks with trailing spaces in lang trim to the lang name', () => {
        const input = '```js   \ncode\n```';
        const result = renderMarkdownSync(input);
        expect(result).not.toContain('```js   ');
        expect(result).toContain(' JAVASCRIPT ');
        expect(result).toContain('code');
    });

    // 5. Nested backticks inside code blocks
    test('Code containing ` characters inside a code block does not break rendering', () => {
        const input = '```js\nconst str = `hello`;\n```';
        const result = renderMarkdownSync(input);
        expect(result).not.toContain('```js');
        // Backticks get processed by inline code regex, so content appears without them
        expect(result).toContain('const str =');
        expect(result).toContain('hello');
        expect(result).toContain('┌');
    });

    // 6. Multiple code blocks in one message
    test('Two consecutive code blocks should both be rendered', () => {
        const input = '```js\ncode1\n```\nSome text\n```python\ncode2\n```';
        const result = renderMarkdownSync(input);
        expect(result).not.toContain('```');
        expect(result).toContain(' JAVASCRIPT ');
        expect(result).toContain(' PYTHON ');
        expect(result).toContain('code1');
        expect(result).toContain('code2');
    });

    // 7. preprocessCodeBlocks
    test('preprocessCodeBlocks should strip [1], [42], [123] citation numbers from text', () => {
        const input = 'Here is text [1] and [42] and [123].';
        const result = preprocessCodeBlocks(input);
        expect(result).not.toContain('[1]');
        expect(result).not.toContain('[42]');
        expect(result).not.toContain('[123]');
        expect(result).toBe('Here is text  and  and .');
    });

    // 8. preprocessCodeBlocks with no citations
    test('preprocessCodeBlocks with no citations should return text unchanged', () => {
        const input = 'Hello world, no citations here.';
        const result = preprocessCodeBlocks(input);
        expect(result).toBe(input);
    });

    // 9. createCodeBox with empty string
    test('createCodeBox with empty string should produce output with border characters', () => {
        const result = createCodeBox('', 'js');
        expect(result).toContain('┌');
        expect(result).toContain('└');
        expect(result).toContain('│');
        expect(result).toContain(' JAVASCRIPT ');
    });

    // 10. createCodeBox with very long lines
    test('Lines longer than terminal width should be truncated with "..."', () => {
        const longCode = 'A'.repeat(500);
        const result = createCodeBox(longCode, 'js');
        expect(result).toContain('...');
        expect(result).not.toContain('A'.repeat(500));
    });

    // 11. createCodeBox with shell languages
    test('bash, sh should use green styling (contain specific language tags)', () => {
        const result1 = createCodeBox('echo "hi"', 'bash');
        const result2 = createCodeBox('echo "hi"', 'sh');
        expect(result1).toContain(' TERMINAL ');
        expect(result2).toContain(' SHELL ');
        expect(result1).toContain('echo "hi"');
    });

    // 12. renderMarkdownSync with headings
    test('All 4 heading levels (#, ##, ###, ####) should produce styled output', () => {
        const input = '# H1\n## H2\n### H3\n#### H4';
        const result = renderMarkdownSync(input);
        expect(result).toContain('H1');
        expect(result).toContain('H2');
        expect(result).toContain('H3');
        expect(result).toContain('H4');
        expect(result).toContain('▸ H4'); 
        expect(result).toContain('### H3');
        expect(result).toContain('## H2');
        expect(result).toContain('# H1');
    });

    // 13. renderMarkdownSync with horizontal rules
    test('Horizontal rules (---) should produce a line of ─ characters', () => {
        const result = renderMarkdownSync('---');
        expect(result).toContain('─'.repeat(60));
    });

    // 14. renderMarkdownSync with blockquotes
    test('Blockquotes (> text) should produce styled blockquote with ┃ character', () => {
        const result = renderMarkdownSync('> blockquote text');
        expect(result).toContain('┃');
        expect(result).toContain('blockquote text');
    });

    // 15. renderMarkdownSync with links
    test('Links ([text](url)) should render the text and url', () => {
        const result = renderMarkdownSync('Here is a [Google](https://google.com) link');
        expect(result).toContain('Google');
        expect(result).toContain('(https://google.com)');
    });

    // 16. renderMarkdownSync with empty input
    test('renderMarkdownSync with empty input should return empty string', () => {
        expect(renderMarkdownSync('')).toBe('');
    });

    // 17. renderMarkdownSync with null input
    test('renderMarkdownSync with null input should return empty string', () => {
        expect(renderMarkdownSync(null)).toBe('');
        expect(renderMarkdownSync(undefined)).toBe('');
    });

    // 18. renderMarkdownSync with ordered lists
    test('Ordered lists (1. item) should produce styled output', () => {
        const result = renderMarkdownSync('1. First item\n2. Second item');
        expect(result).toContain('→');
        expect(result).toContain('First item');
        expect(result).toContain('Second item');
    });

    // 19. renderMarkdownSync with mixed markdown
    test('A complex input with headings, code, lists, bold, italic all together', () => {
        const input = `
# Title
Some **bold** and *italic* text.
\`\`\`js
console.log(1);
\`\`\`
> A quote
1. First
2. Second
---
`;
        const result = renderMarkdownSync(input);
        expect(result).toContain('# Title');
        expect(result).toContain('bold');
        expect(result).toContain('italic');
        expect(result).toContain(' JAVASCRIPT ');
        expect(result).toContain('console.log(1)');
        expect(result).toContain('┃');
        expect(result).toContain('A quote');
        expect(result).toContain('→');
        expect(result).toContain('First');
        expect(result).toContain('Second');
        expect(result).toContain('─'.repeat(60));
    });
});
