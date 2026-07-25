/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const TerminalUI = require('../lib/ui');
const chalk = require('chalk');

describe('TerminalUI.getFileIcon corner cases', () => {
    test('1. Returns \'📁\' for directories (isDirectory=true)', () => {
        expect(TerminalUI.getFileIcon('folder', true)).toBe('📁');
    });

    test('2. Returns correct icon for common JS files (.js → \'⚡\')', () => {
        expect(TerminalUI.getFileIcon('app.js')).toBe('⚡');
    });

    test('3. Returns correct icon for TypeScript (.ts → \'📘\')', () => {
        expect(TerminalUI.getFileIcon('main.ts')).toBe('📘');
    });

    test('4. Returns correct icon for Python (.py → \'🐍\')', () => {
        expect(TerminalUI.getFileIcon('script.py')).toBe('🐍');
    });

    test('5. Returns correct icon for Rust (.rs → \'🦀\')', () => {
        expect(TerminalUI.getFileIcon('main.rs')).toBe('🦀');
    });

    test('6. Returns correct icon for Go (.go → \'🐹\')', () => {
        expect(TerminalUI.getFileIcon('main.go')).toBe('🐹');
    });

    test('7. Returns correct icon for Docker files', () => {
        expect(TerminalUI.getFileIcon('Dockerfile')).toBe('🐳');
        expect(TerminalUI.getFileIcon('docker-compose.yml')).toBe('🐳');
    });

    test('8. Returns correct icon for dotfiles', () => {
        expect(TerminalUI.getFileIcon('.gitignore')).toBe('🔒');
        expect(TerminalUI.getFileIcon('.env')).toBe('🔒');
        expect(TerminalUI.getFileIcon('.env.local')).toBe('🔒');
    });

    test('9. Returns correct icon for package files', () => {
        expect(TerminalUI.getFileIcon('package.json')).toBe('📦');
        expect(TerminalUI.getFileIcon('yarn.lock')).toBe('📦');
    });

    test('10. Returns correct icon for config files', () => {
        expect(TerminalUI.getFileIcon('.eslintrc.json')).toBe('⚙️');
        expect(TerminalUI.getFileIcon('tsconfig.json')).toBe('⚙️');
    });

    test('11. Returns correct icon for archives', () => {
        expect(TerminalUI.getFileIcon('archive.zip')).toBe('📦');
        expect(TerminalUI.getFileIcon('archive.tar.gz')).toBe('📦');
    });

    test('12. Returns correct icon for images', () => {
        expect(TerminalUI.getFileIcon('image.png')).toBe('🖼️');
        expect(TerminalUI.getFileIcon('image.jpg')).toBe('🖼️');
    });

    test('13. Returns correct icon for fonts', () => {
        expect(TerminalUI.getFileIcon('font.ttf')).toBe('🔤');
        expect(TerminalUI.getFileIcon('font.woff2')).toBe('🔤');
    });

    test('14. Returns correct icon for audio', () => {
        expect(TerminalUI.getFileIcon('audio.mp3')).toBe('🎵');
    });

    test('15. Returns correct icon for video', () => {
        expect(TerminalUI.getFileIcon('video.mp4')).toBe('🎬');
    });

    test('16. Returns correct icon for database', () => {
        expect(TerminalUI.getFileIcon('query.sql')).toBe('🗄️');
        expect(TerminalUI.getFileIcon('schema.prisma')).toBe('🗄️');
    });

    test('17. Returns \'📄\' for unknown extensions', () => {
        expect(TerminalUI.getFileIcon('unknown.xyz')).toBe('📄');
        expect(TerminalUI.getFileIcon('unknown.custom')).toBe('📄');
    });

    test('18. Handles null/undefined filePath gracefully', () => {
        expect(() => TerminalUI.getFileIcon(null)).not.toThrow();
        expect(() => TerminalUI.getFileIcon(undefined)).not.toThrow();
        expect(TerminalUI.getFileIcon(null)).toBe('📄');
    });

    test('19. Handles empty string filePath', () => {
        expect(TerminalUI.getFileIcon('')).toBe('📄');
    });

    test('20. Handles filePath with no extension', () => {
        expect(TerminalUI.getFileIcon('Makefile')).toBe('📄');
        expect(TerminalUI.getFileIcon('README')).toBe('📖');
    });

    test('21. Handles deeply nested paths', () => {
        expect(TerminalUI.getFileIcon('a/b/c/d/file.js')).toBe('⚡');
    });

    test('22. Handles filePath with multiple dots', () => {
        expect(TerminalUI.getFileIcon('my.component.test.tsx')).toBe('⚛️');
    });
});

describe('TerminalUI.hideLongCodeBlocks corner cases', () => {
    test('1. Returns content unchanged when no code blocks exist', () => {
        const content = 'This is a test without code blocks.\nJust some text.';
        expect(TerminalUI.hideLongCodeBlocks(content)).toBe(content);
    });

    test('2. Returns content unchanged when code blocks are shorter than threshold', () => {
        const content = 'Text\n```javascript\nconst a = 1;\n```\nMore text.';
        expect(TerminalUI.hideLongCodeBlocks(content)).toBe(content);
    });

    test('3. Hides code blocks that exceed threshold (default 50 lines)', () => {
        const longCode = Array(51).fill('console.log("test");').join('\n');
        const content = `Text\n\`\`\`javascript\n${longCode}\n\`\`\`\nEnd`;
        const result = TerminalUI.hideLongCodeBlocks(content);
        expect(result).not.toContain(longCode);
        expect(result).toContain('51 lines of code hidden');
    });

    test('4. Handles CRLF line endings in code blocks', () => {
        const longCode = Array(51).fill('console.log("test");').join('\r\n');
        const content = `Text\r\n\`\`\`javascript\r\n${longCode}\r\n\`\`\`\r\nEnd`;
        const result = TerminalUI.hideLongCodeBlocks(content);
        expect(result).toContain('lines of code hidden');
    });

    test('5. Preserves tree-like code blocks even if long', () => {
        const treeCode = Array(51).fill('├── item').join('\n');
        const content = `\`\`\`\n${treeCode}\n\`\`\``;
        const result = TerminalUI.hideLongCodeBlocks(content);
        expect(result).toBe(content);
    });

    test('6. Preserves log-like code blocks even if long', () => {
        const logCode = Array(51).fill('2026-07-25T12:00:00Z - Log entry').join('\n');
        const content = `\`\`\`log\n${logCode}\n\`\`\``;
        const result = TerminalUI.hideLongCodeBlocks(content);
        expect(result).toBe(content);
    });

    test('7. Handles empty content string', () => {
        expect(TerminalUI.hideLongCodeBlocks('')).toBe('');
    });

    test('8. Handles content with only a code block (no surrounding text)', () => {
        const longCode = Array(51).fill('x = 1;').join('\n');
        const content = `\`\`\`\n${longCode}\n\`\`\``;
        const result = TerminalUI.hideLongCodeBlocks(content);
        expect(result).toContain('hidden');
    });

    test('9. Handles multiple code blocks where some exceed threshold and some dont', () => {
        const shortCode = 'let a = 1;';
        const longCode = Array(51).fill('let b = 2;').join('\n');
        const content = `First:\n\`\`\`\n${shortCode}\n\`\`\`\nSecond:\n\`\`\`\n${longCode}\n\`\`\``;
        const result = TerminalUI.hideLongCodeBlocks(content);
        expect(result).toContain(shortCode);
        expect(result).not.toContain(longCode);
        expect(result).toContain('hidden');
    });
});

describe('TerminalUI.truncateCode corner cases', () => {
    test('1. Returns code unchanged when lines are under threshold', () => {
        const code = 'line1\nline2\nline3';
        expect(TerminalUI.truncateCode(code, 5)).toBe(code);
    });

    test('2. Truncates code and adds ellipsis when lines exceed threshold', () => {
        const code = Array(15).fill('line').map((l, i) => `${l}${i}`).join('\n');
        const result = TerminalUI.truncateCode(code, 10);
        expect(result).toContain('line0');
        expect(result).toContain('line14');
        expect(result).toContain('truncated');
    });

    test('3. Handles empty string input', () => {
        expect(TerminalUI.truncateCode('', 5)).toBe('');
    });

    test('4. Handles single-line input', () => {
        expect(TerminalUI.truncateCode('single line', 5)).toBe('single line');
    });

    test('5. Handles exact threshold count', () => {
        const code = '1\n2\n3\n4\n5';
        expect(TerminalUI.truncateCode(code, 5)).toBe(code);
    });
});

describe('TerminalUI.formatError / formatSuccess', () => {
    test('1. formatError wraps message with red ❌ prefix', () => {
        const msg = 'Something went wrong';
        const result = TerminalUI.formatError(msg);
        expect(result).toContain('❌');
        expect(result).toContain('Something went wrong');
    });

    test('2. formatSuccess wraps message with green ✅ prefix', () => {
        const msg = 'Operation successful';
        const result = TerminalUI.formatSuccess(msg);
        expect(result).toContain('✅');
        expect(result).toContain('Operation successful');
    });

    test('3. Both handle empty strings', () => {
        expect(TerminalUI.formatError('')).toContain('❌');
        expect(TerminalUI.formatSuccess('')).toContain('✅');
    });
});

describe('TerminalUI.getBranding corner cases', () => {
    test('1. Should return a string containing border characters', () => {
        const result = TerminalUI.getBranding();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/[╭╮╰╯┌┐└┘╔╗╚╝┏┓┗┛]/);
    });

    test('2. Should include version string', () => {
        const result = TerminalUI.getBranding('Slant', 0, '9.9.9');
        expect(result).toContain('9.9.9');
    });

    test('3. Should include model name when provided', () => {
        const result = TerminalUI.getBranding('Slant', 0, '1.0.0', 'gpt-4o');
        expect(result).toContain('gpt-4o');
    });

    test('4. Should include path when provided', () => {
        const result = TerminalUI.getBranding('Slant', 0, '1.0.0', 'gpt-4o', '/foo/bar');
        expect(result).toContain('/foo/bar');
    });

    test('5. Should not crash with unknown font name (falls back to Slant)', () => {
        expect(() => {
            TerminalUI.getBranding('UnknownFontXYZ', 0, '1.0.0');
        }).not.toThrow();
    });

    test('6. Should not crash with bugFrame > 3 (wraps around)', () => {
        expect(() => {
            TerminalUI.getBranding('Slant', 10, '1.0.0');
        }).not.toThrow();
    });
});
