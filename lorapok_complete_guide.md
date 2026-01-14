# 🐛 LORAPOK CODING AGENT - COMPLETE BUILD GUIDE
## Step-by-Step Process from Zero to Full Product

---

## 📋 TABLE OF CONTENTS
1. Prerequisites & API Setup
2. Project Initialization
3. Core Agent Implementation
4. CLI Interface
5. Testing & Debugging
6. Local Usage
7. Web Server (Optional)
8. Deployment
9. NPM Publishing
10. Final Checklist

---

# PHASE 1: PREREQUISITES & API SETUP

## Step 1.1: Get Perplexity API Access

1. Go to **https://www.perplexity.ai/api-platform**
2. Click **"Sign Up"** (if new) or **"Sign In"**
3. Complete registration or login
4. Navigate to **API Platform** section
5. Click **"Generate API Key"** button
6. Copy your API key (looks like: `pplx_xxxxx...`)
7. **⚠️ SAVE IT SAFELY** - You'll need it later
8. Add a payment method if you want Pro models access
9. Keep this tab open, you'll need the key in Step 2.1

## Step 1.2: Install Node.js

Check if you have Node.js installed:
```bash
node --version
npm --version
```

**If not installed:**
- **Windows**: Download from https://nodejs.org/
- **Mac**: `brew install node`
- **Linux**: `sudo apt-get install nodejs npm`

**Verify installation:**
```bash
node --version  # Should be v16 or higher
npm --version   # Should be v7 or higher
```

## Step 1.3: Install Code Editor

- **VS Code** (Recommended): https://code.visualstudio.com/
- **WebStorm**, **Sublime Text**, or **Vim**

---

# PHASE 2: PROJECT INITIALIZATION

## Step 2.1: Create Project Directory

```bash
# Navigate to where you want your project
cd ~/Desktop          # or any folder you prefer

# Create project directory
mkdir lorapok-agent
cd lorapok-agent

# Initialize Git (optional but recommended)
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo ".lorapok/" >> .gitignore
```

## Step 2.2: Initialize NPM Project

```bash
npm init -y
```

This creates `package.json`. Now edit it:

**File: `package.json`**
```json
{
  "name": "lorapok-coding-agent",
  "version": "1.0.0",
  "description": "🐛 AI-powered coding assistant with Perplexity API",
  "main": "index.js",
  "bin": {
    "lorapok": "./index.js"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js",
    "test": "node test.js"
  },
  "keywords": [
    "ai",
    "coding",
    "perplexity",
    "agent",
    "cli"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0",
    "chalk": "^5.3.0",
    "commander": "^11.0.0",
    "dotenv": "^16.3.1",
    "ora": "^8.0.0",
    "uuid": "^9.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## Step 2.3: Install Dependencies

```bash
npm install
```

This installs all required packages. Wait for it to complete.

**What each package does:**
- `axios`: Makes HTTP requests to Perplexity API
- `chalk`: Colored terminal output
- `commander`: CLI argument parsing
- `dotenv`: Load environment variables
- `ora`: Loading spinners
- `uuid`: Generate unique session IDs

## Step 2.4: Create `.env` File

**File: `.env`**
```
PERPLEXITY_API_KEY=paste_your_api_key_here_from_step_1_1
PERPLEXITY_API_URL=https://api.perplexity.ai/chat/completions
PORT=3000
NODE_ENV=development
```

⚠️ **IMPORTANT**: Replace `paste_your_api_key_here_from_step_1_1` with your actual API key from Step 1.1

---

# PHASE 3: CORE AGENT IMPLEMENTATION

## Step 3.1: Create Configuration Module

**File: `config.js`**
```javascript
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.lorapok');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json');

class LorapokConfig {
  constructor() {
    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      } catch (error) {
        console.error('❌ Error reading config file');
        return {};
      }
    }
    return {};
  }

  saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  getApiKey() {
    return this.config.apiKey || process.env.PERPLEXITY_API_KEY;
  }

  setApiKey(key) {
    this.set('apiKey', key);
  }

  getModel() {
    return this.config.model || 'sonar-pro';
  }

  setModel(model) {
    this.set('model', model);
  }

  getLanguage() {
    return this.config.language || 'javascript';
  }

  setLanguage(lang) {
    this.set('language', lang);
  }
}

module.exports = { LorapokConfig, CONFIG_DIR, CONFIG_FILE, HISTORY_FILE };
```

## Step 3.2: Create History Module

**File: `history.js`**
```javascript
const fs = require('fs');
const { HISTORY_FILE } = require('./config');

class LorapokHistory {
  constructor() {
    this.history = this.loadHistory();
  }

  loadHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      } catch {
        return [];
      }
    }
    return [];
  }

  save() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
  }

  add(type, input, output, model) {
    this.history.push({
      timestamp: new Date().toISOString(),
      type,
      input: input.substring(0, 100),
      output: output.substring(0, 100),
      model
    });
    this.save();
  }

  getAll() {
    return this.history;
  }

  clear() {
    this.history = [];
    this.save();
  }
}

module.exports = LorapokHistory;
```

## Step 3.3: Create Core Agent

**File: `agent.js`**
```javascript
const axios = require('axios');
const LorapokHistory = require('./history');
const { LorapokConfig } = require('./config');

const MODELS = {
  'sonar-small': { name: '🚀 Sonar Small', tier: 'free' },
  'sonar': { name: '⚡ Sonar', tier: 'free' },
  'sonar-pro': { name: '🎯 Sonar Pro', tier: 'free' },
  'claude-3-5-sonnet': { name: '✨ Claude 3.5 Sonnet', tier: 'pro' },
  'gemini-3-flash': { name: '⚡ Gemini 3 Flash', tier: 'pro' },
  'gemini-3-pro': { name: '🧠 Gemini 3 Pro', tier: 'pro' },
  'gpt-4o': { name: '🤖 GPT-4o', tier: 'pro' },
  'gpt-4-turbo': { name: '⚙️ GPT-4 Turbo', tier: 'pro' },
  'claude-opus-4-5': { name: '👑 Claude Opus 4.5', tier: 'pro' },
  'grok-4-1': { name: '🔮 Grok 4.1', tier: 'pro' },
  'kimi-k2-thinking': { name: '💭 Kimi K2 Thinking', tier: 'pro' }
};

class LorapokCodingAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    this.conversationHistory = [];
    this.config = new LorapokConfig();
    this.history = new LorapokHistory();
  }

  validateApiKey() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('API key is required. Get one from https://www.perplexity.ai/api-platform');
    }
  }

  async callPerplexityAPI(messages, model, options = {}) {
    this.validateApiKey();

    try {
      const payload = {
        model: this.mapModelName(model),
        messages,
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        return_citations: true
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      return {
        success: true,
        content: response.data.choices[0].message.content,
        citations: response.data.citations || [],
        model: model
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('❌ Invalid API key. Check your PERPLEXITY_API_KEY');
      }
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  mapModelName(model) {
    const mapping = {
      'sonar-small': 'sonar-small-online',
      'sonar': 'sonar-online',
      'sonar-pro': 'sonar-pro-online'
    };
    return mapping[model] || model;
  }

  async chat(userMessage, model = null, context = {}) {
    model = model || this.config.getModel();

    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const systemPrompt = `You are Lorapok, an expert AI coding assistant.
Language: ${context.language || this.config.getLanguage()}
Framework: ${context.framework || 'General'}
Task: ${context.task || 'General coding assistance'}

Provide clear, concise code examples with explanations.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory
    ];

    const response = await this.callPerplexityAPI(messages, model);

    if (response.success) {
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content
      });
      this.history.add('chat', userMessage, response.content, model);
    }

    return response;
  }

  async generateCode(requirements, language = null, framework = '') {
    language = language || this.config.getLanguage();
    const prompt = `Generate production-ready ${language} code for: ${requirements}${framework ? ` using ${framework}` : ''}

Requirements:
- Clean, well-structured code
- Include comments
- Error handling
- Type hints if applicable`;

    return this.chat(prompt, null, { language, framework, task: 'generate' });
  }

  async analyzeCode(code, language = null) {
    language = language || this.config.getLanguage();
    const prompt = `Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide insights on:
1. Code quality
2. Performance
3. Security concerns
4. Best practices
5. Refactoring suggestions`;

    return this.chat(prompt, null, { language, task: 'analyze' });
  }

  async debugCode(code, error, language = null) {
    language = language || this.config.getLanguage();
    const prompt = `Debug this ${language} code:

Code:
\`\`\`${language}
${code}
\`\`\`

Error:
${error}

Please:
1. Identify root cause
2. Explain why
3. Provide fix
4. Show corrected code`;

    return this.chat(prompt, null, { language, task: 'debug' });
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }

  getModels() {
    return MODELS;
  }
}

module.exports = { LorapokCodingAgent, MODELS };
```

## Step 3.4: Verify Agent Works

**File: `test-agent.js`** (temporary test)
```javascript
require('dotenv').config();
const { LorapokCodingAgent } = require('./agent');

async function test() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found. Add PERPLEXITY_API_KEY to .env');
    process.exit(1);
  }

  const agent = new LorapokCodingAgent(apiKey);
  
  console.log('🧪 Testing agent...\n');
  
  try {
    const response = await agent.chat('Hello! What is 2+2?');
    console.log('✅ Agent works!');
    console.log('Response:', response.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run test:
```bash
node test-agent.js
```

You should see a response! If error, check your API key in `.env`.

---

# PHASE 4: CLI INTERFACE

## Step 4.1: Create Main CLI File

**File: `index.js`** (Make executable with `#!/usr/bin/env node` at top)

```javascript
#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const { program } = require('commander');
const { LorapokCodingAgent, MODELS } = require('./agent');
const { LorapokConfig } = require('./config');
const LorapokHistory = require('./history');

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

// ==================== MODES ====================
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
  const language = await prompt(chalk.yellow(`Language [${config.getLanguage()}]: `)) || config.getLanguage();
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

  const code = await prompt(chalk.yellow('Paste your code: '));
  const language = await prompt(chalk.yellow(`Language [${config.getLanguage()}]: `)) || config.getLanguage();

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

  const code = await prompt(chalk.yellow('Paste your code: '));
  const error = await prompt(chalk.yellow('Paste error message: '));
  const language = await prompt(chalk.yellow(`Language [${config.getLanguage()}]: `)) || config.getLanguage();

  const spinner = ora(chalk.gray('🔧 Debugging...')).start();

  try {
    const response = await agent.debugCode(code, error, language);
    spinner.succeed(chalk.green('✅'));

    console.log(chalk.cyan('\n🎯 Solution:\n'));
    console.log(response.content);
    console.log('');
  } catch (error) {
    spinner.fail(chalk.red(`❌ ${error.message}`));
  }
}

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
  console.log(`Model: ${chalk.yellow(MODELS[config.getModel()].name)}`);
  console.log(`Language: ${chalk.yellow(config.getLanguage())}`);
  console.log(`API Key: ${chalk.yellow(config.getApiKey() ? '✅' : '❌')}`);
  console.log('');
}

// ==================== MAIN MENU ====================
async function mainMenu() {
  const config = new LorapokConfig();

  if (!config.getApiKey()) {
    await setupApiKey();
  }

  const apiKey = config.getApiKey();
  const agent = new LorapokCodingAgent(apiKey);

  while (true) {
    console.log(chalk.cyan('\n🐛 ════════════════════════════════'));
    console.log(chalk.cyan('   LORAPOK CODING AGENT v1.0.0'));
    console.log(chalk.cyan('════════════════════════════════\n'));

    console.log(chalk.yellow('1') + ' 💬 Chat');
    console.log(chalk.yellow('2') + ' ✨ Generate Code');
    console.log(chalk.yellow('3') + ' 🔍 Analyze Code');
    console.log(chalk.yellow('4') + ' 🐛 Debug Code');
    console.log(chalk.yellow('5') + ' 📦 Change Model');
    console.log(chalk.yellow('6') + ' 📜 History');
    console.log(chalk.yellow('7') + ' ⚙️  Settings');
    console.log(chalk.yellow('8') + ' 🔑 Update API Key');
    console.log(chalk.yellow('0') + ' ❌ Exit\n');

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
        await selectModel(config);
        break;
      case '6':
        await showHistory();
        break;
      case '7':
        await showSettings();
        break;
      case '8':
        await setupApiKey();
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
  .description('🐛 AI Coding Agent')
  .version('1.0.0');

program
  .command('chat')
  .description('Start chat mode')
  .action(async () => {
    const config = new LorapokConfig();
    if (!config.getApiKey()) await setupApiKey();
    const agent = new LorapokCodingAgent(config.getApiKey());
    await chatMode(agent, config);
    rl.close();
  });

program
  .command('generate <req>')
  .option('-l, --language <lang>', 'Language', 'javascript')
  .description('Generate code')
  .action(async (req, options) => {
    const config = new LorapokConfig();
    if (!config.getApiKey()) await setupApiKey();
    const agent = new LorapokCodingAgent(config.getApiKey());
    
    const spinner = ora(chalk.gray('🔧 Generating...')).start();
    try {
      const response = await agent.generateCode(req, options.language);
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
  .description('Analyze code')
  .action(async (code, options) => {
    const config = new LorapokConfig();
    if (!config.getApiKey()) await setupApiKey();
    const agent = new LorapokCodingAgent(config.getApiKey());
    
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
  .command('setup')
  .description('Initial setup')
  .action(async () => {
    await setupApiKey();
    const config = new LorapokConfig();
    await selectModel(config);
    rl.close();
  });

// Run
if (process.argv.length === 2) {
  mainMenu().catch(console.error);
} else {
  program.parse(process.argv);
}
```

## Step 4.2: Make CLI Executable

```bash
chmod +x index.js
```

---

# PHASE 5: TESTING & DEBUGGING

## Step 5.1: Test Locally

Run the main CLI:
```bash
node index.js
```

You should see the menu. Choose option "1" for chat and test it!

## Step 5.2: Test CLI Commands

```bash
# Test chat
node index.js chat

# Test code generation
node index.js generate "create a hello world function" -l javascript

# Test analysis
node index.js analyze "const x = 5;" -l javascript

# Test setup
node index.js setup
```

## Step 5.3: Troubleshooting

**Error: "API key is required"**
- Run: `node index.js setup`
- Enter your API key

**Error: "Invalid API key"**
- Check your key at https://www.perplexity.ai/api-platform
- Update `.env` file with correct key

**Error: "Cannot find module"**
- Run: `npm install`

**Spinner not showing**
- That's fine, the agent is still working

---

# PHASE 6: LOCAL USAGE

## Step 6.1: Setup Global Command (Optional)

Make `lorapok` work globally:

**Update `package.json` bin section:**
```json
"bin": {
  "lorapok": "./index.js"
}
```

Then link it:
```bash
npm link
```

Now use from anywhere:
```bash
lorapok
lorapok chat
lorapok generate "your requirements"
```

## Step 6.2: Create Shortcuts

**On Mac/Linux**, add to `~/.bashrc` or `~/.zshrc`:
```bash
alias lorapok='node ~/path/to/lorapok-agent/index.js'
```

**On Windows**, create `lorapok.bat`:
```batch
@echo off
node C:\path\to\lorapok-agent\index.js %*
```

---

# PHASE 7: WEB SERVER (OPTIONAL)

If you want a web interface, create this:

**File: `server.js`**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { LorapokCodingAgent } = require('./agent');
const { LorapokConfig } = require('./config');

const app = express();
const sessions = new Map();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    const config = new LorapokConfig();
    const agent = new LorapokCodingAgent(config.getApiKey());
    
    const response = await agent.chat(message, model);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { requirements, language } = req.body;
    const config = new LorapokConfig();
    const agent = new LorapokCodingAgent(config.getApiKey());
    
    const response = await agent.generateCode(requirements, language);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🐛 Lorapok API running on port ${PORT}`);
});
```

Install additional dependency:
```bash
npm install express cors
```

Run server:
```bash
node server.js
```

---

# PHASE 8: DEPLOYMENT

## Step 8.1: Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create lorapok-agent

# Add your API key
heroku config: