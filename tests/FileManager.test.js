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

    test('should view file with line number range', () => {
        const fileContent = 'line 1\nline 2\nline 3\nline 4';
        fs.writeFileSync(path.join(testDir, 'range.txt'), fileContent);
        const res = fm.viewFile('range.txt', { startLine: 2, endLine: 3 });
        expect(res.success).toBe(true);
        expect(res.data.startLine).toBe(2);
        expect(res.data.endLine).toBe(3);
        expect(res.data.content).toContain('2: line 2');
        expect(res.data.content).toContain('3: line 3');
    });

    test('should surgically replace file content snippet', () => {
        const fileContent = 'const val = "OLD_VALUE";';
        fs.writeFileSync(path.join(testDir, 'code.js'), fileContent);
        const res = fm.replaceFileContent('code.js', 'OLD_VALUE', 'NEW_VALUE');
        expect(res.success).toBe(true);
        expect(res.data.replacedCount).toBe(1);
        expect(fs.readFileSync(path.join(testDir, 'code.js'), 'utf8')).toBe('const val = "NEW_VALUE";');
    });

    test('should search pattern across files with grepSearch', () => {
        fs.writeFileSync(path.join(testDir, 'a.js'), 'function targetFunc() { return 42; }');
        fs.writeFileSync(path.join(testDir, 'b.js'), 'console.log("no match");');
        const res = fm.grepSearch('targetFunc', '.');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(1);
        expect(res.data[0].filename).toBe('a.js');
        expect(res.data[0].lineNumber).toBe(1);
        expect(res.data[0].lineContent).toContain('targetFunc');
    });

    test('should perform multi-chunk replacements via multiReplaceFileContent', () => {
        const fileContent = 'const a = "OLD_A";\nconst b = "OLD_B";';
        fs.writeFileSync(path.join(testDir, 'multi.js'), fileContent);
        const res = fm.multiReplaceFileContent('multi.js', [
            { targetContent: 'OLD_A', replacementContent: 'NEW_A' },
            { targetContent: 'OLD_B', replacementContent: 'NEW_B' }
        ]);
        expect(res.success).toBe(true);
        expect(res.data.chunksApplied).toBe(2);
        const updated = fs.readFileSync(path.join(testDir, 'multi.js'), 'utf8');
        expect(updated).toContain('NEW_A');
        expect(updated).toContain('NEW_B');
    });
});


