<div align="center">

<img src="assets/logo.png" alt="Lorapok AI Logo" width="180" />

```
██╗      ██████╗ ██████╗  █████╗ ██████╗  ██████╗ ██╗  ██╗     █████╗ ██╗
██║     ██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██║ ██╔╝    ██╔══██╗██║
██║     ██║   ██║██████╔╝███████║██████╔╝██║   ██║█████╔╝     ███████║██║
██║     ██║   ██║██╔══██╗██╔══██║██╔═══╝ ██║   ██║██╔═██╗     ██╔══██║██║
███████╗╚██████╔╝██║  ██║██║  ██║██║     ╚██████╔╝██║  ██╗    ██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝
```

# 🐛 Lorapok AI

**Autonomous, action-oriented terminal AI assistant powered by Perplexity AI & Express REST API.**

*Plan. Code. Execute. Commit. Deploy — directly from your terminal.*

[![CI Pipeline](https://github.com/Maijied/Lorapok_AI_Agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Maijied/Lorapok_AI_Agent/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/lorapok-ai.svg)](https://www.npmjs.com/package/lorapok-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org)

</div>

---

## 🌟 Feature Matrix

| Feature | Description | Status |
| :--- | :--- | :---: |
| ⚡ **Token-Saving Response Cache** | Persistent SHA-256 LLM response cache (`/cache`) reducing token consumption & latency | `Ready` |
| 💻 **Collapsible Bash Process Box** | Framed bash execution box with duration badges, exit status, and collapsible output | `Ready` |
| 🤖 **Interactive AI REPL** | Terminal-first interactive chat powered by Perplexity API | `Ready` |
| 📝 **Proactive File Actions** | Proposes CREATE / UPDATE / DELETE file operations with interactive diff previews | `Ready` |
| 🔗 **Full Git Suite** | Smart AI commits, branching, stashing, pushing, pulling, log viewing | `Ready` |
| ⚡ **GitHub Actions Manager** | Monitor workflow runs, inspect jobs, and rerun failed pipelines | `Ready` |
| 🔐 **GitHub Auth System** | Support for Personal Access Tokens, OAuth Device Flow, and GH CLI integration | `Ready` |
| 🎨 **Terminal UI & Themes** | 12+ ASCII font themes, animated startup, markdown syntax highlighting | `Ready` |
| 📋 **Plan & Execute Workflow** | `/plan` multi-step workflow: Plan → Checklist → Execution → Summary | `Ready` |
| 🐳 **Docker-First Environment** | Isolated Docker container execution with host volume mounting | `Ready` |
| 🌐 **REST API Server** | Express web server providing REST endpoints (default port 3847) | `Ready` |


---

## 🚀 Installation

### Option 1: Global Installation via npm (Recommended)
```bash
npm install -g lorapok-ai
lorapok
```

### Option 2: Instant Execution via npx
```bash
npx lorapok-ai
```

### Option 3: Docker Execution
```bash
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent
npm run setup   # Installs dependencies, builds docker container, and links package
lorapok         # Launches CLI inside Docker container
```

### Option 4: Local Development Setup
```bash
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent
npm install
node bin/lorapok.js --local
```

## 🗑️ Uninstall

### If installed globally via npm:
```bash
npm uninstall -g lorapok-ai
```

### If installed from source (setup script):
```bash
npm run uninstall
```

### Manual cleanup:
```bash
# Remove global CLI link
sudo npm unlink lorapok-ai -g

# Remove Docker resources
docker compose down --rmi local

# Remove user config (API keys, settings, logs)
rm -rf ~/.lorapok
```

---

## 🎯 Quick Start Guide

1. **Set your Perplexity API Key:**
   ```bash
   # Via Environment Variable
   export PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx

   # Or add to a local .env file
   echo "PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx" > .env
   ```

2. **Launch Lorapok CLI:**
   ```bash
   lorapok
   ```

3. **Start Interacting:**
   - Type your request directly (e.g., *"Refactor utils.js to export helper functions"*).
   - Press `/` or `Enter` on an empty line to display the **Slash Command Menu**.
   - Type `@` to select a file for code context.

---

## ⚙️ Configuration Reference

Lorapok stores user settings in `~/.lorapok/config.json`. You can modify settings via `/settings` or environment variables:

| Variable | Description | Default Value | Required |
| :--- | :--- | :---: | :---: |
| `PERPLEXITY_API_KEY` | Perplexity AI API Key for model inference | — | **Yes** |
| `PORT` | Express REST API server port | `3847` | No |
| `NODE_ENV` | Environment mode (`development` / `production`) | `production` | No |
| `GH_TOKEN` | GitHub Access Token for Git & Actions integration | — | No |
| `LORAPOK_DOCKER` | Set to `true` when running inside Docker container | `false` | No |
| `PROJECT_ROOT` | Workspace path inside container environment | `/project` | No |

---

## 💻 CLI Command Reference

| Command | Shortcut / Alias | Description |
| :--- | :--- | :--- |
| `/chat` | `chat`, `Enter` | Interactive AI coding chat mode |
| `/plan` | `plan` | Trigger Plan → Tasks → Code execution workflow |
| `/analyze` | `analyze` | Perform deep project structure analysis |
| `/git` | `git` | Open Git operations & authentication menu |
| `/actions` | `ci`, `actions` | Monitor and trigger GitHub Actions workflows |
| `/files` | `files` | Display visual project file tree |
| `/logs` | `logs` | View recent system diagnostic logs |
| `/settings` | `settings` | Customize theme, model, primary language, username |
| `/clear` | `clear` | Clear terminal screen |
| `/help` | `?`, `help` | Display command reference |
| `/exit` | `exit`, `/q` | Exit Lorapok session |

---

## 🌐 REST API Endpoints

The Express server (`npm run server`, default port 3847) exposes the following endpoints:

| Endpoint | Method | Description | Request Body Example |
| :--- | :---: | :--- | :--- |
| `/health` | `GET` | Server health and Lorapok Labs branding status | N/A |
| `/api/models` | `GET` | List available Perplexity AI models | N/A |
| `/api/chat` | `POST` | Send prompt to AI agent | `{ "message": "Explain index.js", "sessionId": "default" }` |
| `/api/generate` | `POST` | Generate code snippets based on requirements | `{ "requirements": "Create a logger module", "language": "js" }` |
| `/api/analyze` | `POST` | Analyze codebase structure | `{ "sessionId": "default" }` |
| `/api/debug` | `POST` | Debug snippet or error trace | `{ "code": "...", "error": "TypeError: ..." }` |
| `/api/files` | `GET` | List files in current project directory | N/A |
| `/api/files/read` | `GET` | Read file contents (`?path=lib/config.js`) | N/A |
| `/api/git/status` | `GET` | Get current Git working tree status | N/A |
| `/api/git/commit` | `POST` | Commit staged changes | `{ "message": "feat: add logger" }` |
| `/api/git/log` | `GET` | Retrieve recent commit log history | N/A |
| `/api/settings` | `GET/PUT` | Retrieve or update user configuration settings | `{ "model": "sonar-pro" }` |

---

## 🧪 Testing & Verification

```bash
# Run unit and integration tests
npm test

# Run tests inside Docker container
npm run test:docker
```

---

## 🤝 Contributing

We welcome contributions! Please consult our [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on our code of conduct, development setup, conventional commit standards, and pull request submission process.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with 🐛 by [Lorapok Labs](https://lorapok.tech)**

*Lorapok — Your expert AI coding companion in the terminal.*

Copyright (c) 2026 Lorapok Labs. All rights reserved.

</div>
