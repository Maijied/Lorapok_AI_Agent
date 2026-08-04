'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');
const lancedb = require('vectordb');
let Parser, JavaScript;
try {
    Parser = require('tree-sitter');
    JavaScript = require('tree-sitter-javascript');
} catch (e) {
    // Tree-sitter native modules might fail to install on some CI environments (e.g., Windows)
    Parser = null;
    JavaScript = null;
}
const logger = require('../lib/logger');

// Regex for broadly supported code and text extensions
const SUPPORTED_EXTENSIONS = /\.(js|jsx|ts|tsx|py|rb|go|rs|java|c|cpp|h|hpp|cs|swift|php|sh|md|json|yml|yaml|xml|html|css|scss|sql)$/i;

// Dynamically require transformers since it might be heavy and we want to lazy load
let transformersModule = null;

class IndexerService {
    /**
     * @param {Object} options
     * @param {string} options.projectRoot - Project root path
     * @param {string} [options.dbPath] - LanceDB storage path
     */
    constructor(options) {
        this.projectRoot = options.projectRoot;
        this.dbPath = options.dbPath || path.join(this.projectRoot, '.lorapok', 'lancedb');
        this.db = null;
        this.table = null;
        this.watcher = null;
        this.symbolIndex = new Map(); // filePath -> array of symbols
        this.pipeline = null;
        if (Parser && JavaScript) {
            this.parser = new Parser();
            this.parser.setLanguage(JavaScript);
        } else {
            this.parser = null;
        }
        this.debounceTimers = new Map();
        this.initFailed = false;
        
        // Ensure db directory exists
        if (!fs.existsSync(path.dirname(this.dbPath))) {
            fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
        }
    }

    /**
     * Initialize the database and embedding pipeline.
     */
    async init() {
        if (this.initFailed) return;
        try {
            this.db = await lancedb.connect(this.dbPath);
            
            // Try to open existing table, or create new one
            try {
                this.table = await this.db.openTable('code_chunks');
            } catch (err) {
                // Table doesn't exist, we'll create it on first insert
                this.table = null;
            }

            if (!transformersModule) {
                transformersModule = require('@xenova/transformers');
            }
            const { pipeline } = transformersModule;
            // Use a lightweight, fast embedding model
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            logger.info('IndexerService: Initialized LanceDB and Embedding pipeline.');
            this.initFailed = false;
        } catch (error) {
            logger.error(`IndexerService init failed: ${error.message}`);
            this.initFailed = true;
        }
    }

    /**
     * Start the incremental file watcher.
     * Initializes the watcher to listen for file additions, changes, and deletions,
     * triggering the indexer appropriately while ignoring configured paths.
     */
    startWatching() {
        if (this.watcher) return;
        
        // Basic filter: ignore node_modules, .git, .lorapok, etc.
        this.watcher = chokidar.watch(this.projectRoot, {
            ignored: [
                /(^|[\/\\])\../,          // dotfiles
                /node_modules/,
                /dist/,
                /build/,
                /coverage/,
                /\.lorapok/
            ],
            persistent: true,
            ignoreInitial: false
        });

        this.watcher
            .on('add', filePath => this.queueIndex(filePath))
            .on('change', filePath => this.queueIndex(filePath))
            .on('unlink', filePath => this.removeFile(filePath));
            
        logger.info('IndexerService: Watching project files for incremental indexing.');
    }

    /**
     * Stop watching.
     * Closes the active file watcher and clears the reference.
     */
    stopWatching() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }

    /**
     * Queue a file for indexing. Uses a debounce mechanism to avoid rapid re-indexing.
     * Only processes JS, JSX, TS, and TSX files.
     * 
     * @param {string} filePath - The absolute path of the file to queue for indexing.
     */
    queueIndex(filePath) {
        // Index a wide variety of code and text files
        if (!SUPPORTED_EXTENSIONS.test(filePath)) return;

        const relPath = path.relative(this.projectRoot, filePath);
        if (this.debounceTimers.has(relPath)) {
            clearTimeout(this.debounceTimers.get(relPath));
        }

        const timer = setTimeout(() => {
            this.indexFile(filePath).catch(err => 
                logger.error(`Failed to index ${relPath}: ${err.message}`)
            );
            this.debounceTimers.delete(relPath);
        }, 500);

        this.debounceTimers.set(relPath, timer);
    }

    /**
     * Remove a file from both the symbol index and the semantic database.
     * 
     * @param {string} filePath - The absolute path of the file to remove.
     * @returns {Promise<void>}
     */
    async removeFile(filePath) {
        const relPath = path.relative(this.projectRoot, filePath);
        this.symbolIndex.delete(relPath);
        
        if (this.table) {
            try {
                const escapedPath = relPath.replace(/'/g, "''");
                await this.table.delete(`file_path = '${escapedPath}'`);
                logger.info(`IndexerService: Removed ${relPath} from index.`);
            } catch (err) {
                logger.warn(`Failed to remove ${relPath} from LanceDB: ${err.message}`);
            }
        }
    }

    /**
     * Parse and chunk a file, extract symbols, and generate embeddings.
     * Handles both Tree-sitter AST parsing and regex-based fallbacks.
     * 
     * @param {string} filePath - The absolute path of the file to index.
     * @returns {Promise<void>}
     */
    async indexFile(filePath) {
        if (!this.pipeline || !this.db) await this.init();

        const relPath = path.relative(this.projectRoot, filePath);
        let content;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
            logger.warn(`IndexerService: Failed to read file ${filePath}: ${e.message}`);
            return; // File might have been deleted right after being changed
        }

        if (this.parser) {
            this.parser.setLanguage(JavaScript);
        }

        let tree = null;
        if (this.parser && /\.(js|jsx|ts|tsx)$/i.test(filePath)) {
            try {
                tree = this.parser.parse(content);
            } catch (e) {
                logger.debug(`IndexerService: Failed to parse ${filePath}: ${e.message}`);
            }
        }

        const symbols = [];
        const chunks = [];

        // Simple AST traversal to find classes, functions, and methods
        const traverse = (node) => {
            if (!node) return;
            if (
                node.type === 'class_declaration' ||
                node.type === 'function_declaration' ||
                node.type === 'method_definition' ||
                node.type === 'arrow_function'
            ) {
                // Find the identifier (name)
                let nameNode = null;
                for (let i = 0; i < node.childCount; i++) {
                    const child = node.child(i);
                    if (child.type === 'identifier' || child.type === 'property_identifier') {
                        nameNode = child;
                        break;
                    }
                }
                
                if (!nameNode && node.type === 'arrow_function') {
                    const parent = node.parent;
                    if (parent && (parent.type === 'variable_declarator' || parent.type === 'assignment_expression')) {
                        for (let i = 0; i < parent.childCount; i++) {
                            const child = parent.child(i);
                            if (child.type === 'identifier' || child.type === 'property_identifier') {
                                nameNode = child;
                                break;
                            }
                        }
                    }
                }

                const name = nameNode ? nameNode.text : 'anonymous';
                const type = node.type.split('_')[0]; // class, function, method
                
                symbols.push({
                    name,
                    type,
                    startRow: node.startPosition.row + 1,
                    endRow: node.endPosition.row + 1
                });

                // Create a semantic chunk out of this node's full text
                const chunkText = node.text;
                // Avoid indexing tiny chunks
                if (chunkText.length > 50) {
                    chunks.push({
                        id: crypto.randomUUID(),
                        file_path: relPath,
                        symbol_name: name,
                        symbol_type: type,
                        content: chunkText,
                        start_line: node.startPosition.row + 1,
                        end_line: node.endPosition.row + 1
                    });
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                traverse(node.child(i));
            }
        };

        if (tree && tree.rootNode) {
            traverse(tree.rootNode);
        }

        // Fallback: if tree-sitter didn't find anything (e.g. native parser not available in runner),
        // fall back to lightweight regex-based symbol extraction so tests and environments without
        // tree-sitter can still get basic symbol info.
        if (symbols.length === 0) {
            try {
                // function declarations: function name(
                const funcRe = /function\s+([A-Za-z0-9_$]+)\s*\(/g;
                let m;
                while ((m = funcRe.exec(content)) !== null) {
                    const startRow = content.slice(0, m.index).split('\n').length;
                    symbols.push({
                        name: m[1],
                        type: 'function',
                        startRow,
                        endRow: startRow
                    });
                }

                // class declarations: class Name
                const classRe = /class\s+([A-Za-z0-9_$]+)/g;
                while ((m = classRe.exec(content)) !== null) {
                    const startRow = content.slice(0, m.index).split('\n').length;
                    symbols.push({
                        name: m[1],
                        type: 'class',
                        startRow,
                        endRow: startRow
                    });
                }

                // arrow functions assigned to a variable: const name = (...) =>
                const arrowRe = /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*\(?[\s\S]*?=>/g;
                while ((m = arrowRe.exec(content)) !== null) {
                    const startRow = content.slice(0, m.index).split('\n').length;
                    symbols.push({
                        name: m[1],
                        type: 'arrow_function',
                        startRow,
                        endRow: startRow
                    });
                }
                
                // Other languages (python, go, rust): def/func/fn name(
                const otherFuncRe = /(?:def|func|fn)\s+([A-Za-z0-9_]+)\s*\(/g;
                while ((m = otherFuncRe.exec(content)) !== null) {
                    const startRow = content.slice(0, m.index).split('\n').length;
                    symbols.push({
                        name: m[1],
                        type: 'function',
                        startRow,
                        endRow: startRow
                    });
                }
            } catch (err) {
                // If regex fallback somehow fails, log but continue — we don't want tests to crash.
                logger.debug(`IndexerService: regex fallback failed: ${err.message}`);
            }
        }

        // Update symbol index
        this.symbolIndex.set(relPath, symbols);
        // use logger.debug rather than console.error to avoid Jest noise
        logger.debug(`IndexerService: symbol count for ${relPath}: ${symbols.length}`);

        if (chunks.length > 0) {
            // Compute embeddings
            const texts = chunks.map(c => c.content);
            const output = await this.pipeline(texts, { pooling: 'mean', normalize: true });
            
            // output is a tensor, we need to extract arrays.
            // Xenova transformers returns a tensor of shape [batch_size, embedding_dim]
            const embeddings = output.tolist();

            const records = chunks.map((chunk, i) => ({
                id: chunk.id,
                file_path: chunk.file_path,
                symbol_name: chunk.symbol_name,
                symbol_type: chunk.symbol_type,
                content: chunk.content,
                start_line: chunk.start_line,
                end_line: chunk.end_line,
                vector: embeddings[i]
            }));

            // Remove old chunks for this file
            if (this.table) {
                try {
                    const escapedPath = relPath.replace(/'/g, "''");
                await this.table.delete(`file_path = '${escapedPath}'`);
                } catch(err) {
                    logger.debug(`IndexerService: delete failed for ${relPath}, likely table is empty or just created. Error: ${err.message}`);
                }
            }

            // Insert new records
            if (!this.table) {
                this.table = await this.db.createTable('code_chunks', records);
            } else {
                await this.table.add(records);
            }
            logger.info(`IndexerService: Indexed ${relPath} (${chunks.length} chunks)`);
        }
    }

    /**
     * Search the embedding index.
     * @param {string} query
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async searchEmbeddings(query, limit = 5) {
        if (!this.table || !this.pipeline) return [];
        try {
            const output = await this.pipeline(query, { pooling: 'mean', normalize: true });
            const queryVector = output.tolist()[0];
            const results = await this.table.search(queryVector).limit(limit).execute();
            return results;
        } catch (error) {
            logger.error(`IndexerService search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Search the symbol index for an exact match.
     * @param {string} query
     * @returns {Array}
     */
    searchSymbols(query) {
        const matches = [];
        const target = query.toLowerCase();
        for (const [filePath, symbols] of this.symbolIndex.entries()) {
            for (const sym of symbols) {
                if (sym.name.toLowerCase() === target || sym.name.toLowerCase().includes(target)) {
                    matches.push({
                        filePath,
                        ...sym
                    });
                }
            }
        }
        return matches;
    }
    
    /**
     * Synchronously await full project indexing.
     * Useful for initial bootstrapping by recursively walking the project directory.
     * 
     * @returns {Promise<void>}
     */
    async indexProjectSync() {
        logger.info('Starting full project index...');
        const walk = (dir) => {
            let results = [];
            const list = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of list) {
                const fullPath = path.join(dir, entry.name);
                // exclude hidden files/dirs (like .git, .env) and node_modules
                if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === 'coverage') {
                    continue;
                }
                if (entry.isDirectory()) {
                    results = results.concat(walk(fullPath));
                } else {
                    if (SUPPORTED_EXTENSIONS.test(fullPath)) {
                        results.push(fullPath);
                    }
                }
            }
            return results;
        };
        
        const files = walk(this.projectRoot);
        for (const f of files) {
            await this.indexFile(f);
        }
        logger.info(`Completed full project index (${files.length} files).`);
    }
}

module.exports = IndexerService;
