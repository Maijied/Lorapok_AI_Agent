const { LorapokCodingAgent, MODELS } = require('./agent');
const FileManager = require('./services/FileManager');
const GitManager = require('./services/GitManager');

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

    // Generate new file with AI
    async generateFile(filePath, description, language = null) {
        language = language || this.detectLanguage(filePath) || this.config.getLanguage();

        const prompt = `Generate a complete ${language} file for: ${description}
    
Requirements:
- Complete, production-ready code
- Include necessary imports
- Add proper documentation
- Include error handling`;

        const response = await this.chat(prompt, null, { language, task: 'generate-file' });

        if (response.success) {
            // Extract code from markdown code blocks if present
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

    // Analyze and suggest improvements for whole project
    async analyzeProject() {
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

        return this.chat(prompt, null, { task: 'project-analysis' });
    }
}

module.exports = { LorapokEnhancedAgent, MODELS };
