'use strict';

const IndexerService = require('../services/IndexerService');
const fs = require('fs');

// Mock heavy dependencies
jest.mock('vectordb', () => ({
    connect: jest.fn().mockResolvedValue({
        openTable: jest.fn().mockResolvedValue({
            add: jest.fn().mockResolvedValue(true),
            search: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([{
                    file_path: 'mock/path.js',
                    content: 'function test() {}'
                }])
            }),
            delete: jest.fn().mockResolvedValue(true)
        }),
        createTable: jest.fn().mockResolvedValue({
            add: jest.fn().mockResolvedValue(true),
            search: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([{
                    file_path: 'mock/path.js',
                    content: 'function test() {}'
                }])
            }),
            delete: jest.fn().mockResolvedValue(true)
        })
    })
}));

jest.mock('@xenova/transformers', () => {
    const mockExtractor = async (input) => {
        return {
            tolist: () => {
                const res = [];
                const len = Array.isArray(input) ? input.length : 1;
                for (let i = 0; i < len; i++) {
                    res.push(new Array(384).fill(0.1));
                }
                return res;
            }
        };
    };
    return {
        pipeline: jest.fn().mockResolvedValue(mockExtractor)
    };
});

jest.mock('chokidar', () => ({
    watch: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        close: jest.fn()
    })
}));

describe('IndexerService', () => {
    let indexer;

    beforeEach(() => {
        // Suppress logger in tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        

        // Don't actually make dirs in tests
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
        
        indexer = new IndexerService({ projectRoot: '/mock/project' });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize without errors', async () => {
        await expect(indexer.init()).resolves.not.toThrow();
        expect(indexer.db).toBeDefined();
        expect(indexer.pipeline).toBeDefined();
    });

    it('should index a file and extract symbols', async () => {
        await indexer.init();
        
        const mockCode = `
        class MyTestClass {
            hello() {}
        }
        function testFunc() {}
        `;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(mockCode);

        await indexer.indexFile('/mock/project/src/test.js');

        // Check if symbols were extracted
        const symbols = indexer.searchSymbols('testFunc');
        expect(symbols.length).toBeGreaterThan(0);
        expect(symbols[0].name).toBe('testFunc');
        expect(symbols[0].type).toBe('function');
    });

    it('should search embeddings', async () => {
        await indexer.init();
        
        // This relies on the mocked vectordb and transformers
        const results = await indexer.searchEmbeddings('how to test');
        expect(results.length).toBe(1);
        expect(results[0].file_path).toBe('mock/path.js');
    });

    it('should ignore files with extensions in IGNORED_EXTENSIONS block-list', () => {
        jest.spyOn(indexer, 'indexFile').mockResolvedValue();
        jest.useFakeTimers();

        indexer.queueIndex('/mock/project/image.png');
        indexer.queueIndex('/mock/project/app.exe');
        indexer.queueIndex('/mock/project/archive.tar.gz');
        indexer.queueIndex('/mock/project/src/main.py');
        indexer.queueIndex('/mock/project/src/app.js');
        
        jest.runAllTimers();
        
        expect(indexer.indexFile).toHaveBeenCalledTimes(2);
        expect(indexer.indexFile).toHaveBeenCalledWith('/mock/project/src/main.py');
        expect(indexer.indexFile).toHaveBeenCalledWith('/mock/project/src/app.js');

        jest.useRealTimers();
    });

    it('should extract symbols using regex fallback for JS when tree-sitter is unavailable', async () => {
        await indexer.init();
        indexer.parser = null; // Disable parser to force regex fallback
        
        const mockCode = `
        class MyRegexClass {
            hello() {}
        }
        function regexTestFunc() {}
        const myArrow = () => { }
        `;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(mockCode);

        await indexer.indexFile('/mock/project/src/regex_test.js');

        const symbols = indexer.searchSymbols('regexTestFunc');
        expect(symbols.length).toBeGreaterThan(0);
        expect(symbols[0].name).toBe('regexTestFunc');

        const classes = indexer.searchSymbols('MyRegexClass');
        expect(classes.length).toBeGreaterThan(0);
        expect(classes[0].name).toBe('MyRegexClass');

        const arrows = indexer.searchSymbols('myArrow');
        expect(arrows.length).toBeGreaterThan(0);
        expect(arrows[0].name).toBe('myArrow');
        
        // Check that a chunk was generated and added to the database
        expect(indexer.table.add).toHaveBeenCalled();
        const addCalls = indexer.table.add.mock.calls;
        const lastCallChunks = addCalls[addCalls.length - 1][0];
        expect(lastCallChunks.length).toBeGreaterThan(0);
        expect(lastCallChunks[0].symbol_type).toBe('file');
        expect(lastCallChunks[0].content.includes('MyRegexClass')).toBe(true);

        // Verify that the searchEmbeddings works and returns the mocked chunk (the mock always returns mock/path.js)
        const results = await indexer.searchEmbeddings('regex');
        expect(results.length).toBeGreaterThan(0);
    });

    it('should extract symbols for other languages using regex fallback', async () => {
        await indexer.init();
        
        const mockCode = `
        def python_func(args):
            pass
        fn rust_func():
            pass
        func go_func() {
        }
        sub basic_sub()
        `;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(mockCode);

        // A file extension not matched by the JS parser filter
        await indexer.indexFile('/mock/project/src/main.rs');

        expect(indexer.searchSymbols('python_func').length).toBeGreaterThan(0);
        expect(indexer.searchSymbols('rust_func').length).toBeGreaterThan(0);
        expect(indexer.searchSymbols('go_func').length).toBeGreaterThan(0);
        expect(indexer.searchSymbols('basic_sub').length).toBeGreaterThan(0);
    });

    it('should remove a file from index and db', async () => {
        await indexer.init();
        const escapedPath = 'src/test.js';
        indexer.symbolIndex.set(escapedPath, [{ name: 'testFunc' }]);
        
        await indexer.removeFile('/mock/project/' + escapedPath);
        
        expect(indexer.symbolIndex.has(escapedPath)).toBe(false);
        expect(indexer.table.delete).toHaveBeenCalledWith("file_path = 'src/test.js'");
    });

    it('should synchronously index project directory while respecting block-list', async () => {
        await indexer.init();
        
        const path = require('path');
        jest.spyOn(fs, 'readdirSync').mockImplementation((dir) => {
            if (dir === '/mock/project') {
                return [
                    { name: 'app.js', isDirectory: () => false },
                    { name: 'main.py', isDirectory: () => false },
                    { name: 'image.jpg', isDirectory: () => false },
                    { name: 'node_modules', isDirectory: () => true },
                    { name: '.git', isDirectory: () => true }
                ];
            }
            return [];
        });

        jest.spyOn(indexer, 'indexFile').mockResolvedValue();

        await indexer.indexProjectSync();

        expect(indexer.indexFile).toHaveBeenCalledTimes(2);
        expect(indexer.indexFile).toHaveBeenCalledWith(path.join('/mock/project', 'app.js'));
        expect(indexer.indexFile).toHaveBeenCalledWith(path.join('/mock/project', 'main.py'));
    });
});
