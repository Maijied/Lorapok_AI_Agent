import re

with open('services/IndexerService.js', 'r') as f:
    code = f.read()

# 1. constructor initFailed
code = code.replace(
    'this.debounceTimers = new Map();',
    'this.debounceTimers = new Map();\n        this.initFailed = false;'
)

# 2. init method
code = code.replace(
    'async init() {\n        try {',
    'async init() {\n        if (this.initFailed) return;\n        try {'
)
code = code.replace(
    'logger.info(\'IndexerService: Initialized LanceDB and Embedding pipeline.\');',
    'logger.info(\'IndexerService: Initialized LanceDB and Embedding pipeline.\');\n            this.initFailed = false;'
)
code = code.replace(
    'logger.error(`IndexerService init failed: ${error.message}`);',
    'logger.error(`IndexerService init failed: ${error.message}`);\n            this.initFailed = true;'
)

# 3. removeFile
code = code.replace(
    'await this.table.delete(`file_path = \'${relPath}\'`);',
    'const escapedPath = relPath.replace(/\'/g, "\'\'");\n                await this.table.delete(`file_path = \'${escapedPath}\'`);'
)

# 4. indexFile readFileSync
code = code.replace(
    '} catch (e) {\n            return; // File might have been deleted right after being changed',
    '} catch (e) {\n            logger.warn(`IndexerService: Failed to read file ${filePath}: ${e.message}`);\n            return; // File might have been deleted right after being changed'
)

# 5. parser TS and traverse
target_traverse = """        const tree = this.parser.parse(content);
        const symbols = [];
        const chunks = [];

        // Simple AST traversal to find classes, functions, and methods
        const traverse = (node) => {
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

                const name = nameNode ? nameNode.text : 'anonymous';"""

replacement_traverse = """        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.ts' || ext === '.tsx') {
            try {
                const TypeScript = require('tree-sitter-typescript').typescript;
                this.parser.setLanguage(TypeScript);
            } catch (e) {
                logger.warn(`IndexerService: Failed to load tree-sitter-typescript. Falling back to JavaScript parser for ${relPath}`);
                this.parser.setLanguage(JavaScript);
            }
        } else {
            this.parser.setLanguage(JavaScript);
        }

        const tree = this.parser.parse(content);
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

                const name = nameNode ? nameNode.text : 'anonymous';"""

code = code.replace(target_traverse, replacement_traverse)

# 6. indexFile delete chunk
code = code.replace(
    '} catch(err) {\n                    // ignore if table is empty or just created\n                }',
    '} catch(err) {\n                    logger.debug(`IndexerService: delete failed for ${relPath}, likely table is empty or just created. Error: ${err.message}`);\n                }'
)

with open('services/IndexerService.js', 'w') as f:
    f.write(code)

