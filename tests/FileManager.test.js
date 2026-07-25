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
        const res = fm.listFiles('.');
        expect(res.success).toBe(true);
        expect(res.data.some(f => f.path === 'test.txt')).toBe(true);
    });

    test('should read file content', () => {
        const content = 'hello world';
        fs.writeFileSync(path.join(testDir, 'test.txt'), content);
        const res = fm.readFile('test.txt');
        expect(res.success).toBe(true);
        expect(res.data).toBe(content);
    });

    test('should write file content', () => {
        const content = 'new content';
        const res = fm.writeFile('new.txt', content);
        expect(res.success).toBe(true);
        expect(fs.readFileSync(path.join(testDir, 'new.txt'), 'utf8')).toBe(content);
    });

    test('should prevent reading outside project root', () => {
        const res = fm.readFile('../outside.txt');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Access denied');
    });

    test('should search files by pattern', () => {
        fs.writeFileSync(path.join(testDir, 'find_me.js'), '');
        fs.writeFileSync(path.join(testDir, 'ignore_me.txt'), '');
        const res = fm.searchFiles('find');
        expect(res.success).toBe(true);
        expect(res.data.length).toBe(1);
        expect(res.data[0].path).toBe('find_me.js');
    });

    test('should generate file tree', () => {
        fs.mkdirSync(path.join(testDir, 'src'));
        fs.writeFileSync(path.join(testDir, 'src/index.js'), '');
        const res = fm.getFileTree('.');
        expect(res.success).toBe(true);
        expect(res.data).toContain('src');
        expect(res.data).toContain('index.js');
    });
});
