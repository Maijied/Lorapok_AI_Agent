# 🐛 Lorapok - Expert AI Coding Agent

Lorapok is a powerful, action-oriented coding agent designed for rapid development. Powered by the **Perplexity Sonar API**, it combines architectural analysis, structured planning, and proactive file execution into a single, high-performance terminal experience.

---

## 💎 Premium UI & High-Contrast Aesthetics

Lorapok features a **Luxury Terminal Engine** designed for developers who demand clarity and style:
- **High-Contrast Rendering**: Vibrant, color-coded output with support for **60+ programming languages** and configurations.
- **Smart Pivot Tables**: Too much data for a horizontal table? Lorapok automatically converts dense technical data into beautiful **Card Views** to ensure 100% readability.
- **Vibrant Branding**: A stunning gradient-styled startup logo and professional status headers.
- **Enhanced Markdown Support**: Rich rendering of headers, lists, and links with syntax-aware code blocks.
- **Task Visualization**: Clear, status-aware checklists (`▢` for pending, `✔` for completed).

## 🚀 Key Features

- 💬 **Interactive Chat**: Directly communicate your objectives in a natural conversation.
- 📋 **Structured Planning (/plan)**: Generates detailed implementation strategies with automatic task-list tracking.
- ⚡ **Proactive Code Actions**: Automatically identifies and proposes `CREATE`, `UPDATE`, and `DELETE` actions.
- 💻 **Bash Command Execution**: Proposes shell commands with session-aware CWD tracking and interactive approval.
- 🔍 **Deep Project Analysis (/analyze)**: Scans your directory structure to provide architectural insights.
- 🐳 **Seamless Docker Engine**: Runs via Docker for perfect consistency across any environment.
- 💻 **Universal Execution**: Native support for Linux, macOS, and Windows (PowerShell/CMD) via the `--local` flag.
- 🛠️ **Self-Healing Config**: Intelligent error recovery that detects invalid API keys and helps you fix them on the fly.
- 🔗 **Smart Workspace Handling**: Automatically detects and maps your host directories correctly, even when running inside a container.

---

## 🏗️ Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent
```

### 2. Configure API Key
Get your key from [Perplexity](https://www.perplexity.ai/api-platform) and add to `.env`:
```bash
cp .env.example .env
# Open .env and add your PERPLEXITY_API_KEY
```

### 3. Install
Run the one-step installer to link the `lorapok` command to your system:
```bash
# Linux/macOS
./scripts/install.sh

# Windows (PowerShell)
.\scripts\install.ps1
```

### 4. Run!
Simply type `lorapok` in any project folder:
```bash
lorapok
```

---

## 📘 Commands & Usage

Type `/` at the prompt to access the full command suite:
- `/plan` - Start a structured multi-step technical workflow.
- `/analyze` - Get deep architectural insights into your project.
- `/files` - Visualize your project structure and verify file visibility.
- `/git` - Check status and generate AI-powered commit messages.
- `/settings` - Swap models, change languages, or update your API key securely.

### File Mentions (@)
Need the agent to look at a specific file? Type `@` and use autocomplete to mention it in your message.

---

## 🌐 API & Server Mode

Lorapok isn't just a CLI; it can run as a REST server for integration:
```bash
npm run server
```
- **Port**: 3847
- **Endpoints**: `/health`, `/api/chat`, `/api/generate`

## 🧪 Development & Testing
```bash
# Run Jest test suite
npm test

# Update Docker image after changes
npm run update
```

## 📜 License
MIT
