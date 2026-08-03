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
        jest.spyOn(console, 'error').mockImplementation(() => {});

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
});
