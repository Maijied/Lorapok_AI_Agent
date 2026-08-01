/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const { renderMarkdownSync, createCodeBox } = require('../lib/renderer');
const chalk = require('chalk');

describe('Renderer (Markdown)', () => {
    test('should style bold and italic text', () => {
        const input = '**bold** *italic* ***both***';
        const output = renderMarkdownSync(input);
        expect(output).toContain(chalk.whiteBright.bold('bold'));
        expect(output).toContain(chalk.cyan.italic('italic'));
        expect(output).toContain(chalk.whiteBright.bold.italic('both'));
    });

    test('should remove backticks from inline code', () => {
        const input = 'Use `npm install` to setup';
        const output = renderMarkdownSync(input);
        expect(output).toContain(chalk.yellowBright('npm install'));
        expect(output).not.toContain('`npm install`');
    });

    test('should style checkboxes in lists', () => {
        const input = '- [ ] Task 1\n- [x] Task 2';
        const output = renderMarkdownSync(input);
        expect(output).toContain(chalk.cyan('  ▢ '));
        expect(output).toContain(chalk.greenBright('  ✔ '));
    });

    test('should pivot wide tables into Card View', () => {
        // Table with 6 columns should pivot
        const input = '| Col1 | Col2 | Col3 | Col4 | Col5 | Col6 |\n|---|---|---|---|---|---|\n| val1 | val2 | val3 | val4 | val5 | val6 |';
        const output = renderMarkdownSync(input);
        expect(output).toContain('┏━');
        expect(output).toContain('┃');
        expect(output).toContain('VAL1'); // Header converted to title
    });

    test('should create styled code boxes', () => {
        const code = 'console.log("hello")';
        const output = createCodeBox(code, 'js');
        expect(output).toContain('JAVASCRIPT');
        expect(output).toContain('1 │ ');

        const proOutput = createCodeBox('member(X, [1, 2]).', 'pro');
        expect(proOutput).toContain('PROLOG');
    });

    test('code boxes fit inside shared response layout width', () => {
        const { getResponseLayout, createCodeBox: box } = require('../lib/renderer');
        const { contentW, codeBoxWidth } = getResponseLayout();
        const strip = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, '');
        const output = box('find . -maxdepth 3 -not -path "*/.*" -not -path "./node_modules*"', 'bash');
        const lines = output.split('\n').filter(l => strip(l).trim());
        for (const line of lines) {
            expect(strip(line).length).toBeLessThanOrEqual(contentW);
            expect(strip(line).length).toBeLessThanOrEqual(codeBoxWidth + 2);
        }
        expect(output).toContain('TERMINAL');
        expect(output).toContain('...');
    });
});
