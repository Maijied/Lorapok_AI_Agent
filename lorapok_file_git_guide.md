# 🐛 Lorapok - File & Git Management Guide

## 📁 FILE MANAGEMENT FEATURES

### What Lorapok Can Do With Files

✅ **List Files** - See all files in your project  
✅ **Show File Tree** - Visual directory structure  
✅ **Read Files** - Display file contents  
✅ **Edit Files** - Update existing files with AI help  
✅ **Generate Files** - Create new files from descriptions  
✅ **Analyze Files** - Get insights about code files  

### File Operations API

```javascript
// In your code (agent-enhanced.js provides these)

// List all files
agent.listProjectFiles()

// Show directory tree
agent.showFileTree()

// Read file content
agent.fileManager.readFile('src/index.js')

// Write/create file
agent.fileManager.writeFile('src/utils.js', codeContent)

// Create new file
agent.fileManager.createFile('src/new-file.js', 'initial content')

// Delete file
agent.fileManager.deleteFile('src/old-file.js')

// Append to file
agent.fileManager.appendFile('README.md', '\n## New Section')

// Generate file with AI
await agent.generateFile('src/api.js', 'REST API handler using Express')

// Update file with AI
await agent.updateFile('src/index.js', 'Add error handling to all functions')

// Analyze file with AI
await agent.readAndAnalyzeFile('src/utils.js')
```

### Interactive File Menu

**Main Menu → Option 4 → File Management**

```
1 📂 List project files
2 🌳 Show file tree
3 📖 Read file
4 ✏️  Edit file
5 ✨ Generate new file
6 🔍 Analyze file
```

### Example Workflows

#### Generate a New File
```
Choose: 5
New file path: src/utils/helpers.js
What should this file do? utility functions for string manipulation
↓ AI generates the code and creates the file
```

#### Update Existing File
```
Choose: 4
File path: src/index.js
Describe changes: Add validation function and error handling
↓ AI reads current code, makes improvements, saves it
```

#### Analyze Code
```
Choose: 6
File path: src/database/connection.js
↓ AI analyzes code and suggests improvements
```

---

## 🔗 GIT MANAGEMENT FEATURES

### What Lorapok Can Do With Git

✅ **Check Status** - See changed files  
✅ **Commit Changes** - Save changes with messages  
✅ **Push to Remote** - Upload to GitHub/GitLab/etc  
✅ **Pull Updates** - Get latest code  
✅ **Create Branches** - New feature branches  
✅ **Switch Branches** - Move between branches  
✅ **View Branches** - See all branches  
✅ **View Commit Log** - See commit history  

### Git Operations API

```javascript
// Check if directory is a git repo
agent.gitManager.isGitRepo()

// Initialize git repo
agent.gitManager.initRepo()

// Get status of changes
agent.getGitStatus()

// Add files
agent.gitManager.add('src/')
agent.gitManager.add('.')  // all files

// Commit changes
agent.commitChanges('Fixed login bug', 'src/auth.js')
agent.commitChanges('Initial commit', '.')

// Push to remote
agent.pushToGit('main')
agent.pushToGit('develop')

// Pull from remote
agent.pullFromGit('main')

// Create new branch
agent.createGitBranch('feature/add-users')

// Switch branch
agent.switchGitBranch('develop')

// List all branches
agent.listGitBranches()

// View commit history
agent.getGitLog(10)  // last 10 commits

// Set remote
agent.gitManager.setRemote('origin', 'https://github.com/user/repo.git')

// Get remotes
agent.gitManager.getRemotes()
```

### Interactive Git Menu

**Main Menu → Option 5 → Git Management**

```
1 📊 Git status
2 ✅ Commit changes
3 📤 Push to remote
4 📥 Pull from remote
5 🌿 Create branch
6 🔀 Switch branch
7 📜 View branches
8 📝 View commit log
```

### Example Workflows

#### Complete Git Workflow

```
1. Choose: 1 (Check status)
   ↓ Shows modified files

2. Choose: 2 (Commit)
   Commit message: Fixed login form validation
   Files: .
   ↓ Files added and committed

3. Choose: 5 (Create branch)
   Branch name: feature/new-dashboard
   ↓ Branch created and switched

4. Make changes to files...

5. Choose: 2 (Commit)
   Commit message: Added new dashboard UI
   ↓ Changes committed

6. Choose: 6 (Switch branch)
   Branch name: main
   ↓ Switched to main

7. Choose: 4 (Pull)
   Branch: main
   ↓ Gets latest changes

8. Choose: 3 (Push)
   Branch: main
   ↓ Pushes all commits
```

#### Daily Development Workflow

```bash
# Start work
lorapok
Choose: 5 (Git Management)

# Check what changed
Choose: 1 (Status)

# Commit work
Choose: 2 (Commit)
Message: "Completed feature X"

# Push to GitHub
Choose: 3 (Push)
Branch: main
```

---

## 🚀 COMPLETE WORKFLOW EXAMPLE

### Scenario: Adding a New Feature

```
1. Start Lorapok
   $ lorapok

2. Generate new feature file
   → Option 4: File Management
   → Choose: 5 (Generate)
   → File: src/services/emailService.js
   → Description: Email sending service with validation

3. Analyze the generated code
   → Choose: 6 (Analyze)
   → File: src/services/emailService.js
   → Review AI suggestions

4. Update based on requirements
   → Choose: 4 (Edit)
   → File: src/services/emailService.js
   → Changes: Add retry logic for failed emails

5. Create git branch
   → Option 5: Git Management
   → Choose: 5 (Create branch)
   → Branch: feature/email-service

6. Commit changes
   → Choose: 2 (Commit)
   → Message: "Add email service with retry logic"
   → Files: .

7. Push to GitHub
   → Choose: 3 (Push)
   → Branch: feature/email-service

8. View commit history
   → Choose: 8 (View log)
```

---

## 🔒 SECURITY & BEST PRACTICES

### ✅ DO's

- ✅ Use relative paths: `src/index.js`
- ✅ Commit frequently with clear messages
- ✅ Create branches for new features
- ✅ Review AI-generated code before committing
- ✅ Keep API key in .env file (never commit)
- ✅ Use .gitignore for sensitive files

### ❌ DON'Ts

- ❌ Don't access files outside project directory
- ❌ Don't commit node_modules or build artifacts
- ❌ Don't push API keys to git
- ❌ Don't delete important files without backup
- ❌ Don't force push to shared branches
- ❌ Don't trust AI code blindly - always review

### Example .gitignore

```
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
.lorapok/
```

---

## 📝 COMMAND LINE EXAMPLES

### File Operations via CLI

```bash
# Start Lorapok in directory
lorapok start ~/my-project

# List files
lorapok file list

# Show tree
lorapok file tree

# Read file
lorapok file read src/index.js
```

### Git Operations via CLI

```bash
# Check status
lorapok git status

# Commit
lorapok git commit "Your message"

# Push
lorapok git push main

# Pull
lorapok git pull main
```

---

## 🆘 TROUBLESHOOTING

### Issue: "Cannot read file: File not found"
**Solution**: Use correct relative path from project root
```bash
# Wrong: index.js
# Correct: src/index.js
```

### Issue: "Not a git repository"
**Solution**: Initialize git first
```bash
cd ~/my-project
git init
# or use Lorapok to initialize
```

### Issue: "Cannot push: Authentication failed"
**Solution**: Setup SSH or provide credentials
```bash
git remote set-url origin git@github.com:user/repo.git
# or
git config user.email "your@email.com"
git config user.name "Your Name"
```

### Issue: "Access denied: Cannot access files outside project"
**Solution**: This is intentional security feature. Only access files in current directory
```bash
lorapok start ~/my-project  # Sets project root
```

---

## 📚 COMMON PATTERNS

### Pattern 1: Generate and Commit
```
1. Generate file with AI
2. Review generated code
3. Commit with message
4. Push to remote
```

### Pattern 2: Refactor Existing Code
```
1. Select file to improve
2. Ask AI to refactor
3. Commit changes
4. Run tests
5. Push
```

### Pattern 3: Feature Branch Workflow
```
1. Create feature branch
2. Generate/update files
3. Commit changes
4. Push feature branch
5. Create pull request
6. Switch to main
7. Pull latest
```

### Pattern 4: Code Review
```
1. Pull latest code
2. Analyze file with AI
3. Get AI suggestions
4. Make improvements
5. Commit and push
```

---

## 🎯 PRO TIPS

1. **Use meaningful commit messages**
   - Good: "Add email validation to signup form"
   - Bad: "fix stuff"

2. **Commit frequently**
   - Easier to track changes
   - Easier to revert if needed

3. **Create branches for features**
   - Keep main stable
   - Easy to manage multiple features

4. **Review AI code**
   - Always check generated code
   - Adjust as needed for your requirements

5. **Use git before major changes**
   - Commit working state first
   - Safe to experiment

6. **Keep .env and secrets out of git**
   - Add to .gitignore
   - Use environment variables

---

## 📖 REFERENCE

### File Path Examples
```
src/index.js              ✅ Correct
./src/index.js            ✅ Correct
../outside/file.js        ❌ Access denied
~/Desktop/file.js         ❌ Use relative paths
```

### Git Branch Naming
```
main                      ✅ Production
develop                   ✅ Development
feature/new-login         ✅ New feature
bugfix/auth-error         ✅ Bug fix
release/v1.0.0           ✅ Release
```

### Commit Message Format
```
[type] Brief description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactor
- test: Tests
- chore: Maintenance
```

---

## 🎓 LEARNING RESOURCES

- **Git Basics**: https://git-scm.com/book/en/v2
- **GitHub Workflow**: https://guides.github.com/
- **Best Practices**: https://www.conventionalcommits.org/
- **Branching Strategy**: https://nvie.com/posts/a-successful-git-branching-model/