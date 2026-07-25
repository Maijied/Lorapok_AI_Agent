/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const { LorapokCodingAgent, MODELS } = require('./agent');
const FileManager = require('../services/FileManager');
const GitManager = require('../services/GitManager');
const path = require('path');
const fs = require('fs');

/**
 * Enhanced agent extending LorapokCodingAgent with integrated file, Git, and workflow capabilities.
 */
class LorapokEnhancedAgent extends LorapokCodingAgent {
    /**
     * @param {string} apiKey - Perplexity API Key
     * @param {string} [projectRoot=process.cwd()] - Working project root path
     */
    constructor(apiKey, projectRoot = process.cwd()) {
        super(apiKey);
        this.fileManager = new FileManager(projectRoot);
        this.gitManager = new GitManager(projectRoot);
        this.projectRoot = projectRoot;
    }

    // ==================== FILE OPERATIONS ====================

    /**
     * List all project files recursively.
     * @param {Object} [options={}] - Filter options
     * @returns {Array<Object>} List of file objects
     */
    listProjectFiles(options = {}) {
        const res = this.fileManager.listFiles('.', { recursive: true, ...options });
        return res.success ? res.data : [];
    }

    /**
     * Return a visual tree structure of the project.
     * @returns {string} Visual tree string
     */
    showFileTree() {
        const res = this.fileManager.getFileTree('.');
        return res.success ? res.data : '';
    }

    /**
     * Read and analyze a specific file using the AI's analyzeCode logic.
     * @param {string} filePath - Path to file to read and analyze
     * @returns {Promise<Object>} Analysis result
     */
    async readAndAnalyzeFile(filePath) {
        try {
            const readRes = this.fileManager.readFile(filePath);
            if (!readRes.success) {
                return { success: false, error: readRes.error };
            }
            const language = this.detectLanguage(filePath);
            return this.analyzeCode(readRes.data, language);
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Enhanced Proactive Code Generation.
     * @param {string} objective - High level objective description
     * @param {Object|string} [context={}] - Context metadata or language string
     * @param {string} [frameworkOpt=''] - Framework string
     * @returns {Promise<Object>} Response object containing action blocks
     */
    async generateCode(objective, context = {}, frameworkOpt = '') {
        let language = '';
        let framework = '';
        
        if (typeof context === 'string') {
            language = context || this.config.getLanguage();
            framework = frameworkOpt || '';
        } else {
            language = context.language || this.config.getLanguage();
            framework = context.framework || '';
        }
        
        const fileTree = this.showFileTree();

        const prompt = `Objective: ${objective}
        
Current Project Structure:
${fileTree}

Please implement this objective by performing specific file actions. 
You MUST format your response using these strict action blocks:

ACTION: CREATE FILE: path/to/new_file
\`\`\`${language}
// complete new code here
\`\`\`

ACTION: UPDATE FILE: path/to/existing_file
\`\`\`${language}
// complete updated code here
\`\`\`

ACTION: DELETE FILE: path/to/delete_file

Requirements:
1. Provide ONLY necessary actions.
2. Always provide the COMPLETE code for CREATE and UPDATE actions.
3. Don't use placeholders.
4. Ensure paths are relative to project root.`;

        return this.chat(prompt, null, { ...context, language, framework, task: 'generate-proactive', fileTree });
    }

    /**
     * Parse AI response for proactive file actions and command executions.
     * @param {string} content - Raw AI output content string
     * @returns {Array<{ type: string, filePath?: string, description?: string, content: string }>} Parsed action blocks
     */
    parseActions(content) {
        const actions = [];
        const lines = content.split('\n');
        let currentAction = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            const fileActionRegex = /^(?:\*\*|)?ACTION:\s*(CREATE|UPDATE|DELETE)\s*FILE:\s*([^*`\s]+)(?:\*\*|)?/i;
            const commandActionRegex = /^(?:\*\*|)?ACTION:\s*RUN\s*COMMAND:\s*(.+?)(?:\*\*|)?$/i;

            const fileMatch = line.match(fileActionRegex);
            if (fileMatch) {
                const [_, type, filePath] = fileMatch;
                currentAction = {
                    type: type.toUpperCase(),
                    filePath: filePath.trim(),
                    content: ''
                };
                actions.push(currentAction);
                if (type.toUpperCase() === 'DELETE') currentAction = null;
            } else {
                const cmdMatch = line.match(commandActionRegex);
                if (cmdMatch) {
                    const [_, description] = cmdMatch;
                    currentAction = {
                        type: 'COMMAND',
                        description: description.trim().replace(/\*\*$/g, ''),
                        content: ''
                    };
                    actions.push(currentAction);
                } else if (currentAction) {
                    if (line.startsWith('```')) {
                        let codeLines = [];
                        i++;
                        while (i < lines.length && !lines[i].trim().startsWith('```')) {
                            codeLines.push(lines[i]);
                            i++;
                        }
                        currentAction.content = codeLines.join('\n').trim();
                        currentAction = null;
                    }
                }
            }
        }
        return actions;
    }

    /**
     * Legacy method for generating and writing a file.
     * @param {string} filePath - Target file path
     * @param {string} description - File content objective
     * @param {string|null} [language=null] - Target language
     * @returns {Promise<Object>} Generation status
     */
    async generateFile(filePath, description, language = null) {
        language = language || this.detectLanguage(filePath) || this.config.getLanguage();
        const prompt = `Generate code for ${filePath}: ${description}`;
        const res = await this.chat(prompt, null, { language, task: 'generate-file' });

        if (res.success) {
            let code = res.content;
            const match = code.match(/```[\w]*\n([\s\S]*?)```/);
            if (match) code = match[1];
            this.fileManager.writeFile(filePath, code);
            return { success: true, path: filePath, content: code };
        }
        return res;
    }

    /**
     * Update an existing file based on specific requested changes.
     * @param {string} filePath - Path to target file
     * @param {string} changes - Description of changes to make
     * @returns {Promise<Object>} Update result
     */
    async updateFile(filePath, changes) {
        const readRes = this.fileManager.readFile(filePath);
        const currentContent = readRes.success ? readRes.data : '';
        const language = this.detectLanguage(filePath);

        const prompt = `Update this ${language} code based on the following changes:

Current code in ${filePath}:
\`\`\`${language}
${currentContent}
\`\`\`

Changes requested: ${changes}

Provide the complete updated code with all changes applied.`;

        const response = await this.chat(prompt, null, { language, task: 'update-file' });

        if (response.success) {
            let code = response.content;
            const match = code.match(/```[\w]*\n([\s\S]*?)```/);
            if (match) code = match[1];

            this.fileManager.writeFile(filePath, code);
            return { success: true, path: filePath, content: code };
        }

        return response;
    }

    /**
     * Detect programming language from file extension.
     * @param {string} filePath - File path string
     * @returns {string} Detected language identifier
     */
    detectLanguage(filePath) {
        if (filePath.toLowerCase().includes('dockerfile')) return 'dockerfile';
        if (filePath.toLowerCase().includes('makefile')) return 'makefile';
        const ext = path.extname(filePath).toLowerCase().slice(1);
        const langMap = {
            'js': 'javascript', 'jsx': 'javascript',
            'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'java': 'java', 'go': 'go',
            'rs': 'rust', 'php': 'php', 'rb': 'ruby',
            'c': 'c', 'cpp': 'cpp', 'cs': 'csharp',
            'html': 'html', 'css': 'css', 'sql': 'sql',
            'sh': 'bash', 'yml': 'yaml', 'yaml': 'yaml',
            'json': 'json', 'md': 'markdown', 'dockerfile': 'dockerfile',
            'tf': 'hcl', 'hcl': 'hcl', 'dart': 'dart', 'swift': 'swift',
            'kt': 'kotlin', 'kotlin': 'kotlin', 'scala': 'scala',
            'pl': 'perl', 'perl': 'perl', 'r': 'r',
            'hs': 'haskell', 'haskell': 'haskell', 'lua': 'lua',
            'clj': 'clojure', 'ex': 'elixir', 'erl': 'erlang',
            'fs': 'fsharp', 'ps1': 'powershell',
            'asm': 'asm', 's': 'asm', 'cmake': 'cmake', 'nix': 'nix', 'zig': 'zig',
            'groovy': 'groovy', 'ml': 'ocaml', 'elm': 'elm', 'lisp': 'lisp',
            'vue': 'vue', 'svelte': 'svelte', 'scss': 'scss', 'sass': 'sass', 'less': 'less',
            'xml': 'xml', 'toml': 'toml', 'graphql': 'graphql', 'gql': 'graphql',
            'proto': 'proto', 'thrift': 'thrift', 'jl': 'julia', 'sas': 'sas',
            'sol': 'solidity', 'pas': 'pascal', 'pro': 'prolog', 'd': 'd',
            'cr': 'crystal', 'cbl': 'cobol'
        };
        return langMap[ext] || 'javascript';
    }

    // ==================== GIT OPERATIONS ====================

    /**
     * Get formatted status object for current Git repo.
     * @returns {Object} Git status result
     */
    getGitStatus() {
        return this.gitManager.getFormattedStatus();
    }

    /**
     * Stage files and commit with message.
     * @param {string} message - Commit message
     * @param {string} [files='.'] - Target file pattern
     * @returns {Promise<Object>} Commit result
     */
    async commitChanges(message, files = '.') {
        const addResult = this.gitManager.add(files, { verbose: false });
        if (!addResult.success) return addResult;

        return this.gitManager.commit(message, { verbose: false });
    }

    /**
     * Ask AI to inspect diff and generate a git commit message.
     * @returns {Promise<{ success: boolean, message?: string, error?: string }>} Commit message result
     */
    async generateCommitMessage() {
        const status = this.getGitStatus();
        const total = status.data?.total !== undefined ? status.data.total : status.total;
        if (!status.success || total === 0) {
            return { success: false, error: 'No changes found to commit.' };
        }

        const diff = this.gitManager.getDiff();
        const files = status.data?.files || status.files || [];
        const filesChanged = files.map(f => `${f.status}: ${f.file}`).join('\n');
        const diffText = diff.data || diff.output || 'No diff content';

        const prompt = `Generate a concise git commit message for these changes:

Files changed:
${filesChanged}

Diff preview:
${diffText.substring(0, 1000)}

Format: type(scope): description`;

        const response = await this.chat(prompt, null, { task: 'commit-message' });

        if (response.success) {
            const message = response.content.split('\n')[0].replace(/^["'`]+|["'`]+$/g, '').trim();
            return { success: true, message };
        }

        return response;
    }

    /**
     * Generate commit message via AI and commit staged/unstaged changes.
     * @param {string} [files='.'] - Target files pattern
     * @returns {Promise<Object>} Smart commit result
     */
    async smartCommit(files = '.') {
        const msgRes = await this.generateCommitMessage();
        if (!msgRes.success) return msgRes;

        const res = await this.commitChanges(msgRes.message, files);
        return { success: res.success, message: msgRes.message, output: res.output || res.data, error: res.error };
    }

    /**
     * Push commits to remote branch.
     * @param {string} [branch='main'] - Target branch name
     * @returns {Object} Push result
     */
    pushToGit(branch = 'main') { return this.gitManager.push(branch); }

    /**
     * Pull commits from remote branch.
     * @param {string} [branch='main'] - Target branch name
     * @returns {Object} Pull result
     */
    pullFromGit(branch = 'main') { return this.gitManager.pull(branch); }

    /**
     * Create new Git branch.
     * @param {string} name - Branch name
     * @returns {Object} Operation status
     */
    createGitBranch(name) { return this.gitManager.createBranch(name); }

    /**
     * Switch to branch.
     * @param {string} name - Target branch name
     * @returns {Object} Operation status
     */
    switchGitBranch(name) { return this.gitManager.switchBranch(name); }

    /**
     * List all branches.
     * @returns {Object} Branches list result
     */
    listGitBranches() { return this.gitManager.getBranches(); }

    /**
     * Get commit log history.
     * @param {number} [count=10] - Number of commits
     * @returns {Object} Commit history result
     */
    getGitLog(count = 10) { return this.gitManager.getLog(count); }

    // ==================== WORKFLOWS ====================

    /**
     * Generate detailed technical implementation plan.
     * @param {string} objective - Goal objective
     * @param {Object} [context={}] - Metadata context
     * @returns {Promise<Object>} Chat response payload
     */
    async plan(objective, context = {}) {
        const prompt = `Objective: ${objective}
        
Please provide a detailed technical implementation plan. 
Include:
1. 🎯 **Goal Description**
2. 📝 **Proposed Changes**
3. ⚠️ **Potential Risks**

Return as professional markdown.`;
        return this.chat(prompt, null, { ...context, task: 'planning' });
    }

    /**
     * Break down implementation plan into actionable task checklist.
     * @param {string} planContent - Plan content string
     * @param {Object} [context={}] - Metadata context
     * @returns {Promise<Object>} Task list chat payload
     */
    async tasks(planContent, context = {}) {
        const prompt = `Based on this plan:
${planContent}

Break it down into a granular task checklist for implementation.
Return as a markdown list with checkboxes [ ].`;
        return this.chat(prompt, null, { ...context, task: 'tasking' });
    }

    /**
     * Generate summary walkthrough of completed implementation.
     * @param {Object} results - Completed results metadata
     * @param {Object} [context={}] - Metadata context
     * @returns {Promise<Object>} Walkthrough payload
     */
    async summarize(results, context = {}) {
        const prompt = `Summarize the work completed:
${JSON.stringify(results)}

Objective: ${results.objective || 'Implementation'}

Provide a detailed "Walkthrough" of what was accomplished and how the user can verify it.`;
        return this.chat(prompt, null, { ...context, task: 'summarizing' });
    }

    /**
     * Analyze codebase architecture and sample key files.
     * @param {Object} [context={}] - Options context
     * @returns {Promise<Object>} Analysis result payload
     */
    async analyzeProject(context = {}) {
        const files = this.listProjectFiles({ extensions: ['js', 'ts', 'json', 'md'] });
        const codeFiles = files.filter(f => f.type === 'file').slice(0, 5);

        let codePreview = '';
        for (const file of codeFiles) {
            try {
                const readRes = this.fileManager.readFile(file.path);
                if (readRes.success) {
                    codePreview += `\n--- FILE: ${file.path} ---\n${readRes.data.substring(0, 500)}...\n`;
                }
            } catch (e) { }
        }

        const prompt = `Analyze this project and provide professional insights:

Structure:
${this.showFileTree()}

Key File Samples:
${codePreview}

Provide:
1. **Overview**: Project purpose and tech stack.
2. **Quality**: Code quality and pattern assessment.
3. **Architecture**: Suggestions for scaling.
4. **Roadmap**: Immediate potential improvements.`;

        return this.chat(prompt, null, { ...context, task: 'project-analysis' });
    }
}

module.exports = { LorapokEnhancedAgent, MODELS };