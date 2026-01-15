const { renderMarkdownSync, createCodeBox } = require('../lib/renderer');
const chalk = require('chalk');

describe('Renderer (Markdown)', () => {
    test('should style bold and italic text', () => {
        const input = '**bold** *italic* ***both***';
        const output = renderMarkdownSync(input);
        expect(output).toContain(chalk.whiteBright.bold('bold'));
        expect(output).toContain(chalk.cyanBright.italic('italic'));
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
        expect(output).toContain(chalk.cyanBright('  ▢ '));
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
        expect(output).toContain('JavaScript');
        expect(output).toContain('1 │ ');
    });
});
