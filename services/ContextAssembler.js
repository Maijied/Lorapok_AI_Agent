'use strict';

const logger = require('../lib/logger');
const fs = require('fs');
const path = require('path');

class ContextAssembler {
    /**
     * @param {Object} options
     * @param {import('./IndexerService')} options.indexerService
     * @param {string} options.projectRoot
     */
    constructor(options) {
        this.indexerService = options.indexerService;
        this.projectRoot = options.projectRoot;
    }

    /**
     * Parse the user prompt for explicit file mentions.
     * Looks for words that end with common extensions or match files in the project.
     * @param {string} prompt
     * @returns {Array<string>} List of absolute file paths
     */
    _extractExplicitFiles(prompt) {
        const explicitFiles = new Set();
        // Very simple regex for things that look like paths (e.g. src/index.js, lib/core/Plan.js)
        const pathRegex = /([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/g;
        let match;
        while ((match = pathRegex.exec(prompt)) !== null) {
            const possiblePath = match[1];
            const absPath = path.resolve(this.projectRoot, possiblePath);
            const relCheck = path.relative(this.projectRoot, absPath);
            const isInside = relCheck && !relCheck.startsWith('..') && !path.isAbsolute(relCheck);
            if (isInside && fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
                explicitFiles.add(absPath);
            }
        }
        return Array.from(explicitFiles);
    }

    /**
     * Extracts symbol queries from the prompt.
     * e.g., "Where is parseInvoice?" -> "parseInvoice"
     * @param {string} prompt
     * @returns {Array<string>}
     */
    _extractSymbolQueries(prompt) {
        // A naive approach: grab camelCase or snake_case words longer than 3 chars
        const symbols = new Set();
        const words = prompt.replace(/[^\w]/g, ' ').split(/\s+/);
        for (const w of words) {
            if (w.length > 3 && (w.match(/[a-z][A-Z]/) || w.includes('_'))) {
                symbols.add(w);
            }
        }
        return Array.from(symbols);
    }

    /**
     * Assemble context for the LLM based on priority ranking.
     * 1. Explicitly mentioned files
     * 2. Current plan files (passed in)
     * 3. Symbol exact matches
     * 4. Top-K semantic embedding matches
     * 5. Project summary (fallback)
     * 
     * @param {string} prompt - User query
     * @param {Array<string>} [planFiles=[]] - Files touched by the current active plan step
     * @param {number} [maxTokens=8000] - Very rough budget estimate (characters / 4)
     * @returns {Promise<string>} Formatted context string
     */
    async assemble(prompt, planFiles = [], maxTokens = 8000) {
        const contextBlocks = [];
        let estimatedTokens = 0;
        let filesOmitted = 0;

        const addBlock = (title, content, type = 'file') => {
            const block = `\n--- [${type.toUpperCase()}] ${title} ---\n${content}\n`;
            const tokens = Math.ceil(block.length / 4); // rough approximation
            if (estimatedTokens + tokens <= maxTokens) {
                contextBlocks.push(block);
                estimatedTokens += tokens;
                return true;
            } else {
                filesOmitted++;
                return false;
            }
        };

        // 1. Explicitly mentioned files
        const explicitFiles = this._extractExplicitFiles(prompt);
        for (const file of explicitFiles) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relPath = path.relative(this.projectRoot, file).split(path.sep).join('/');
                addBlock(relPath, content, 'explicit file');
            } catch (err) {
                logger.warn(`ContextAssembler: Failed to read explicit file ${file}`);
            }
        }

        // 2. Current plan files
        for (const file of planFiles) {
            const absPath = path.resolve(this.projectRoot, file);
            const relCheck = path.relative(this.projectRoot, absPath);
            const isInside = relCheck && !relCheck.startsWith('..') && !path.isAbsolute(relCheck);
            if (isInside && !explicitFiles.includes(absPath) && fs.existsSync(absPath)) {
                try {
                    const content = fs.readFileSync(absPath, 'utf-8');
                    const relPath = path.relative(this.projectRoot, absPath).split(path.sep).join('/');
                    addBlock(relPath, content, 'plan file');
                } catch (err) {
                    logger.warn(`ContextAssembler: Failed to read plan file ${absPath}: ${err.message}`);
                }
            }
        }

        // 3. Symbol exact matches
        const symbolQueries = this._extractSymbolQueries(prompt);
        for (const sym of symbolQueries) {
            const matches = this.indexerService.searchSymbols(sym);
            for (const match of matches) {
                const title = `${match.filePath} (${match.type} ${match.name})`;
                const snippet = `Line ${match.startRow}-${match.endRow}: ${match.name}`;
                // Avoid duplicating full files if already included
                if (!contextBlocks.some(b => b.includes(`[EXPLICIT FILE] ${match.filePath}`))) {
                    addBlock(title, snippet, 'symbol match');
                }
            }
        }

        // 4. Semantic embeddings matches
        if (estimatedTokens < maxTokens * 0.8) { // Only do embeddings if we have > 20% budget left
            const semanticMatches = await this.indexerService.searchEmbeddings(prompt, 5);
            for (const match of semanticMatches) {
                const title = `${match.file_path} (Semantic Chunk)`;
                // Skip if file already fully included
                if (!contextBlocks.some(b => b.includes(`[EXPLICIT FILE] ${match.file_path}`))) {
                    addBlock(title, match.content, 'semantic match');
                }
            }
        }

        // 5. Project summary (fallback if budget is extremely empty)
        if (contextBlocks.length === 0) {
            const readmePath = path.join(this.projectRoot, 'README.md');
            if (fs.existsSync(readmePath)) {
                const content = fs.readFileSync(readmePath, 'utf-8');
                addBlock('README.md', content.substring(0, 2000), 'project summary');
            }
        }

        let finalContext = contextBlocks.join('');
        if (filesOmitted > 0) {
            finalContext += `\n*Note: ${filesOmitted} files/chunks were omitted to respect the context limit.*\n`;
        }
        
        return finalContext;
    }
}

module.exports = ContextAssembler;
