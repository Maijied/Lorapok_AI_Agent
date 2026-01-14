#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const { program } = require('commander');
const { LorapokEnhancedAgent, MODELS } = require('./agent-enhanced');
const { LorapokConfig } = require('./config');
const LorapokHistory = require('./history');
const FileManager = require('./services/FileManager');
const GitManager = require('./services/GitManager');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const prompt = (question) => {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
};

// ==================== SETUP ====================
async function setupApiKey() {
    console.log(chalk.cyan('\n🐛 Lorapok - Initial Setup\n'));

    const apiKey = await prompt(chalk.yellow('Enter your Perplexity API Key: '));

    if (!apiKey.trim()) {
        console.log(chalk.red('❌ API key required!'));
        console.log(chalk.yellow('Get one at: https://www.perplexity.ai/api-platform'));
        process.exit(1);
    }

    const config = new LorapokConfig();
    config.setApiKey(apiKey);

    console.log(chalk.green('✅ API key saved!\n'));
}

async function selectModel(config) {
    console.log(chalk.cyan('\n📦 Select Model:\n'));

    const modelList = Object.entries(MODELS);

    modelList.forEach(([key, model], idx) => {
        const tier = model.tier === 'pro' ? chalk.magenta('[PRO]') : '[FREE]';
        console.log(`${idx + 1}. ${tier} ${model.name}`);
    });

    const choice = await prompt(chalk.yellow('\nSelect (number): '));
    const selectedIdx = parseInt(choice) - 1;

    if (selectedIdx >= 0 && selectedIdx < modelList.length) {
        const selectedModel = modelList[selectedIdx][0];
        config.setModel(selectedModel);
        console.log(chalk.green(`✅ Model: ${MODELS[selectedModel].name}\n`));
        return selectedModel;
    }

    console.log(chalk.red('❌ Invalid selection'));
    return null;
}

async function selectLanguage(config) {
    console.log(chalk.cyan('\n🔤 Select Default Language:\n'));

    const languages = [
        'javascript', 'typescript', 'python', 'java', 'go',
        'rust', 'php', 'ruby', 'c++', 'c#'
    ];

    languages.forEach((lang, idx) => {
        console.log(`${idx + 1}. ${lang}`);
    });

    const choice = await prompt(chalk.yellow('\nSelect (number): '));
    const selectedIdx = parseInt(choice) - 1;

    if (selectedIdx >= 0 && selectedIdx < languages.length) {
        config.setLanguage(languages[selectedIdx]);
        console.log(chalk.green(`✅ Language: ${languages[selectedIdx]}\n`));
        return languages[selectedIdx];
    }

    console.log(chalk.red('❌ Invalid selection'));
    return null;
}

// ==================== AI MODES ====================
async function chatMode(agent, config) {
    console.log(chalk.cyan('\n💬 Chat Mode (type "exit" to quit)\n'));

    while (true) {
        const input = await prompt(chalk.blue('You: '));

        if (input.toLowerCase() === 'exit') break;
        if (!input.trim()) continue;

        const spinner = ora(chalk.gray('🤔 Thinking...')).start();

        try {
            const response = await agent.chat(input);
            spinner.succeed(chalk.green('✅'));

            console.log(chalk.cyan('\n🐛 Lorapok:'));
            console.log(response.content);
            console.log('');
        } catch (error) {
            spinner.fail(chalk.red(`❌ ${error.message}`));
        }
    }
}

async function generateMode(agent, config) {
    console.log(chalk.cyan('\n✨ Code Generation\n'));

    const requirements = await prompt(chalk.yellow('What code do you need? '));
    const languageInput = await prompt(chalk.yellow(`Language [${config.getLanguage()}]: `));
    const language = languageInput || config.getLanguage();
    const framework = await prompt(chalk.yellow('Framework (optional): '));

    const spinner = ora(chalk.gray('🔧 Generating...')).start();

    try {
        const response = await agent.generateCode(requirements, language, framework);
        spinner.succeed(chalk.green('✅'));

        console.log(chalk.cyan('\n📝 Generated Code:\n'));
        console.log(response.content);
        console.log('');
    } catch (error) {
        spinner.fail(chalk.red(`❌ ${error.message}`));
    }
}

async function analyzeMode(agent, config) {
    console.log(chalk.cyan('\n🔍 Code Analysis\n'));
    console.log(chalk.gray('Paste your code (end with empty line):\n'));

    let code = '';
    let line;
    while ((line = await prompt('')) !== '') {
        code += line + '\n';
    }

    if (!code.trim()) {
        console.log(chalk.red('❌ No code provided'));
        return;
    }

    const languageInput = await prompt(chalk.yellow(`Language [${config.getLanguage()}]: `));
    const language = languageInput || config.getLanguage();

    const spinner = ora(chalk.gray('📊 Analyzing...')).start();

    try {
        const response = await agent.analyzeCode(code, language);
        spinner.succeed(chalk.green('✅'));

        console.log(chalk.cyan('\n📈 Analysis:\n'));
        console.log(response.content);
        console.log('');
    } catch (error) {
        spinner.fail(chalk.red(`❌ ${error.message}`));
    }
}

async function debugMode(agent, config) {
    console.log(chalk.cyan('\n🐛 Debug Code\n'));
    console.log(chalk.gray('Paste your code (end with empty line):\n'));

    let code = '';
    let line;
    while ((line = await prompt('')) !== '') {
        code += line + '\n';
    }

    if (!code.trim()) {
        console.log(chalk.red('❌ No code provided'));
        return;
    }

    console.log(chalk.gray('\nPaste error message (end with empty line):\n'));
    let errorMsg = '';
    while ((line = await prompt('')) !== '') {
        errorMsg += line + '\n';
    }

    const languageInput = await prompt(chalk.yellow(`Language [${config.getLanguage()}]: `));
    const language = languageInput || config.getLanguage();

    const spinner = ora(chalk.gray('🔧 Debugging...')).start();

    try {
        const response = await agent.debugCode(code, errorMsg, language);
        spinner.succeed(chalk.green('✅'));

        console.log(chalk.cyan('\n🎯 Solution:\n'));
        console.log(response.content);
        console.log('');
    } catch (error) {
        spinner.fail(chalk.red(`❌ ${error.message}`));
    }
}

// ==================== FILE MANAGEMENT ====================
async function fileManagement(agent) {
    const fm = agent.fileManager;

    while (true) {
        console.log(chalk.cyan('\n📁 ════════════════════════════════'));
        console.log(chalk.cyan('     FILE MANAGEMENT'));
        console.log(chalk.cyan('════════════════════════════════\n'));

        console.log(chalk.yellow('1') + ' 📂 List project files');
        console.log(chalk.yellow('2') + ' 🌳 Show file tree');
        console.log(chalk.yellow('3') + ' 📖 Read file');
        console.log(chalk.yellow('4') + ' ✏️  Edit file (AI-powered)');
        console.log(chalk.yellow('5') + ' ✨ Generate new file (AI)');
        console.log(chalk.yellow('6') + ' 🔍 Analyze file (AI)');
        console.log(chalk.yellow('7') + ' 🔎 Search files');
        console.log(chalk.yellow('0') + ' ⬅️  Back to main menu\n');

        const choice = await prompt(chalk.blue('Choose: '));

        switch (choice) {
            case '1':
                try {
                    const files = agent.listProjectFiles();
                    console.log(chalk.cyan('\n📂 Project Files:\n'));
                    files.forEach(f => {
                        const icon = f.type === 'directory' ? '📁' : '📄';
                        console.log(`  ${icon} ${f.path}`);
                    });
                    console.log(`\n  Total: ${files.length} items\n`);
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '2':
                try {
                    console.log(chalk.cyan('\n🌳 File Tree:\n'));
                    console.log(agent.showFileTree());
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '3':
                try {
                    const filePath = await prompt(chalk.yellow('File path: '));
                    const content = fm.readFile(filePath);
                    console.log(chalk.cyan(`\n📖 ${filePath}:\n`));
                    console.log(content);
                    console.log('');
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '4':
                try {
                    const filePath = await prompt(chalk.yellow('File path: '));
                    const changes = await prompt(chalk.yellow('Describe changes: '));

                    const spinner = ora(chalk.gray('✏️ Updating file...')).start();
                    const result = await agent.updateFile(filePath, changes);
                    spinner.succeed(chalk.green('✅ File updated'));

                    console.log(chalk.cyan('\n📝 Updated content saved to: ') + result.path);
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '5':
                try {
                    const filePath = await prompt(chalk.yellow('New file path: '));
                    const description = await prompt(chalk.yellow('What should this file do? '));

                    const spinner = ora(chalk.gray('✨ Generating file...')).start();
                    const result = await agent.generateFile(filePath, description);
                    spinner.succeed(chalk.green('✅ File created'));

                    console.log(chalk.cyan('\n📝 Created: ') + result.path);
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '6':
                try {
                    const filePath = await prompt(chalk.yellow('File path: '));

                    const spinner = ora(chalk.gray('🔍 Analyzing file...')).start();
                    const result = await agent.readAndAnalyzeFile(filePath);
                    spinner.succeed(chalk.green('✅'));

                    console.log(chalk.cyan('\n📊 Analysis:\n'));
                    console.log(result.content);
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '7':
                try {
                    const pattern = await prompt(chalk.yellow('Search pattern: '));
                    const files = fm.searchFiles(pattern);
                    console.log(chalk.cyan(`\n🔎 Found ${files.length} matches:\n`));
                    files.forEach(f => console.log(`  ${f.path}`));
                    console.log('');
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '0':
                return;

            default:
                console.log(chalk.red('❌ Invalid option'));
        }
    }
}

// ==================== GIT MANAGEMENT ====================
async function gitManagement(agent) {
    const gm = agent.gitManager;

    if (!gm.isGitRepo()) {
        console.log(chalk.yellow('\n⚠️ Not a git repository'));
        const init = await prompt(chalk.yellow('Initialize git? (y/n): '));
        if (init.toLowerCase() === 'y') {
            gm.initRepo();
            console.log(chalk.green('✅ Git repository initialized'));
        } else {
            return;
        }
    }

    while (true) {
        const currentBranch = gm.getCurrentBranch();
        const branchName = currentBranch.success ? currentBranch.output : 'unknown';

        console.log(chalk.cyan('\n🔗 ════════════════════════════════'));
        console.log(chalk.cyan('     GIT MANAGEMENT'));
        console.log(chalk.cyan('════════════════════════════════'));
        console.log(chalk.gray(`  Branch: ${branchName}\n`));

        console.log(chalk.yellow('1') + ' 📊 Git status');
        console.log(chalk.yellow('2') + ' ✅ Commit changes');
        console.log(chalk.yellow('3') + ' 🤖 Smart commit (AI message)');
        console.log(chalk.yellow('4') + ' 📤 Push to remote');
        console.log(chalk.yellow('5') + ' 📥 Pull from remote');
        console.log(chalk.yellow('6') + ' 🌿 Create branch');
        console.log(chalk.yellow('7') + ' 🔀 Switch branch');
        console.log(chalk.yellow('8') + ' 📜 View branches');
        console.log(chalk.yellow('9') + ' 📝 View commit log');
        console.log(chalk.yellow('0') + ' ⬅️  Back to main menu\n');

        const choice = await prompt(chalk.blue('Choose: '));

        switch (choice) {
            case '1':
                const status = agent.getGitStatus();
                if (!status.success) {
                    console.log(chalk.red(`❌ ${status.error}`));
                } else if (status.total === 0) {
                    console.log(chalk.green('\n✅ Working tree clean\n'));
                } else {
                    console.log(chalk.cyan(`\n📊 ${status.total} changed files:\n`));
                    status.files.forEach(f => {
                        const color = f.status === 'Modified' ? chalk.yellow :
                            f.status === 'Added' ? chalk.green :
                                f.status === 'Deleted' ? chalk.red :
                                    f.status === 'Untracked' ? chalk.gray : chalk.white;
                        console.log(`  ${color(f.status.padEnd(12))} ${f.file}`);
                    });
                    console.log('');
                }
                break;

            case '2':
                try {
                    const message = await prompt(chalk.yellow('Commit message: '));
                    const files = await prompt(chalk.yellow('Files to add [.]: ')) || '.';

                    const result = await agent.commitChanges(message, files);
                    if (result.success) {
                        console.log(chalk.green('\n✅ Changes committed\n'));
                    } else {
                        console.log(chalk.red(`❌ ${result.error || result.output}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '3':
                try {
                    const spinner = ora(chalk.gray('🤖 Generating commit message...')).start();
                    const result = await agent.smartCommit();

                    if (result.success) {
                        spinner.succeed(chalk.green('✅ Smart commit done'));
                        console.log(chalk.gray(`  Message: ${result.message || 'Committed'}\n`));
                    } else {
                        spinner.fail(chalk.red(`❌ ${result.error}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '4':
                try {
                    const branch = await prompt(chalk.yellow(`Branch [${branchName}]: `)) || branchName;
                    const spinner = ora(chalk.gray('📤 Pushing...')).start();

                    const result = agent.pushToGit(branch);
                    if (result.success) {
                        spinner.succeed(chalk.green('✅ Pushed successfully'));
                    } else {
                        spinner.fail(chalk.red(`❌ ${result.error || result.output}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '5':
                try {
                    const branch = await prompt(chalk.yellow(`Branch [${branchName}]: `)) || branchName;
                    const spinner = ora(chalk.gray('📥 Pulling...')).start();

                    const result = agent.pullFromGit(branch);
                    if (result.success) {
                        spinner.succeed(chalk.green('✅ Pulled successfully'));
                    } else {
                        spinner.fail(chalk.red(`❌ ${result.error || result.output}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '6':
                try {
                    const name = await prompt(chalk.yellow('New branch name: '));
                    const result = agent.createGitBranch(name);
                    if (result.success) {
                        console.log(chalk.green(`\n✅ Created and switched to branch: ${name}\n`));
                    } else {
                        console.log(chalk.red(`❌ ${result.error || result.output}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '7':
                try {
                    const name = await prompt(chalk.yellow('Branch name: '));
                    const result = agent.switchGitBranch(name);
                    if (result.success) {
                        console.log(chalk.green(`\n✅ Switched to branch: ${name}\n`));
                    } else {
                        console.log(chalk.red(`❌ ${result.error || result.output}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '8':
                try {
                    const result = agent.listGitBranches();
                    if (result.success) {
                        console.log(chalk.cyan('\n📜 Branches:\n'));
                        result.branches.forEach(b => {
                            const prefix = b.current ? chalk.green('* ') : '  ';
                            console.log(`${prefix}${b.name}`);
                        });
                        console.log('');
                    } else {
                        console.log(chalk.red(`❌ ${result.error}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '9':
                try {
                    const count = await prompt(chalk.yellow('Number of commits [10]: ')) || '10';
                    const result = agent.getGitLog(parseInt(count));
                    if (result.success) {
                        console.log(chalk.cyan('\n📝 Commit Log:\n'));
                        result.commits.forEach(c => {
                            console.log(`  ${chalk.yellow(c.hash)} ${c.message}`);
                            console.log(`  ${chalk.gray(`  by ${c.author}, ${c.date}`)}`);
                            console.log('');
                        });
                    } else {
                        console.log(chalk.red(`❌ ${result.error}`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${error.message}`));
                }
                break;

            case '0':
                return;

            default:
                console.log(chalk.red('❌ Invalid option'));
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================
async function showHistory() {
    const history = new LorapokHistory();
    console.log(chalk.cyan('\n📜 Recent Activity:\n'));

    const recent = history.getAll().slice(-10).reverse();

    if (recent.length === 0) {
        console.log(chalk.gray('No history yet.\n'));
        return;
    }

    recent.forEach((entry, idx) => {
        console.log(`${idx + 1}. [${entry.type.toUpperCase()}] ${chalk.gray(entry.timestamp.substring(0, 19))}`);
        console.log(`   Input: ${chalk.gray(entry.input)}...`);
        console.log('');
    });
}

async function showSettings() {
    const config = new LorapokConfig();

    console.log(chalk.cyan('\n⚙️  Settings:\n'));
    console.log(`Model: ${chalk.yellow(MODELS[config.getModel()]?.name || config.getModel())}`);
    console.log(`Language: ${chalk.yellow(config.getLanguage())}`);
    console.log(`API Key: ${chalk.yellow(config.getApiKey() ? '✅ Configured' : '❌ Not set')}`);
    console.log('');
}

async function clearHistoryAction() {
    const history = new LorapokHistory();
    history.clear();
    console.log(chalk.green('\n✅ History cleared!\n'));
}

// ==================== MAIN MENU ====================
async function mainMenu() {
    const config = new LorapokConfig();

    if (!config.getApiKey()) {
        await setupApiKey();
    }

    const apiKey = config.getApiKey();
    const agent = new LorapokEnhancedAgent(apiKey);

    while (true) {
        console.log(chalk.cyan('\n🐛 ════════════════════════════════'));
        console.log(chalk.cyan('   LORAPOK CODING AGENT v1.0.0'));
        console.log(chalk.cyan('════════════════════════════════\n'));

        console.log(chalk.yellow(' AI Features:'));
        console.log(chalk.yellow('  1') + ' 💬 Chat');
        console.log(chalk.yellow('  2') + ' ✨ Generate Code');
        console.log(chalk.yellow('  3') + ' 🔍 Analyze Code');
        console.log(chalk.yellow('  4') + ' 🐛 Debug Code');
        console.log('');
        console.log(chalk.yellow(' Management:'));
        console.log(chalk.yellow('  5') + ' 📁 File Management');
        console.log(chalk.yellow('  6') + ' 🔗 Git Management');
        console.log('');
        console.log(chalk.yellow(' Settings:'));
        console.log(chalk.yellow('  7') + ' 📦 Change Model');
        console.log(chalk.yellow('  8') + ' 🔤 Change Language');
        console.log(chalk.yellow('  9') + ' ⚙️  View Settings');
        console.log(chalk.yellow('  k') + ' 🔑 Update API Key');
        console.log(chalk.yellow('  h') + ' 📜 History');
        console.log(chalk.yellow('  c') + ' 🗑️  Clear History');
        console.log(chalk.yellow('  0') + ' ❌ Exit\n');

        const choice = await prompt(chalk.blue('Choose: '));

        switch (choice) {
            case '1':
                await chatMode(agent, config);
                break;
            case '2':
                await generateMode(agent, config);
                break;
            case '3':
                await analyzeMode(agent, config);
                break;
            case '4':
                await debugMode(agent, config);
                break;
            case '5':
                await fileManagement(agent);
                break;
            case '6':
                await gitManagement(agent);
                break;
            case '7':
                await selectModel(config);
                break;
            case '8':
                await selectLanguage(config);
                break;
            case '9':
                await showSettings();
                break;
            case 'k':
            case 'K':
                await setupApiKey();
                break;
            case 'h':
            case 'H':
                await showHistory();
                break;
            case 'c':
            case 'C':
                await clearHistoryAction();
                break;
            case '0':
                console.log(chalk.green('\n👋 Goodbye!\n'));
                rl.close();
                process.exit(0);
            default:
                console.log(chalk.red('❌ Invalid option'));
        }
    }
}

// ==================== CLI COMMANDS ====================
program
    .name('lorapok')
    .description('🐛 AI Coding Agent powered by Perplexity')
    .version('1.0.0');

program
    .command('chat')
    .description('Start interactive chat mode')
    .action(async () => {
        const config = new LorapokConfig();
        if (!config.getApiKey()) await setupApiKey();
        const agent = new LorapokEnhancedAgent(config.getApiKey());
        await chatMode(agent, config);
        rl.close();
    });

program
    .command('generate <req>')
    .option('-l, --language <lang>', 'Language', 'javascript')
    .option('-f, --framework <framework>', 'Framework')
    .description('Generate code from requirements')
    .action(async (req, options) => {
        const config = new LorapokConfig();
        if (!config.getApiKey()) await setupApiKey();
        const agent = new LorapokEnhancedAgent(config.getApiKey());

        const spinner = ora(chalk.gray('🔧 Generating...')).start();
        try {
            const response = await agent.generateCode(req, options.language, options.framework);
            spinner.succeed(chalk.green('✅'));
            console.log('\n' + response.content);
        } catch (error) {
            spinner.fail(chalk.red(`❌ ${error.message}`));
        }
        rl.close();
    });

program
    .command('analyze <code>')
    .option('-l, --language <lang>', 'Language', 'javascript')
    .description('Analyze code snippet')
    .action(async (code, options) => {
        const config = new LorapokConfig();
        if (!config.getApiKey()) await setupApiKey();
        const agent = new LorapokEnhancedAgent(config.getApiKey());

        const spinner = ora(chalk.gray('📊 Analyzing...')).start();
        try {
            const response = await agent.analyzeCode(code, options.language);
            spinner.succeed(chalk.green('✅'));
            console.log('\n' + response.content);
        } catch (error) {
            spinner.fail(chalk.red(`❌ ${error.message}`));
        }
        rl.close();
    });

program
    .command('file <action>')
    .description('File operations: list, tree, read <path>')
    .action(async (action) => {
        const fm = new FileManager();

        if (action === 'list') {
            const files = fm.listFiles('.', { recursive: true });
            files.forEach(f => console.log(f.path));
        } else if (action === 'tree') {
            console.log(fm.getFileTree('.'));
        }
        rl.close();
    });

program
    .command('git <action>')
    .description('Git operations: status, log, branches')
    .action(async (action) => {
        const gm = new GitManager();

        if (action === 'status') {
            const result = gm.getFormattedStatus();
            if (result.success) {
                result.files.forEach(f => console.log(`${f.status}: ${f.file}`));
            }
        } else if (action === 'log') {
            const result = gm.getLog();
            if (result.success) {
                result.commits.forEach(c => console.log(`${c.hash} ${c.message}`));
            }
        } else if (action === 'branches') {
            const result = gm.getBranches();
            if (result.success) {
                result.branches.forEach(b => console.log(b.current ? `* ${b.name}` : `  ${b.name}`));
            }
        }
        rl.close();
    });

program
    .command('setup')
    .description('Configure API key and preferences')
    .action(async () => {
        await setupApiKey();
        const config = new LorapokConfig();
        await selectModel(config);
        await selectLanguage(config);
        rl.close();
    });

program
    .command('settings')
    .description('Show current settings')
    .action(async () => {
        await showSettings();
        rl.close();
    });

// Run
if (process.argv.length === 2) {
    mainMenu().catch(console.error);
} else {
    program.parse(process.argv);
}
