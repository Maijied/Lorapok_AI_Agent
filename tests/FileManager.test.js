const FileManager = require('../services/FileManager');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('FileManager', () => {
    let testDir;
    let fm;

    beforeEach(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-test-'));
        fm = new FileManager(testDir);
    });

    afterEach(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    test('should list files in directory', () => {
        fs.writeFileSync(path.join(testDir, 'test.txt'), 'hello');
        const files = fm.listFiles('.');
        expect(files.some(f => f.path === 'test.txt')).toBe(true);
    });

    test('should read file content', () => {
        const content = 'hello world';
        fs.writeFileSync(path.join(testDir, 'test.txt'), content);
        expect(fm.readFile('test.txt')).toBe(content);
    });

    test('should write file content', () => {
        const content = 'new content';
        fm.writeFile('new.txt', content);
        expect(fs.readFileSync(path.join(testDir, 'new.txt'), 'utf8')).toBe(content);
    });

    test('should prevent reading outside project root', () => {
        expect(() => fm.readFile('../outside.txt')).toThrow();
    });

    test('should search files by pattern', () => {
        fs.writeFileSync(path.join(testDir, 'find_me.js'), '');
        fs.writeFileSync(path.join(testDir, 'ignore_me.txt'), '');
        const results = fm.searchFiles('find');
        expect(results.length).toBe(1);
        expect(results[0].path).toBe('find_me.js');
    });

    test('should generate file tree', () => {
        fs.mkdirSync(path.join(testDir, 'src'));
        fs.writeFileSync(path.join(testDir, 'src/index.js'), '');
        const tree = fm.getFileTree('.');
        expect(tree).toContain('src');
        expect(tree).toContain('index.js');
    });
});
