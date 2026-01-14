const fs = require('fs');
const path = require('path');

class FileManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = path.resolve(projectRoot);
    }

    // Security: Ensure path is within project
    validatePath(filePath) {
        const resolvedPath = path.resolve(this.projectRoot, filePath);
        if (!resolvedPath.startsWith(this.projectRoot)) {
            throw new Error('❌ Access denied: Cannot access files outside project directory');
        }
        return resolvedPath;
    }

    // Check if file exists
    exists(filePath) {
        try {
            const fullPath = this.validatePath(filePath);
            return fs.existsSync(fullPath);
        } catch {
            return false;
        }
    }

    // Read file content
    readFile(filePath) {
        const fullPath = this.validatePath(filePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`❌ File not found: ${filePath}`);
        }
        return fs.readFileSync(fullPath, 'utf-8');
    }

    // Write file content
    writeFile(filePath, content) {
        const fullPath = this.validatePath(filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, 'utf-8');
        return true;
    }

    // Create new file
    createFile(filePath, content = '') {
        const fullPath = this.validatePath(filePath);
        if (fs.existsSync(fullPath)) {
            throw new Error(`❌ File already exists: ${filePath}`);
        }
        return this.writeFile(filePath, content);
    }

    // Delete file
    deleteFile(filePath) {
        const fullPath = this.validatePath(filePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`❌ File not found: ${filePath}`);
        }
        fs.unlinkSync(fullPath);
        return true;
    }

    // Append to file
    appendFile(filePath, content) {
        const fullPath = this.validatePath(filePath);
        fs.appendFileSync(fullPath, content, 'utf-8');
        return true;
    }

    // List files in directory
    listFiles(dirPath = '.', options = {}) {
        const fullPath = this.validatePath(dirPath);
        const { recursive = false, extensions = null } = options;

        if (!fs.existsSync(fullPath)) {
            throw new Error(`❌ Directory not found: ${dirPath}`);
        }

        const items = [];

        const scanDir = (currentPath, relativePath = '') => {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                // Skip hidden files/dirs and common ignore patterns
                if (entry.name.startsWith('.') ||
                    entry.name === 'node_modules' ||
                    entry.name === '__pycache__') {
                    continue;
                }

                const entryPath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    items.push({ type: 'directory', path: entryPath });
                    if (recursive) {
                        scanDir(path.join(currentPath, entry.name), entryPath);
                    }
                } else {
                    if (extensions) {
                        const ext = path.extname(entry.name).slice(1);
                        if (!extensions.includes(ext)) continue;
                    }
                    items.push({ type: 'file', path: entryPath });
                }
            }
        };

        scanDir(fullPath);
        return items;
    }

    // Get file tree as string
    getFileTree(dirPath = '.', indent = '') {
        const fullPath = this.validatePath(dirPath);
        let tree = '';

        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const filtered = entries.filter(e =>
            !e.name.startsWith('.') &&
            e.name !== 'node_modules' &&
            e.name !== '__pycache__'
        );

        filtered.forEach((entry, idx) => {
            const isLast = idx === filtered.length - 1;
            const prefix = isLast ? '└── ' : '├── ';
            const childIndent = isLast ? '    ' : '│   ';

            if (entry.isDirectory()) {
                tree += `${indent}${prefix}📁 ${entry.name}\n`;
                try {
                    tree += this.getFileTree(path.join(dirPath, entry.name), indent + childIndent);
                } catch {
                    // Skip inaccessible directories
                }
            } else {
                const icon = this.getFileIcon(entry.name);
                tree += `${indent}${prefix}${icon} ${entry.name}\n`;
            }
        });

        return tree;
    }

    // Get file icon based on extension
    getFileIcon(filename) {
        const ext = path.extname(filename).slice(1);
        const icons = {
            'js': '📜', 'ts': '📘', 'jsx': '⚛️', 'tsx': '⚛️',
            'py': '🐍', 'java': '☕', 'go': '🔵', 'rs': '🦀',
            'php': '🐘', 'rb': '💎', 'c': '🔧', 'cpp': '🔧',
            'h': '📋', 'css': '🎨', 'html': '🌐', 'json': '📦',
            'md': '📝', 'txt': '📄', 'yml': '⚙️', 'yaml': '⚙️',
            'sh': '🖥️', 'sql': '🗃️', 'env': '🔐'
        };
        return icons[ext] || '📄';
    }

    // Get file info
    getFileInfo(filePath) {
        const fullPath = this.validatePath(filePath);
        const stats = fs.statSync(fullPath);
        return {
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory()
        };
    }

    // Search files by name pattern
    searchFiles(pattern, dirPath = '.') {
        const files = this.listFiles(dirPath, { recursive: true });
        const regex = new RegExp(pattern, 'i');
        return files.filter(f => regex.test(f.path));
    }
}

module.exports = FileManager;
