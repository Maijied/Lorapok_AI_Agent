'use strict';

const ContextAssembler = require('../services/ContextAssembler');
const fs = require('fs');
const path = require('path');

describe('ContextAssembler', () => {
    let assembler;
    let mockIndexer;
    let projectRoot = '/mock/root';

    beforeEach(() => {
        mockIndexer = {
            searchSymbols: jest.fn().mockReturnValue([]),
            searchEmbeddings: jest.fn().mockResolvedValue([])
        };
        assembler = new ContextAssembler({
            indexerService: mockIndexer,
            projectRoot
        });

        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true });
        jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
            if (filePath.includes('README.md')) return 'Mock Readme';
            if (filePath.includes('explicit.js')) return 'const explicit = true;';
            if (filePath.includes('planFile.js')) return 'const plan = true;';
            return 'Mock file content';
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should extract explicit files correctly', () => {
        const prompt = 'Please check the file src/explicit.js and see what is wrong.';
        const files = assembler._extractExplicitFiles(prompt);
        expect(files).toContain(path.resolve(projectRoot, 'src/explicit.js'));
    });

    it('should extract symbol queries correctly', () => {
        const prompt = 'Where is the parseInvoice function defined?';
        const symbols = assembler._extractSymbolQueries(prompt);
        expect(symbols).toContain('parseInvoice');
    });

    it('should assemble context with priority ranking', async () => {
        mockIndexer.searchSymbols.mockReturnValue([{
            name: 'parseInvoice',
            type: 'function',
            startRow: 10,
            endRow: 20,
            filePath: 'src/parser.js'
        }]);

        mockIndexer.searchEmbeddings.mockResolvedValue([{
            file_path: 'src/semantic.js',
            content: 'function semanticMatch() {}'
        }]);

        const prompt = 'Update parseInvoice in src/explicit.js.';
        const result = await assembler.assemble(prompt, ['src/planFile.js']);

        // Explicit file
        expect(result).toContain('[EXPLICIT FILE] src/explicit.js');
        expect(result).toContain('const explicit = true;');
        
        // Plan file
        expect(result).toContain('[PLAN FILE] src/planFile.js');
        expect(result).toContain('const plan = true;');

        // Symbol match
        expect(result).toContain('[SYMBOL MATCH] src/parser.js (function parseInvoice)');
        
        // Semantic match
        expect(result).toContain('[SEMANTIC MATCH] src/semantic.js (Semantic Chunk)');
    });

    it('should fallback to README if no other matches found', async () => {
        const prompt = 'What does this project do?';
        // Mock no explicit files by overriding existsSync for this test
        jest.spyOn(fs, 'existsSync').mockImplementation(p => p.includes('README.md'));
        
        const result = await assembler.assemble(prompt, []);
        
        expect(result).toContain('[PROJECT SUMMARY] README.md');
        expect(result).toContain('Mock Readme');
    });
});
