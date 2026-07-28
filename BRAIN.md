# 🧠 Lorapok AI Agent - Central System Brain (BRAIN.md)

> **LIVING SYSTEM MEMORY & KNOWLEDGE BASE**  
> *Last Synced: 2026-07-28 | Version: 1.0.0 | Test Suite: 16/16 Passed (155 Tests)*

---

## 📌 Executive Summary
**Lorapok AI Agent** is an enterprise-grade, action-oriented AI Coding Agent featuring:
- **CLI Engine**: Interactive terminal UI (`bin/lorapok.js`, `index.js`) built with Boxen, Figlet, Ora, Enquirer, and Marked.
- **REST API Server**: Express server (`server.js`) with CORS, file upload handling (`multer`), and session logging.
- **Agent Runtimes**: Dual execution capability (Native Node.js >= 18 and Docker Compose container fallback).
- **Core Integrations**: Multi-provider LLM support (Perplexity, OpenAI), Git repository management (`services/GitManager.js`), file system operations (`services/FileManager.js`), and action rerun execution (`services/ActionsManager.js`).

---

## 🏗️ System Architecture & Module Map

```
Lorapok AI Agent Workspace
├── bin/
│   └── lorapok.js               # CLI Launcher & Docker auto-redirection
├── commands/
│   ├── actions.js               # Background actions & rerun engine
│   ├── auth.js                  # GitHub OAuth & token management
│   ├── chat.js                  # Interactive terminal chat prompt
│   ├── git.js                   # Git CLI actions & branch menus
│   ├── settings.js              # Theme customization & log viewer
│   ├── system.js                # Environment diagnostics
│   ├── utils.js                 # Shared CLI utility functions
│   └── workflow.js              # Multi-step automation workflows
├── lib/
│   ├── agent-enhanced.js        # Context-aware AI Agent implementation
│   ├── agent.js                 # Core LLM API communication layer
│   ├── config.js                # Configuration manager (~/.lorapok/config.json)
│   ├── errors.js                # Custom LorapokError domain error types
│   ├── history.js               # Session & conversation history store
│   ├── logger.js                # Winston structured logging service
│   ├── renderer.js              # Terminal markdown & syntax highlighter
│   └── ui.js                    # Interactive Boxen/Ora/Enquirer components
├── services/
│   ├── ActionsManager.js        # Action queue & execution tracking
│   ├── FileManager.js           # Safe file operations & path checking
│   ├── GitManager.js            # Git command execution wrapper
│   └── GithubAuth.js            # OAuth token management
├── server.js                    # Express REST API backend
├── website/ & LorapokAiBuild/   # Frontend web UI & GitHub Pages build
├── tests/                       # Jest test suite (16 suites, 155 tests)
├── .agents/                     # AI Agent rules, skills, subagents & MCP config
│   ├── AGENTS.md                # Workspace developer & agent directives
│   ├── BRAIN.md                 # System memory sync copy
│   ├── mcp.json                 # Model Context Protocol server settings
│   ├── skills/                  # Custom agent skills
│   ├── steer/                   # Architectural steering guides
│   └── subagents/               # Autonomous subagent definitions
└── BRAIN.md                     # Root living knowledge base
```

---

## 📊 Live Metrics & Verification Snapshot
- **Active Node Target**: Node.js >= 18.0.0
- **Test Runner**: Jest v29.7.0 (`npm test`)
- **Test Suites**: 16 Passed, 16 Total
- **Total Tests**: 155 Passed, 155 Total
- **Docker Support**: Docker Compose with automatic fallback to local Node.js.

---

## 🌿 Git Branch Matrix
| Branch | Status | Primary Purpose / Feature Scope |
|---|---|---|
| `main` | Production Active | Core production branch, 155/155 tests passing |
| `Beta-V2` | Active Feature | V2 enhancements, corner-case test suites, website builds |
| `git-features-integration` | Feature Branch | Startup logo animation, version display, smart action reruns |
| `ui-polish-and-functionality-improvement` | Feature Branch | Settings themes, exit summaries, documentation updates |
| `bash-command-support-update-language-support` | Docs Branch | 60+ language support documentation |

---

## 🛠️ Update & Maintenance Protocol
1. **Trigger**: After any code, config, or test modification.
2. **Action**: Run `npm test` to verify zero regressions.
3. **Brain Update**: Execute `lorapok-doc-brain-updater` subagent or update `BRAIN.md` with:
   - Updated file tree & module maps.
   - Latest test count and passing status.
   - New APIs, CLI flags, or configuration keys.
   - Updated release notes in `CHANGELOG.md`.

---
*Maintained by Lorapok AI Agent Ecosystem | https://lorapok.tech*
