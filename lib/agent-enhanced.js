const { LorapokCodingAgent, MODELS } = require('./agent');
const FileManager = require('../services/FileManager');
const GitManager = require('../services/GitManager');

class LorapokEnhancedAgent extends LorapokCodingAgent {
    constructor(apiKey, projectRoot = process.cwd()) {
        super(apiKey);
        this.fileManager = new FileManager(projectRoot);
        this.gitManager = new GitManager(projectRoot);
        this.projectRoot = projectRoot;
    }

    // ==================== FILE OPERATIONS ====================

    // List all project files
    listProjectFiles(options = {}) {
        return this.fileManager.listFiles('.', { recursive: true, ...options });
    }

    // Show file tree
    showFileTree() {
        return this.fileManager.getFileTree('.');
    }

    // Read and analyze file with AI
    async readAndAnalyzeFile(filePath) {
        const content = this.fileManager.readFile(filePath);
        const language = this.detectLanguage(filePath);

        return this.analyzeCode(content, language);
    }

    async generateCode(objective, context = {}) {
        const language = context.language || this.config.getLanguage();
        const framework = context.framework || '';
        const prompt = `Objective: ${objective}
        
Please implement this objective by performing specific file actions.
You MUST format your response using these strict action blocks:

ACTION: CREATE FILE: path/to/new_file
\`\`\`${language}
// code here
\`\`\`

ACTION: UPDATE FILE: path/to/existing_file
\`\`\`${language}
// complete updated code here
\`\`\`

ACTION: DELETE FILE: path/to/delete_file

Requirements:
- Clean, well-structured code.
- Only provide necessary actions.
- Always provide the COMPLETE code for CREATE and UPDATE actions.
- Use the project file tree context to identify existing files.`;

        return this.chat(prompt, null, { ...context, language, framework, task: 'generate-proactive' });
    }

    // Parse AI response for file actions
    parseActions(content) {
        const actions = [];
        const lines = content.split('\n');
        let currentAction = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('ACTION:')) {
                const actionMatch = line.match(/ACTION: (\w+) FILE: (.+)/);
                if (actionMatch) {
                    const [_, type, filePath] = actionMatch;
                    currentAction = { type, filePath: filePath.trim(), content: '' };
                    actions.push(currentAction);
                }
            } else if (currentAction && (currentAction.type === 'CREATE' || currentAction.type === 'UPDATE')) {
                // If we are in a code block, capture it
                if (line.startsWith('```')) {
                    let code = '';
                    i++; // skip opening ```
                    while (i < lines.length && !lines[i].trim().startsWith('```')) {
                        code += lines[i] + '\n';
                        i++;
                    }
                    currentAction.content = code.trim();
                }
            }
        }
        return actions;
    }

    // Legacy method maintained for compatibility
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

    // Update existing file with AI
    async updateFile(filePath, changes) {
        const currentContent = this.fileManager.readFile(filePath);
        const language = this.detectLanguage(filePath);

        const prompt = `Update this ${language} code based on the following changes:

Current code:
        \`\`\`${language}
${currentContent}
\`\`\`

Required changes: ${changes}

Provide the complete updated code with all changes applied.`;

        const response = await this.chat(prompt, null, { language, task: 'update-file' });

        if (response.success) {
            let code = response.content;
            const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)```/);
            if (codeBlockMatch) {
                code = codeBlockMatch[1];
            }

            this.fileManager.writeFile(filePath, code);
            return { success: true, path: filePath, content: code };
        }

        return response;
    }

    // Detect language from file extension
    detectLanguage(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const langMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'html': 'html',
            'css': 'css',
            'sql': 'sql',
            'sh': 'bash',
            'yml': 'yaml',
            'yaml': 'yaml',
            'json': 'json',
            'md': 'markdown'
        };
        return langMap[ext] || null;
    }

    // ==================== GIT OPERATIONS ====================

    // Get git status
    getGitStatus() {
        return this.gitManager.getFormattedStatus();
    }

    // Commit changes with optional AI message
    async commitChanges(message, files = '.') {
        // Add files first
        const addResult = this.gitManager.add(files);
        if (!addResult.success) return addResult;

        return this.gitManager.commit(message);
    }

    // Generate AI commit message
    async generateCommitMessage() {
        const status = this.getGitStatus();
        if (!status.success || status.total === 0) {
            return { success: false, error: 'No changes to commit' };
        }

        const diff = this.gitManager.getDiff();
        const filesChanged = status.files.map(f => `${f.status}: ${f.file}`).join('\n');

        const prompt = `Generate a concise git commit message for these changes:

Changed files:
${filesChanged}

${diff.output ? `Diff preview:\n${diff.output.substring(0, 500)}...` : ''}

Follow conventional commits format: type(scope): description
Types: feat, fix, docs, style, refactor, test, chore`;

        const response = await this.chat(prompt, null, { task: 'commit-message' });

        if (response.success) {
            // Extract just the commit message (first line of response)
            const message = response.content.split('\n')[0].replace(/^["'`]+|["'`]+$/g, '');
            return { success: true, message };
        }

        return response;
    }

    // Smart commit with AI-generated message
    async smartCommit(files = '.') {
        const messageResult = await this.generateCommitMessage();
        if (!messageResult.success) return messageResult;

        return this.commitChanges(messageResult.message, files);
    }

    // Push to remote
    pushToGit(branch) {
        return this.gitManager.push(branch);
    }

    // Pull from remote
    pullFromGit(branch) {
        return this.gitManager.pull(branch);
    }

    // Create branch
    createGitBranch(name) {
        return this.gitManager.createBranch(name);
    }

    // Switch branch
    switchGitBranch(name) {
        return this.gitManager.switchBranch(name);
    }

    // List branches
    listGitBranches() {
        return this.gitManager.getBranches();
    }

    // Get commit log
    getGitLog(count = 10) {
        return this.gitManager.getLog(count);
    }

    // ==================== COMBINED OPERATIONS ====================

    // Full workflow: generate file and commit
    async createAndCommit(filePath, description) {
        const generateResult = await this.generateFile(filePath, description);
        if (!generateResult.success) return generateResult;

        const commitResult = await this.commitChanges(
            `feat: Add ${filePath} - ${description.substring(0, 50)}`,
            filePath
        );

        return {
            success: true,
            file: generateResult,
            commit: commitResult
        };
    }

    // ==================== PRO WORKFLOW ====================

    async plan(objective, context = {}) {
        const prompt = `Objective: ${objective}
        
Please provide a detailed technical implementation plan. 
Include:
1. Goal Description
2. Proposed Changes
3. Potential Risks

Return as clean markdown.`;
        return this.chat(prompt, null, { ...context, task: 'planning' });
    }

    async tasks(planContent, context = {}) {
        const prompt = `Based on this plan:
${planContent}

Break it down into a granular task checklist.
Return as markdown with [ ] items.`;
        return this.chat(prompt, null, { ...context, task: 'tasking' });
    }

    async summarize(results, context = {}) {
        const prompt = `Summarize the following work completed:
${JSON.stringify(results)}

Provide a "Walkthrough" of what was accomplished and how to verify it.`;
        return this.chat(prompt, null, { ...context, task: 'summarizing' });
    }

    async chat(userMessage, model = null, context = {}) {
        context.fileTree = this.showFileTree();
        return super.chat(userMessage, model, context);
    }

    async analyzeProject(context = {}) {
        const files = this.listProjectFiles({ extensions: ['js', 'ts', 'py', 'java', 'go'] });
        const codeFiles = files.filter(f => f.type === 'file').slice(0, 5); // Limit to 5 files

        let projectOverview = '';
        for (const file of codeFiles) {
            try {
                const content = this.fileManager.readFile(file.path);
                projectOverview += `\n--- ${file.path} ---\n${content.substring(0, 500)}...\n`;
            } catch {
                // Skip unreadable files
            }
        }

        const prompt = `Analyze this project structure and provide insights:

File tree:
${this.showFileTree()}

Code samples:
${projectOverview}

Provide:
1. Project overview
2. Code quality assessment
3. Architecture suggestions
4. Potential improvements`;

        return this.chat(prompt, null, { ...context, task: 'project-analysis' });
    }
}

module.exports = { LorapokEnhancedAgent, MODELS };
