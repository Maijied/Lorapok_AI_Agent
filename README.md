<div align="center">

# 🐛 Lorapok — Expert AI Coding Agent

**An action-oriented AI coding agent for your terminal.**
Powered by the [Perplexity Sonar API](https://www.perplexity.ai/api-platform), Lorapok combines deep project analysis, structured planning, proactive file operations, bash command execution, and full Git/GitHub Actions integration — all inside a premium interactive CLI.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-Jest-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running Lorapok](#-running-lorapok)
- [CLI Commands & Usage](#-cli-commands--usage)
- [REST API (Server Mode)](#-rest-api-server-mode)
- [Docker Deployment](#-docker-deployment)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Branch Guide](#-branch-guide)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 Overview

Lorapok is a **terminal-native AI coding agent** that goes beyond simple chatbots. It doesn't just answer questions — it **takes action**. When you describe a task, Lorapok:

1. **Analyzes** your project structure and codebase.
2. **Plans** a step-by-step technical strategy.
3. **Generates** precise file actions (CREATE / UPDATE / DELETE) and bash commands.
4. **Shows diffs** for every proposed change so you can review before applying.
5. **Commits** changes with AI-generated Conventional Commit messages.

It acts as an autonomous pair programmer inside your terminal with full control remaining in your hands.

---

## ✨ Key Features

| Category | Feature | Description |
|---|---|---|
| 💬 **Chat** | Interactive AI Chat | Natural language conversation with context-aware coding assistance |
| 📋 **Plan** | Structured Workflow | Plan → Tasks → Implementation → Walkthrough pipeline |
| ⚡ **Actions** | Proactive File Ops | Auto-proposes CREATE, UPDATE, DELETE actions with diff preview |
| 💻 **Bash** | Command Execution | Run shell commands directly with user confirmation & output capture |
| 🔍 **Analyze** | Project Analysis | Deep scan of directory structure, tech stack, and code quality |
| 🔗 **Git** | Full Git Suite | Status, diff, commit (AI/manual), branches, stash, merge, cherry-pick, tags, reset |
| 🔐 **Auth** | GitHub Authentication | Browser-based token generation, manual token entry, SSH support |
| ⚡ **CI/CD** | GitHub Actions | Browse workflows, view run details/jobs/steps, trigger re-runs |
| 📁 **Files** | File Explorer | Visual project tree with emoji icons and @ mention navigation |
| 🎨 **UI** | Premium Terminal UI | Animated ASCII branding, theme selector (12+ fonts), high-contrast rendering |
| 🧠 **Models** | Multi-Model Support | Switch between Sonar, Sonar Pro, Sonar Reasoning, Sonar Deep Research |
| 🐳 **Docker** | Container Support | Runs natively or inside Docker with automatic host volume mounting |
| 📊 **Logs** | Diagnostic Viewer | View structured JSON logs from within the CLI |
| 🛡️ **Recovery** | Self-Healing Config | Detects invalid API keys and offers immediate inline fix |
| 📄 **Markdown** | Rich Rendering | High-contrast code boxes, smart table pivot, styled lists, and diff blocks |
| 🌐 **API** | REST Server | Full REST API for programmatic access to all agent capabilities |

---

## 🏗 Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                                                                  │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐   │
│  │  CLI (TTY)   │     │  REST API    │     │  Docker Entry   │   │
│  │  index.js    │     │  server.js   │     │  bin/lorapok.js │   │
│  └──────┬───────┘     └──────┬───────┘     └────────┬────────┘   │
│         │                    │                      │            │
│         └────────────┬───────┘──────────────────────┘            │
│                      ▼                                           │
│         ┌────────────────────────┐                               │
│         │   LorapokEnhancedAgent │ ◄── Orchestrator              │
│         │   lib/agent-enhanced.js│                               │
│         └────────────┬───────────┘                               │
│                      │ extends                                   │
│         ┌────────────▼───────────┐                               │
│         │   LorapokCodingAgent   │ ◄── API + Conversation Engine │
│         │   lib/agent.js         │                               │
│         └────────────┬───────────┘                               │
│                      │                                           │
├──────────────────────┼───────────────────────────────────────────┤
│                CORE SERVICES                                     │
│                      │                                           │
│    ┌─────────────────┼───────────────────────────┐               │
│    │                 │                           │               │
│    ▼                 ▼                           ▼               │
│ ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐        │
│ │FileManager│  │  GitManager  │  │  ActionsManager      │        │
│ │(CRUD ops) │  │ (Git + Auth) │  │  (GitHub Actions API)│        │
│ └──────────┘  └──────────────┘  └──────────────────────┘        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    SUPPORT LAYER                                 │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Config  │  │ History  │  │  Logger  │  │ Renderer (MD)    │ │
│  │ ~/.lorapok│  │ JSON log │  │ Winston  │  │ marked-terminal  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  TerminalUI (lib/ui.js)                                      ││
│  │  Figlet branding, boxen panels, cli-table3, ora spinners,    ││
│  │  diff viewer, theme engine, pixel-art larva animation        ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                  EXTERNAL SERVICES                               │
│                                                                  │
│  ┌────────────────────┐    ┌───────────────────────┐             │
│  │ Perplexity Sonar   │    │  GitHub REST API v3   │             │
│  │ api.perplexity.ai  │    │  api.github.com       │             │
│  └────────────────────┘    └───────────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input  ──►  index.js (CLI Router)
                    │
                    ├── Chat ──► agent.chat() ──► Perplexity API ──► parseActions()
                    │                                                    │
                    │                                         ┌─────────┴──────────┐
                    │                                         ▼                    ▼
                    │                                   File Actions         Bash Commands
                    │                                   (CREATE/UPDATE/      (executeCommand)
                    │                                    DELETE via           with user
                    │                                    FileManager)         confirmation
                    │
                    ├── /plan ──► agent.plan() → agent.tasks() → agent.generateCode()
                    │                               → parseActions() → apply → smartCommit()
                    │
                    ├── /git ──► GitManager (status/diff/commit/push/pull/stash/merge...)
                    │
                    ├── /actions ──► ActionsManager ──► GitHub API (workflows/runs/jobs)
                    │
                    ├── /analyze ──► agent.analyzeProject() ──► Perplexity API
                    │
                    └── /settings ──► LorapokConfig (~/.lorapok/config.json)
```

### Module Responsibilities

| Module | File | Lines | Purpose |
|---|---|---|---|
| **CLI Entry** | `index.js` | 1526 | Main interactive loop, command routing, menus, action application |
| **CLI Binary** | `bin/lorapok.js` | 49 | Entry point for `lorapok` command — redirects to Docker or runs locally |
| **REST Server** | `server.js` | 289 | Express API server with chat, generate, analyze, debug, git, file endpoints |
| **Base Agent** | `lib/agent.js` | 316 | Core Perplexity API integration, identity management, conversation history |
| **Enhanced Agent** | `lib/agent-enhanced.js` | 307 | Extends base agent with file ops, git ops, action parsing, workflows |
| **Config** | `lib/config.js` | 105 | Persistent JSON config in `~/.lorapok/config.json` |
| **History** | `lib/history.js` | 53 | Chat history persistence in `~/.lorapok/history.json` |
| **Logger** | `lib/logger.js` | 28 | Winston logger writing to `~/.lorapok/logs/` |
| **Renderer** | `lib/renderer.js` | 354 | Terminal markdown rendering with high-contrast code boxes, smart table pivot |
| **Terminal UI** | `lib/ui.js` | 677 | Full UI system: animated branding, themes, tables, spinners, diffs, panels |
| **FileManager** | `services/FileManager.js` | 188 | Sandboxed file CRUD, tree generation, file search |
| **GitManager** | `services/GitManager.js` | 250 | Git CLI wrapper: status, commit, push, pull, branches, stash, merge, etc. |
| **ActionsManager** | `services/ActionsManager.js` | 110 | GitHub Actions API client: workflows, runs, jobs, re-runs |

---

## 📂 Project Structure

```
lorapok_ai_agent/
├── bin/
│   └── lorapok.js              # CLI binary (npm link entry point)
├── lib/
│   ├── agent.js                # Base Perplexity API agent
│   ├── agent-enhanced.js       # Extended agent (files + git + workflows)
│   ├── config.js               # Persistent configuration manager
│   ├── history.js              # Chat history manager
│   ├── logger.js               # Winston structured logger
│   ├── renderer.js             # Terminal markdown renderer
│   └── ui.js                   # Full terminal UI system
├── services/
│   ├── ActionsManager.js       # GitHub Actions API client
│   ├── FileManager.js          # File operations (sandboxed)
│   └── GitManager.js           # Git operations wrapper
├── scripts/
│   ├── install.sh              # Linux/macOS setup script
│   └── install.ps1             # Windows (PowerShell) setup script
├── tests/
│   ├── agent.test.js           # Agent logic & identity tests
│   ├── api.test.js             # REST API endpoint tests
│   ├── FileManager.test.js     # File operations tests
│   ├── GitManager.test.js      # Git operations tests
│   ├── LorapokConfig.test.js   # Configuration tests
│   └── LorapokHistory.test.js  # History persistence tests
├── index.js                    # Main CLI application (interactive loop)
├── server.js                   # REST API server (Express)
├── Dockerfile                  # Docker image definition (Node 18 Alpine)
├── docker-compose.yml          # Docker Compose configuration
├── package.json                # Dependencies and npm scripts
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── USAGE.md                    # Detailed usage guide
├── TESTING.md                  # Beta verification guide
└── README.md                   # This file
```

---

## 📋 Prerequisites

- **Node.js** ≥ 16.0.0
- **npm** ≥ 8.x
- **Git** installed and configured
- **Docker** & **Docker Compose** _(optional — for containerized mode)_
- **Perplexity API Key** — [Get one here](https://www.perplexity.ai/api-platform)

---

## 🚀 Installation & Setup

### Method 1: One-Line Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent

# Run the automated installer (installs deps, builds Docker, links CLI)
# Linux / macOS:
chmod +x scripts/install.sh && ./scripts/install.sh

# Windows (PowerShell as Admin):
.\scripts\install.ps1
```

This will:
1. Run `npm install` to install Node.js dependencies.
2. Run `docker compose build` to build the Docker image.
3. Run `npm link --force` to make the `lorapok` command globally available.

### Method 2: Manual Setup

```bash
# Clone
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent

# Install dependencies
npm install

# Configure API key
cp .env.example .env
# Edit .env and set: PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# (Optional) Build Docker image
docker compose build

# (Optional) Link CLI globally
npm link --force
```

### Method 3: npm Setup Script

```bash
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent
npm run setup
```

> **Note:** On first launch, if no API key is found in `.env` or `~/.lorapok/config.json`, Lorapok will prompt you to enter one interactively.

---

## 🎮 Running Lorapok

### Interactive CLI (Primary Mode)

```bash
# If globally linked:
lorapok

# Or run directly:
npm start
# or
node index.js
```

### Via Docker

```bash
# Run inside Docker container (auto-mounts current directory):
npm run docker:run

# Or directly:
docker compose run --rm lorapok
```

### REST API Server

```bash
# Start the API server on port 3847:
npm run server
# or
node server.js
```

### Development Mode (Auto-Restart)

```bash
npm run dev    # Uses nodemon for hot-reload
```

---

## 🎯 CLI Commands & Usage

When Lorapok is running, type `/` or press **Enter** on empty input to open the command palette:

| Command | Shortcut | Description |
|---|---|---|
| 💬 **Chat** | _(default)_ | Natural language conversation with your AI agent |
| 📝 **Plan & Execute** | `/plan` | Full workflow: Plan → Tasks → Code Generation → Walkthrough |
| 🔍 **Analyze Project** | `/analyze` | Deep architectural analysis of your project |
| 📁 **Files** | `/files` | Visual file tree explorer |
| 🔗 **Git Ops** | `/git` | Full git operations menu |
| ⚡ **GitHub Actions** | `/actions` | CI/CD workflow monitoring & re-runs |
| 📊 **Logs** | `/logs` | View structured diagnostic logs |
| ⚙️ **Settings** | `/settings` | Change model, name, language, theme, API key |
| ❓ **Help** | `/help` | Show command reference table |
| 🧹 **Clear** | `/clear` | Clear terminal screen |
| ❌ **Exit** | `/exit`, `/q` | End session with usage summary |

### Special Input Keys

| Key | Action |
|---|---|
| `@` | Open the file browser to mention a specific file in your message |
| `/` | Open the slash command palette |
| `Esc` | Cancel current operation (works during API calls) |
| `Ctrl+C` | Exit the application (shows session summary) |

### Chat Examples

```
> Create a REST API endpoint for user registration with validation
> Refactor the auth module to use async/await
> Debug this error: TypeError: Cannot read property 'map' of undefined
> Analyze @src/utils/helpers.js for performance issues
```

### Plan & Execute Workflow

The `/plan` command triggers a 4-phase workflow:

```
1. 📝 PLANNING     → AI generates a detailed technical strategy
2. 📋 TASKING      → Plan is broken into a granular checklist
3. ⚡ IMPLEMENT    → AI generates code with action blocks (CREATE/UPDATE/DELETE)
4. 🚀 WALKTHROUGH  → AI summarizes changes with verification steps
```

At each phase, you can review and approve before proceeding.

### Git Operations Menu

The `/git` menu provides:

| Sub-command | Description |
|---|---|
| 🔍 Status | View modified, added, deleted, untracked files |
| 📝 View Diff | See line-by-line changes |
| 🤖 Smart Commit | AI-generated commit message from diff |
| 📝 Manual Commit | Write your own commit message |
| 🌿 Branches | List, create, switch branches |
| 📜 Commit Log | View recent commit history |
| 🔄 Push/Pull | Sync with remotes (auto-auth retry) |
| 📥 Stash | Push, pop, list, clear stashes |
| 🌐 Remotes | Add, remove, rename, update remote URLs |
| 🔑 Auth | Browser login, manual token, SSH, clear credentials |
| ⚙️ Advanced | Amend, tags, merge, cherry-pick, reset, clean, diagnostics |

---

## 🌐 REST API (Server Mode)

Start the server with `npm run server`. The API runs on port **3847** by default.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (returns `{ status: 'ok' }`) |
| `GET` | `/api/models` | List available Perplexity models |
| `POST` | `/api/chat` | Send a chat message |
| `POST` | `/api/generate` | Generate code from requirements |
| `POST` | `/api/analyze` | Analyze provided code |
| `POST` | `/api/debug` | Debug code with error message |
| `GET` | `/api/files` | List project files |
| `GET` | `/api/files/tree` | Get project file tree |
| `GET` | `/api/files/read?path=<file>` | Read a specific file |
| `POST` | `/api/files/generate` | AI-generate a file |
| `GET` | `/api/git/status` | Get git status |
| `GET` | `/api/git/branches` | List git branches |
| `GET` | `/api/git/log?count=<n>` | Get commit log |
| `POST` | `/api/git/commit` | Commit with message |
| `POST` | `/api/git/smart-commit` | AI-generated commit |
| `GET` | `/api/settings` | Get current settings |
| `PUT` | `/api/settings` | Update settings |
| `DELETE` | `/api/sessions/:id` | Clear a session |

### Example API Calls

```bash
# Chat
curl -X POST http://localhost:3847/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Write a fibonacci function in Python"}'

# Generate Code
curl -X POST http://localhost:3847/api/generate \
  -H "Content-Type: application/json" \
  -d '{"requirements": "REST API with Express", "language": "javascript"}'

# Git Status
curl http://localhost:3847/api/git/status

# Health Check
curl http://localhost:3847/health
```

---

## 🐳 Docker Deployment

### Architecture

Lorapok uses a **Docker-outside-of-Docker (DooD)** pattern:
- The `bin/lorapok.js` CLI entry point detects if it's running on the host or inside Docker.
- On the host, it redirects commands to `docker compose run --rm lorapok`.
- Inside Docker, it runs `index.js` directly.
- Your project directory is mounted at `/project` inside the container.

### Docker Compose Configuration

```yaml
services:
  lorapok:
    build: .
    container_name: lorapok-ai-agent
    restart: unless-stopped
    ports:
      - "3847:3847"
    environment:
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
      - LORAPOK_DOCKER=true
    volumes:
      - .:/app                        # Application code
      - /app/node_modules             # Isolated node_modules
      - lorapok-config:/root/.lorapok  # Persistent config
      - ${PROJECT_ROOT:-.}:/project    # Your project workspace
```

### Docker Commands

```bash
# Build the Docker image
npm run docker:build
# or
docker compose build

# Run Lorapok in Docker
npm run docker:run
# or
docker compose run --rm lorapok

# Run tests inside Docker
npm run test:docker
# or
docker compose run --rm lorapok npm test

# Rebuild after code changes
npm run update
```

---

## ⚙️ Configuration

### Persistent Config Location

```
~/.lorapok/
├── config.json     # API key, model, language, username, theme, GitHub token
├── history.json    # Chat interaction history
└── logs/
    ├── combined.log  # All log entries (JSON)
    └── error.log     # Error-level entries only
```

### Settings Menu (`/settings`)

| Setting | Options | Default |
|---|---|---|
| **Name** | Any string | _(set on first run)_ |
| **Model** | `sonar`, `sonar-pro`, `sonar-reasoning`, `sonar-reasoning-pro`, `sonar-deep-research` | `sonar` |
| **Language** | Any programming language | `javascript` |
| **CLI Theme** | 12+ figlet fonts (Graceful, Executive, Engineering, Big, etc.) | `Small` |
| **API Key** | Perplexity API key | _(required)_ |

### Available AI Models

| Model | Description | Tier |
|---|---|---|
| ⚡ `sonar` | Fast general-purpose model | Free |
| 🎯 `sonar-pro` | Higher accuracy and detail | Pro |
| 🧠 `sonar-reasoning` | Complex logic and analysis | Pro |
| 🔬 `sonar-reasoning-pro` | Advanced reasoning | Pro |
| 🔍 `sonar-deep-research` | Deep research and investigation | Pro |

---

## 🧪 Testing

### Run the Test Suite

```bash
# Run all tests
npm test

# Run tests inside Docker
npm run test:docker
```

### Test Coverage

The project includes **6 test suites** covering:

| Test Suite | File | Coverage |
|---|---|---|
| **Agent Logic** | `tests/agent.test.js` | Identity responses, API error handling, conversation history |
| **REST API** | `tests/api.test.js` | All Express endpoints (health, chat, generate, git, settings) |
| **FileManager** | `tests/FileManager.test.js` | CRUD operations, path validation, security sandbox |
| **GitManager** | `tests/GitManager.test.js` | Status, commit, branch, remote operations |
| **Config** | `tests/LorapokConfig.test.js` | Load, save, get/set, defaults |
| **History** | `tests/LorapokHistory.test.js` | Add, retrieve, clear, persistence |

### Manual Verification

See [TESTING.md](TESTING.md) for a step-by-step manual verification guide covering:
- Environment health check
- Interactive UI verification
- Proactive implementation test
- Code hiding behavior
- Docker redirection

---

## 🌿 Branch Guide

| Branch | Status | Description |
|---|---|---|
| **`main`** | Stable | Base release with core features, premium UI, and test fixes |
| **`bash-command-support-update-language-support`** | Merged to main | Added 60+ language support in renderer, enhanced action parsing, 45 passing tests |
| **`git-features-integration`** | Feature branch | Full Git auth system (Device Flow, GitHub CLI, browser-based), GitHub Actions explorer, remote management, animated branding with themes |
| **`ui-polish-and-functionality-improvement`** | **Active (HEAD)** | UI polish, ESC-to-cancel, code hiding, session summaries, settings themes, refined menus |
| **`UI-Refurbish-Lorapok-CLI`** | Archived | Experimental Claude/Copilot aesthetic overhaul (archived in favor of current approach) |

### Branch Lineage

```
main
├── bash-command-support
│   └── bash-command-support-update-language-support (merged to main)
├── git-features-integration
│   ├── UI-Refurbish-Lorapok-CLI (archived)
│   └── ui-polish-and-functionality-improvement ◄── CURRENT
└── (all branches extend from main)
```

### Feature Progression

```
v0.x  Core chat + code generation + Docker support
  │
  ├─► Bash command execution with user confirmation
  │     └─► 60+ language support in renderer
  │
  ├─► Git authentication suite (token, SSH, Device Flow)
  │     ├─► GitHub Actions monitoring & re-runs
  │     ├─► Animated ASCII branding with theme selection
  │     └─► UI polish: ESC-cancel, diff viewer, session stats
  │
  └─► REST API server mode (Express)
```

---

## 🔐 Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PERPLEXITY_API_KEY` | **Yes** | — | Your Perplexity API key |
| `PERPLEXITY_API_URL` | No | `https://api.perplexity.ai/chat/completions` | API endpoint |
| `PORT` | No | `3847` | REST server port |
| `NODE_ENV` | No | `development` | Node environment |
| `GH_TOKEN` | No | — | GitHub personal access token (can also set via `/settings`) |
| `GITHUB_TOKEN` | No | — | Alias for `GH_TOKEN` |
| `GITHUB_CLIENT_ID` | No | — | OAuth client ID for Device Flow auth |
| `LORAPOK_DOCKER` | No | — | Set to `true` when running inside Docker |
| `PROJECT_ROOT` | No | `.` | Host project path for Docker volume mount |
| `LOG_LEVEL` | No | `info` | Winston log level (`error`, `warn`, `info`, `debug`) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat(scope): description"`
4. Push to your fork: `git push origin feat/your-feature`
5. Open a Pull Request

### Development Workflow

```bash
# Install dependencies
npm install

# Run in development mode (auto-restart on changes)
npm run dev

# Run tests
npm test

# Run tests in Docker
npm run test:docker
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🐛 by [Maizied](https://github.com/Maijied)**

*Lorapok — Your expert AI coding companion in the terminal.*

</div>

