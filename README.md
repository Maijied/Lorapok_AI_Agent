<div align="center">

<table border="0" width="100%">
  <tr>
    <td align="left" valign="middle">
      <pre>
██╗      ██████╗ ██████╗  █████╗ ██████╗  ██████╗ ██╗  ██╗     █████╗ ██╗
██║     ██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██║ ██╔╝    ██╔══██╗██║
██║     ██║   ██║██████╔╝███████║██████╔╝██║   ██║█████╔╝     ███████║██║
██║     ██║   ██║██╔══██╗██╔══██║██╔═══╝ ██║   ██║██╔═██╗     ██╔══██║██║
███████╗╚██████╔╝██║  ██║██║  ██║██║     ╚██████╔╝██║  ██╗    ██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝
      </pre>
      <div align="left">
        <code><b>[ SYSTEM ONLINE ]</b></code> — <b>Lorapok Labs</b> · 🌐 <a href="https://ai.lorapok.tech" target="_blank"><b>https://ai.lorapok.tech</b></a>
        <br />
        <sub><b>Lorapok AI Coding Agent</b> · Autonomous Terminal Engine & REST API · <b>v1.4.0</b></sub>
      </div>
    </td>
    <td align="right" valign="middle" width="180">
      <a href="https://ai.lorapok.tech" target="_blank">
        <img src="assets/lorapok-larva-logo.svg" alt="Lorapok AI Cybernetic Larva Logo" width="150" />
      </a>
    </td>
  </tr>
</table>

</div>

---

<div align="center">

# Lorapok AI Coding Agent

### ◆ Lorapok · Open Source Intelligence

*The world's most versatile terminal-first autonomous AI coding agent — 25+ curated LLMs, live terminal execution, automated test suite verification, and git orchestration.*

<br />

[![Live Web Application](https://img.shields.io/badge/LIVE_URL-ai.lorapok.tech-0D9488?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ai.lorapok.tech)
[![Release](https://img.shields.io/badge/RELEASE-v1.4.0-7C3AED?style=for-the-badge&logo=git&logoColor=white)](https://ai.lorapok.tech)
[![npm version](https://img.shields.io/badge/NPM-v1.4.0-0284C7?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/lorapok-ai)
[![Unit Tests](https://img.shields.io/badge/TESTS-321%2B_PASSING-16A34A?style=for-the-badge&logo=jest&logoColor=white)](https://github.com/Maijied/Lorapok_AI_Agent)
[![License](https://img.shields.io/badge/LICENSE-MIT-D97706?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/NODE.JS-%3E%3D18.0.0-15803D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

<br />

<p align="center">
  <a href="https://ai.lorapok.tech" target="_blank"><b>🌐 Open Live App (ai.lorapok.tech)</b></a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/Maijied/Lorapok_AI_Agent/issues" target="_blank"><b>🐛 Report Bug</b></a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/Maijied/Lorapok_AI_Agent/issues" target="_blank"><b>✨ Request Feature</b></a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/Maijied/Lorapok_AI_Agent" target="_blank"><b>🤝 Contribute</b></a>
</p>

</div>

---

## ⚡ What is Lorapok AI Agent?

**Lorapok AI Agent** is an autonomous, action-oriented CLI (`bin/lorapok.js`) and REST API (`server.js`) engine built for terminal engineering and multi-client apps. It plans, scaffolds code, executes test suites, inspects Git diffs, and orchestrates multi-provider AI models across **Google Gemini 2.x (AI Studio)**, **OpenRouter**, and **Perplexity AI**. Architecture docs live in [`Docs/`](Docs/); shared HTTP client in [`packages/sdk`](packages/sdk); site in [`apps/website`](apps/website).

## 🌟 Feature Matrix

| Feature | Description | Status |
| :--- | :--- | :---: |
| 🧠 **Multi-Provider Model Engine** | Google AI Studio (Gemini 2.x), Perplexity AI, and OpenRouter with API-dynamic catalogs | `Ready` |
| 🛡️ **Sanitized Model Views** | Single service-layer usable vs paid separation; non-chat & failed models excluded | `Ready` |
| 📊 **Token Capacity & Limit UI** | Real-time turn usage & available model context capacity tracking | `Ready` |
| 🆓 **Usable vs Paid Catalog** | Currently Usable = free/no-payment + live probe; Provider browse = all keyed models; Paid Catalog for credits | `Ready` |
| ⚡ **Token-Saving Response Cache** | Persistent SHA-256 LLM response cache (`/cache`) reducing token consumption & latency | `Ready` |
| 💻 **Collapsible Bash Process Box** | Framed bash execution box with duration badges, exit status, and collapsible output | `Ready` |
| 🤖 **Interactive AI REPL** | Terminal-first interactive chat with context-aware workspace file injection | `Ready` |
| 📝 **Proactive File Actions** | Proposes CREATE / UPDATE / DELETE file operations with interactive diff previews | `Ready` |
| 🔗 **Full Git Suite** | Smart AI commits, branching, stashing, pushing, pulling, log viewing | `Ready` |
| ⚡ **GitHub Actions Manager** | Monitor workflow runs, inspect jobs, and rerun failed pipelines | `Ready` |
| 🔐 **GitHub Auth System** | Support for Personal Access Tokens, OAuth Device Flow, and GH CLI integration | `Ready` |
| 🎨 **Terminal UI & Themes** | 12+ ASCII font themes, animated startup, markdown syntax highlighting | `Ready` |
| 📋 **Plan & Execute Workflow** | `/plan` multi-step workflow: Plan → Checklist → Execution → Summary | `Ready` |
| 🐳 **Docker-First Environment** | Isolated Docker container execution with host volume mounting | `Ready` |
| 🌐 **REST API Server** | Express web server providing REST endpoints (default port 3847) | `Ready` |
| 🔐 **Encrypted Secrets Vault** | AES-256-GCM vault for API keys under `~/.lorapok/secrets.enc` | `Ready` |
| 🧪 **Live Model Sanitize Pipeline** | Discover → classify → probe (`max_tokens ≥ 16`) → usable/paid/selectable views | `Ready` |


---

## 🏗️ System Architecture

Lorapok is a **Node.js ≥ 18** CommonJS monorepo-ready agent: a terminal CLI, an Express REST API, and shared model/git/file services. Deep docs live under [`Docs/`](Docs/); agent memory in [`BRAIN.md`](BRAIN.md).

### High-level runtime

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         Lorapok AI Coding Agent                          │
├───────────────┬──────────────────────────┬───────────────────────────────┤
│  CLI Entry    │  Interactive REPL        │  Express REST (server.js)     │
│  bin/lorapok  │  index.js + commands/*   │  /api/chat /api/models …      │
│  --local|docker                          │  CORS + Multer + sessions     │
└───────┬───────┴────────────┬─────────────┴──────────────┬────────────────┘
        │                    │                            │
        ▼                    ▼                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Core Agent Layer (lib/)                          │
│  agent.js / agent-enhanced.js · config.js · ui.js · theme.js · cache     │
│  menu-format.js · larva-art.js · renderer.js · errors.js · logger.js     │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐
│ Model Stack       │  │ Workspace / Git       │  │ Auth & Secrets       │
│ ModelManager      │  │ FileManager           │  │ SecretsVault         │
│ ModelValidator    │  │ GitManager            │  │ GithubAuth           │
│ ModelAccessService│  │ ActionsManager        │  │ SessionStore         │
│ ModelSanitizeSvc  │  │ WorkspaceService      │  │                      │
│ ActiveModelService│  │ GeekLinesService      │  │                      │
│ ModelCacheService │  │                       │  │                      │
└─────────┬─────────┘  └───────────────────────┘  └──────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Providers (OpenAI-compatible chat where possible)                        │
│  • Google AI Studio — generativelanguage…/openai/chat/completions        │
│  • OpenRouter     — openrouter.ai/api/v1/chat/completions (+ /models)    │
│  • Perplexity     — api.perplexity.ai/chat/completions (Sonar seed set)  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Model sanitize & selection (why menus differ)

```text
 Discover          Normalize/Classify       Probe (live)           Views
───────────       ───────────────────     ──────────────        ──────────
Google /models    modality + tier         mini-chat             Currently Usable
OpenRouter /models paymentRequired?       max_tokens ≥ 16       Category (usable∩domain)
Perplexity seed   free vs paid            accessible|locked     Provider (all keyed)
  (4 Sonar IDs)   key → available         rate_limited|error    Paid Catalog
```

| Menu option | What you see | Rule |
| :--- | :--- | :--- |
| 🟢 **Currently Usable** | Free-tier models your keys can call | `available` + not payment-required + probe `accessible`/`rate_limited` |
| 📁 **Browse by category** | Usable models in a domain (coding, research, …) | Same as Usable ∩ category tag |
| 🏢 **Browse by provider** | **All** models for a keyed provider (free + paid) | `available === true` for that provider (Perplexity = 4 Sonar models) |
| 🌐 **View all → Usable** | Same as Currently Usable | Shared `getUsableModelIds` |
| 🌐 **View all → Paid** | Credits / Pro reference catalog | `paymentRequired` / pro tier; select still live-probes |

**Important:** Perplexity has **no public model-list API**. The Sonar catalog is a fixed official seed (`sonar`, `sonar-pro`, `sonar-reasoning-pro`, `sonar-deep-research`). Large multi-model lists come from **OpenRouter** and **Google AI Studio**.

After saving a key, Lorapok **live-tests** the provider (`ModelAccessService.verifyProviderKey`), clears stale probe caches, and Model Selection force-refreshes via `ModelSanitizeService`.

### Module map

| Path | Role |
| :--- | :--- |
| `bin/lorapok.js`, `index.js` | CLI bootstrap (native or Docker) |
| `commands/` | Slash handlers; `registry.js` is the single source for `/` palette, system menu, `/help` |
| `lib/agent.js` | Provider routing, chat, fallback rank, `checkAvailableModels` → sanitize |
| `lib/ui.js` / `theme.js` / `larva-art.js` | Branding, themes, classic/cyber logos |
| `lib/menu-format.js` | Aligned emoji menu columns |
| `services/Model*.js` | Catalog, validate, probe, sanitize, cache, active model |
| `services/GitManager.js` / `ActionsManager.js` | Git + GitHub Actions |
| `services/SecretsVault.js` | Encrypted API key storage |
| `server.js` | REST API (default `:3847`) |
| `packages/sdk/` | HTTP client stub for apps |
| `apps/website/` | Marketing / docs site |
| `Docs/` | Architecture, CLI, REST, providers |
| `.agents/` | Skills, steer, subagents, hooks |
| `tests/` | Jest (321+ tests) |

### Data & config on disk

```text
~/.lorapok/
  config.json          # prefs (theme, model id, …) — never raw keys in plaintext when vault is used
  secrets.enc          # AES-256-GCM vault (API keys)
  model_access_cache.json
  models_cache.json
  sessions/            # chat recaps
  logs/
```

Environment overrides still work: `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `PERPLEXITY_API_KEY`, `GH_TOKEN`, `LORAPOK_MODEL`.

### Request path (chat turn)

1. User message (optional `@file` context) → agent builds messages  
2. `callPerplexityAPI` resolves provider from model id → Bearer chat completion  
3. On 429/404/modality failure → scored `buildFallbackRank` retries  
4. Actions (CREATE/UPDATE/bash/git) confirmed via Enquirer when TTY  
5. Turn metrics + optional response cache (`/cache`)

More detail: [`Docs/providers/ARCHITECTURE.md`](Docs/providers/ARCHITECTURE.md), [`Docs/architecture/MODULE_MAP.md`](Docs/architecture/MODULE_MAP.md), [`BRAIN.md`](BRAIN.md).

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

1. **Set your Provider API Key (Google AI Studio, OpenRouter, or Perplexity):**
   ```bash
   # Option A: Google AI Studio API Key (Gemini 2.5 Flash / 2.0 Flash, etc.) [Free API tier available]
   # Get key at: https://aistudio.google.com/app/apikey
   export GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx

   # Option B: OpenRouter API Key (Claude 3.7 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3 70B)
   # Get key at: https://openrouter.ai/keys
   export OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx

   # Option C: Perplexity AI API Key (Sonar API: sonar, sonar-pro, sonar-reasoning-pro, sonar-deep-research)
   # Get key at: https://www.perplexity.ai/settings/api
   export PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx
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
| `GEMINI_API_KEY` | Google AI Studio (Gemini) API Key | — | **Yes (if using Google)** |
| `OPENROUTER_API_KEY` | OpenRouter API Key for multi-model access | — | **Yes (if using OpenRouter)** |
| `PERPLEXITY_API_KEY` | Perplexity AI API Key for search grounding | — | **Yes (if using Perplexity)** |
| `PORT` | Express REST API server port | `3847` | No |
| `NODE_ENV` | Environment mode (`development` / `production`) | `production` | No |
| `GH_TOKEN` | GitHub Access Token for Git & Actions integration | — | No |
| `LORAPOK_DOCKER` | Set to `true` when running inside Docker container | `false` | No |
| `PROJECT_ROOT` | Workspace path inside container environment | `/project` | No |

---

## 💻 CLI Command Reference

| Command | Shortcut / Alias | Description |
| :--- | :--- | :--- |
| `/` | (palette) | Open slash command autocomplete |
| `/chat` | — | Interactive AI coding chat |
| `/plan` | — | Plan → execute multi-step objective |
| `/analyze` | — | Deep project structure analysis |
| `/model` | `/models` | Usable/paid model picker, `list`, `info`, `set` |
| `/refresh-models` | — | Re-fetch & re-validate model catalog |
| `/settings` | — | Theme, model, language, API keys |
| `/cache` | — | Response cache stats / clear / toggle |
| `/config` | — | Inspect or set config keys |
| `/bypass` | `/yolo` | Toggle auto-approve |
| `/git` | — | Git operations menu |
| `/actions` | `/ci` | GitHub Actions workflows |
| `/files` | — | Project file tree |
| `/guide` | `/howtouse` | User manual |
| `/help` | `/?` | Command reference (from registry) |
| `/exit` | `/quit`, `/q` | Exit session |
| `@` | file picker | Mention workspace files in chat |


---

## 🌐 REST API Endpoints

The Express server (`npm run server`, default port 3847) exposes the following endpoints:

| Endpoint | Method | Description | Request Body Example |
| :--- | :---: | :--- | :--- |
| `/health` | `GET` | Server health and Lorapok Labs branding status | N/A |
| `/api/models` | `GET` | Validated models (`?view=usable\|paid\|all`) | N/A |
| `/api/models/refresh` | `POST` | Refresh model catalog | `{ "sessionId": "default" }` |
| `/api/chat` | `POST` | Send prompt (model ID guarded) | `{ "message": "Explain index.js", "sessionId": "default" }` |
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

## 📄 License & Product Tiers

Lorapok AI is a proprietary product of Lorapok Labs. **The codebase is closed-source and proprietary.**

### Service Tiers
- 🆓 **Free Tier**: Standard AI chat, file editing, git workflow execution, and interactive CLI features.
- ⚡ **Premium Tier**: Access to high-throughput reasoning models, advanced context caching, priority execution queues, and enterprise repo automation tools.

For licensing details and commercial inquiries, see the [LICENSE](LICENSE) file or visit [https://lorapok.tech](https://lorapok.tech).

---

<div align="center">

**Built with 🐛 by [Lorapok Labs](https://lorapok.tech)**

*Lorapok — Your expert AI coding companion in the terminal.*

Copyright (c) 2026 Lorapok Labs. All rights reserved.

</div>

