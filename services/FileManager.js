/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Proprietary & Confidential. All Rights Reserved.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { FileSystemError } = require('../lib/errors');

/**
 * Service for safe file system access and manipulation within project boundaries.
 */
class FileManager {
    /**
     * @param {string} [projectRoot=process.cwd()] - Absolute path to project root directory
     */
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = path.resolve(projectRoot);
    }

    /**
     * Security check to ensure requested path stays within project boundary.
     * @param {string} filePath - Path to validate
     * @returns {string} Resolved absolute path
     * @throws {FileSystemError} If path escapes project root
     */
    validatePath(filePath) {
        const resolvedPath = path.resolve(this.projectRoot, filePath);
        const realRoot = fs.existsSync(this.projectRoot) ? fs.realpathSync(this.projectRoot) : this.projectRoot;
        const realResolved = fs.existsSync(resolvedPath) ? fs.realpathSync(resolvedPath) : resolvedPath;

        if (!resolvedPath.startsWith(this.projectRoot) && !realResolved.startsWith(realRoot)) {
            throw new FileSystemError('❌ Access denied: Cannot access files outside project directory', filePath);
        }
        return resolvedPath;
    }

    /**
     * Check if file or directory exists.
     * @param {string} filePath - Path to check
     * @returns {{ success: boolean, data: boolean, error?: string }} Operation result with boolean existence state
     */
    exists(filePath) {
        try {
            const fullPath = this.validatePath(filePath);
            const exists = fs.existsSync(fullPath);
            return { success: true, data: exists };
        } catch (err) {
            return { success: false, data: false, error: err.message || String(err) };
        }
    }

    /**
     * Read file content.
     * @param {string} filePath - Relative or absolute path to read
     * @returns {{ success: boolean, data?: string, error?: string }} Operation result containing file string content
     */
    readFile(filePath) {
        try {
            const fullPath = this.validatePath(filePath);
            if (!fs.existsSync(fullPath)) {
                return { success: false, error: `❌ File not found: ${filePath}` };
            }
            const data = fs.readFileSync(fullPath, 'utf-8');
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Write content to file.
     * @param {string} filePath - Path to file
     * @param {string} content - Content string to write
     * @returns {{ success: boolean, data?: { path: string, bytes: number }, error?: string }} Result status
     */
    writeFile(filePath, content) {
        try {
            const fullPath = this.validatePath(filePath);
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, content, 'utf-8');
            return { success: true, data: { path: filePath, bytes: Buffer.byteLength(content, 'utf-8') } };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Create new file if it does not already exist.
     * @param {string} filePath - Target file path
     * @param {string} [content=''] - Initial file content
     * @returns {{ success: boolean, data?: { path: string }, error?: string }} Creation result
     */
    createFile(filePath, content = '') {
        try {
            const fullPath = this.validatePath(filePath);
            if (fs.existsSync(fullPath)) {
                return { success: false, error: `❌ File already exists: ${filePath}` };
            }
            return this.writeFile(filePath, content);
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Delete file.
     * @param {string} filePath - Target file path
     * @returns {{ success: boolean, data?: { path: string }, error?: string }} Deletion status
     */
    deleteFile(filePath) {
        try {
            const fullPath = this.validatePath(filePath);
            if (!fs.existsSync(fullPath)) {
                return { success: false, error: `❌ File not found: ${filePath}` };
            }
            fs.unlinkSync(fullPath);
            return { success: true, data: { path: filePath } };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Append content to existing or new file.
     * @param {string} filePath - Target file path
     * @param {string} content - Content string to append
     * @returns {{ success: boolean, data?: { path: string }, error?: string }} Result status
     */
    appendFile(filePath, content) {
        try {
            const fullPath = this.validatePath(filePath);
            fs.appendFileSync(fullPath, content, 'utf-8');
            return { success: true, data: { path: filePath } };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * List files in directory.
     * @param {string} [dirPath='.'] - Target directory path
     * @param {Object} [options={}] - Filter options (recursive, extensions)
     * @returns {{ success: boolean, data?: Array<{type: string, path: string}>, error?: string }} Directory entries list
     */
    listFiles(dirPath = '.', options = {}) {
        try {
            const fullPath = this.validatePath(dirPath);
            const { recursive = false, extensions = null } = options;

            if (!fs.existsSync(fullPath)) {
                return { success: false, error: `❌ Directory not found: ${dirPath}` };
            }

            const items = [];

            const scanDir = (currentPath, relativePath = '') => {
                const entries = fs.readdirSync(currentPath, { withFileTypes: true });

                for (const entry of entries) {
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
            return { success: true, data: items };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Get visual file tree representation.
     * @param {string} [dirPath='.'] - Directory path
     * @param {string} [indent=''] - Indentation string for recursive rendering
     * @returns {{ success: boolean, data?: string, error?: string }} Visual tree string result
     */
    getFileTree(dirPath = '.', indent = '') {
        try {
            const treeString = this._buildFileTree(dirPath, indent);
            return { success: true, data: treeString };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Internal helper to build tree string recursively.
     * @private
     */
    _buildFileTree(dirPath = '.', indent = '') {
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
                    tree += this._buildFileTree(path.join(dirPath, entry.name), indent + childIndent);
                } catch {
                    // Skip inaccessible directories
                }
            } else {
                const icon = this.getFileIcon(entry.name).data || '📄';
                tree += `${indent}${prefix}${icon} ${entry.name}\n`;
            }
        });

        return tree;
    }

    /**
     * Get file display icon based on file extension.
     * @param {string} filename - File name or path
     * @returns {{ success: boolean, data: string }} Result containing icon emoji
     */
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
        return { success: true, data: icons[ext] || '📄' };
    }

    /**
     * Get file statistics and metadata info.
     * @param {string} filePath - Target file path
     * @returns {{ success: boolean, data?: { path: string, size: number, created: Date, modified: Date, isDirectory: boolean }, error?: string }} File metadata
     */
    getFileInfo(filePath) {
        try {
            const fullPath = this.validatePath(filePath);
            const stats = fs.statSync(fullPath);
            return {
                success: true,
                data: {
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory()
                }
            };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * View file content with line range slicing and line numbers.
     * @param {string} filePath - Relative or absolute path
     * @param {Object} [options={}] - Options { startLine, endLine }
     * @returns {{ success: boolean, data?: { content: string, startLine: number, endLine: number, totalLines: number }, error?: string }} Result
     */
    viewFile(filePath, options = {}) {
        try {
            const readRes = this.readFile(filePath);
            if (!readRes.success) return readRes;

            const allLines = readRes.data.replace(/\r/g, '').split('\n');
            const totalLines = allLines.length;

            let startLine = parseInt(options.startLine, 10);
            let endLine = parseInt(options.endLine, 10);

            if (isNaN(startLine) || startLine < 1) startLine = 1;
            if (isNaN(endLine) || endLine > totalLines) endLine = totalLines;
            if (endLine < startLine) endLine = startLine;

            const selectedLines = allLines.slice(startLine - 1, endLine);
            const linePaddedWidth = String(endLine).length;

            const numberedLines = selectedLines.map((line, idx) => {
                const lineNum = String(startLine + idx).padStart(linePaddedWidth, ' ');
                return `${lineNum}: ${line}`;
            });

            return {
                success: true,
                data: {
                    content: numberedLines.join('\n'),
                    rawContent: selectedLines.join('\n'),
                    startLine,
                    endLine,
                    totalLines
                }
            };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Perform surgical string replacement inside a file.
     * @param {string} filePath - Target file path
     * @param {string} targetContent - Exact string snippet to find
     * @param {string} replacementContent - New string snippet to put in place
     * @param {Object} [options={}] - Replacement options { allowMultiple }
     * @returns {{ success: boolean, data?: { path: string, replacedCount: number }, error?: string }} Result
     */
    replaceFileContent(filePath, targetContent, replacementContent, options = {}) {
        try {
            const readRes = this.readFile(filePath);
            if (!readRes.success) return readRes;

            const current = readRes.data;
            if (!current.includes(targetContent)) {
                return {
                    success: false,
                    error: `❌ Target content block not found in ${filePath}`
                };
            }

            let updated;
            let replacedCount = 0;

            if (options.allowMultiple) {
                const parts = current.split(targetContent);
                replacedCount = parts.length - 1;
                updated = parts.join(replacementContent);
            } else {
                updated = current.replace(targetContent, replacementContent);
                replacedCount = 1;
            }

            const writeRes = this.writeFile(filePath, updated);
            if (!writeRes.success) return writeRes;

            return {
                success: true,
                data: {
                    path: filePath,
                    replacedCount
                }
            };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Perform multiple non-contiguous string replacements in a single file.
     * @param {string} filePath - Target file path
     * @param {Array<{ targetContent: string, replacementContent: string }>} chunks - Array of replacement chunks
     * @returns {{ success: boolean, data?: { path: string, chunksApplied: number }, error?: string }} Result
     */
    multiReplaceFileContent(filePath, chunks = []) {
        try {
            const readRes = this.readFile(filePath);
            if (!readRes.success) return readRes;

            let current = readRes.data;
            let applied = 0;

            for (const chunk of chunks) {
                if (!chunk || !chunk.targetContent || typeof chunk.replacementContent !== 'string') continue;
                if (!current.includes(chunk.targetContent)) {
                    return {
                        success: false,
                        error: `❌ Target content chunk not found in ${filePath}: "${chunk.targetContent.slice(0, 30)}..."`
                    };
                }
                current = current.replace(chunk.targetContent, chunk.replacementContent);
                applied++;
            }

            const writeRes = this.writeFile(filePath, current);
            if (!writeRes.success) return writeRes;

            return {
                success: true,
                data: {
                    path: filePath,
                    chunksApplied: applied
                }
            };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }


    /**
     * High-performance grep search across project workspace.
     * @param {string} query - Text or regex pattern to find
     * @param {string} [searchPath='.'] - Search directory path
     * @param {Object} [options={}] - Options { isRegex, caseInsensitive, includes, matchPerLine, limit }
     * @returns {{ success: boolean, data?: Array<{ filename: string, lineNumber: number, lineContent: string }>, error?: string }} Results
     */
    grepSearch(query, searchPath = '.', options = {}) {
        try {
            const {
                isRegex = false,
                caseInsensitive = true,
                includes = [],
                matchPerLine = true,
                limit = 50
            } = options;

            const listRes = this.listFiles(searchPath, { recursive: true });
            if (!listRes.success) return listRes;

            const matches = [];
            const flags = caseInsensitive ? 'i' : '';
            const regex = isRegex
                ? new RegExp(query, flags)
                : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

            for (const item of listRes.data) {
                if (item.type !== 'file') continue;
                if (matches.length >= limit) break;

                if (includes.length > 0) {
                    const ext = path.extname(item.path).slice(1);
                    if (!includes.some(inc => inc.endsWith(ext) || item.path.includes(inc))) {
                        continue;
                    }
                }

                const readRes = this.readFile(item.path);
                if (!readRes.success || typeof readRes.data !== 'string') continue;

                const lines = readRes.data.replace(/\r/g, '').split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (matches.length >= limit) break;
                    if (regex.test(lines[i])) {
                        if (matchPerLine) {
                            matches.push({
                                filename: item.path,
                                lineNumber: i + 1,
                                lineContent: lines[i].trim()
                            });
                        } else {
                            matches.push({ filename: item.path });
                            break;
                        }
                    }
                }
            }

            return { success: true, data: matches };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }

    /**
     * Search files by regex pattern string.
     * @param {string} pattern - Search pattern
     * @param {string} [dirPath='.'] - Base directory path
     * @returns {{ success: boolean, data?: Array<{type: string, path: string}>, error?: string }} Search results
     */
    searchFiles(pattern, dirPath = '.') {
        try {
            const listRes = this.listFiles(dirPath, { recursive: true });
            if (!listRes.success) return listRes;
            const regex = new RegExp(pattern, 'i');
            const matches = listRes.data.filter(f => regex.test(f.path));
            return { success: true, data: matches };
        } catch (err) {
            return { success: false, error: err.message || String(err) };
        }
    }
}

module.exports = FileManager;

