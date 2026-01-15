const { LorapokCodingAgent, MODELS } = require('./agent');
const FileManager = require('../services/FileManager');
const GitManager = require('../services/GitManager');
const path = require('path');
const fs = require('fs');

class LorapokEnhancedAgent extends LorapokCodingAgent {
    constructor(apiKey, projectRoot = process.cwd()) {
        super(apiKey);
        this.fileManager = new FileManager(projectRoot);
        this.gitManager = new GitManager(projectRoot);
        this.projectRoot = projectRoot;
    }

    // ==================== FILE OPERATIONS ====================

    /**
     * List all project files recursively
     */
    listProjectFiles(options = {}) {
        return this.fileManager.listFiles('.', { recursive: true, ...options });
    }

    /**
     * Return a visual tree structure of the project
     */
    showFileTree() {
        return this.fileManager.getFileTree('.');
    }

    /**
     * Read and analyze a specific file using the AI's analyzeCode logic
     */
    async readAndAnalyzeFile(filePath) {
        try {
            const content = this.fileManager.readFile(filePath);
            const language = this.detectLanguage(filePath);
            return this.analyzeCode(content, language);
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Enhanced Proactive Code Generation
     */
    async generateCode(objective, context = {}) {
        const language = context.language || this.config.getLanguage();
        const framework = context.framework || '';
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
     * Parse AI response for proactive file actions
     */
    parseActions(content) {
        const actions = [];
        const lines = content.split('\n');
        let currentAction = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Support markdown bold stars (**) and variations like "ACTION: UPDATE FILE:"
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
                        description: description.trim().replace(/\*\*$/g, ''), // Clean trailing stars
                        content: ''
                    };
                    actions.push(currentAction);
                } else if (currentAction) {
                    // Capture code block content
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
     * Legacy method maintained for UI compatibility
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
     * Update an existing file based on specific changes
     */
    async updateFile(filePath, changes) {
        const currentContent = this.fileManager.readFile(filePath);
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
     * Detect language from file path extension
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
            'sol': 'solidity', 'pas': 'pascal', 'pl': 'prolog', 'd': 'd',
            'cr': 'crystal', 'cbl': 'cobol'
        };
        return langMap[ext] || 'javascript';
    }

    // ==================== GIT OPERATIONS ====================

    getGitStatus() {
        return this.gitManager.getFormattedStatus();
    }

    async commitChanges(message, files = '.') {
        const addResult = this.gitManager.add(files, { verbose: false });
        if (!addResult.success) return addResult;

        return this.gitManager.commit(message, { verbose: false });
    }

    async generateCommitMessage() {
        const status = this.getGitStatus();
        if (!status.success || status.total === 0) {
            return { success: false, error: 'No changes found to commit.' };
        }

        const diff = this.gitManager.getDiff();
        const filesChanged = status.files.map(f => `${f.status}: ${f.file}`).join('\n');

        const prompt = `Generate a concise git commit message for these changes:

Files changed:
${filesChanged}

Diff preview:
${diff.output ? diff.output.substring(0, 1000) : 'No diff content'}

Format: type(scope): description`;

        const response = await this.chat(prompt, null, { task: 'commit-message' });

        if (response.success) {
            const message = response.content.split('\n')[0].replace(/^["'`]+|["'`]+$/g, '').trim();
            return { success: true, message };
        }

        return response;
    }

    async smartCommit(files = '.') {
        const msgRes = await this.generateCommitMessage();
        if (!msgRes.success) return msgRes;

        return this.commitChanges(msgRes.message, files);
    }

    pushToGit(branch = 'main') { return this.gitManager.push(branch); }
    pullFromGit(branch = 'main') { return this.gitManager.pull(branch); }
    createGitBranch(name) { return this.gitManager.createBranch(name); }
    switchGitBranch(name) { return this.gitManager.switchBranch(name); }
    listGitBranches() { return this.gitManager.getBranches(); }
    getGitLog(count = 10) { return this.gitManager.getLog(count); }

    // ==================== WORKFLOWS ====================

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

    async tasks(planContent, context = {}) {
        const prompt = `Based on this plan:
${planContent}

Break it down into a granular task checklist for implementation.
Return as a markdown list with checkboxes [ ].`;
        return this.chat(prompt, null, { ...context, task: 'tasking' });
    }

    async summarize(results, context = {}) {
        const prompt = `Summarize the work completed:
${JSON.stringify(results)}

Objective: ${results.objective || 'Implementation'}

Provide a detailed "Walkthrough" of what was accomplished and how the user can verify it.`;
        return this.chat(prompt, null, { ...context, task: 'summarizing' });
    }

    async analyzeProject(context = {}) {
        const files = this.listProjectFiles({ extensions: ['js', 'ts', 'json', 'md'] });
        const codeFiles = files.filter(f => f.type === 'file').slice(0, 5);

        let codePreview = '';
        for (const file of codeFiles) {
            try {
                const content = this.fileManager.readFile(file.path);
                codePreview += `\n--- FILE: ${file.path} ---\n${content.substring(0, 500)}...\n`;
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