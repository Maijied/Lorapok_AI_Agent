# Lorapok AI Agent - Developer & Agent Rules (AGENTS.md)

## Overview
**Lorapok AI Agent** is an expert AI Coding Agent providing an action-oriented CLI (`bin/lorapok.js`, `index.js`) and Express REST API (`server.js`).

## Core Architecture & Stack
- **Runtime**: Node.js >= 18.0.0 (Supports native execution and Docker container fallback).
- **Core CLI Engine**: `index.js`, `lib/agent.js`, `lib/agent-enhanced.js`
- **Services**: `services/GitManager.js`, `services/FileManager.js`, `services/ActionsManager.js`, `services/GithubAuth.js`
- **Commands**: `commands/actions.js`, `commands/auth.js`, `commands/chat.js`, `commands/git.js`, `commands/settings.js`, `commands/system.js`, `commands/utils.js`, `commands/workflow.js`
- **Web API**: `server.js` (Express + CORS + Multer)
- **Terminal UI**: `lib/ui.js`, `lib/renderer.js` (Chalk, Boxen, Ora, Enquirer, Figlet, Marked)
- **Test Runner**: Jest (`npm test`, 16 test suites, 155+ tests)

---

## Coding & Architectural Rules

1. **Module Syntax**: Use Node.js CommonJS (`require` / `module.exports`).
2. **Error Handling**: Use custom errors from `lib/errors.js` (`LorapokError`, `GitError`, `ConfigError`, `AuthError`). Never swallow exceptions silently.
3. **Logging**: Use `lib/logger.js` (Winston instance) for structured logging. Avoid raw `console.log` in production service classes unless intended for interactive terminal UI rendering.
4. **Terminal UI & Non-Interactive Safety**: Always check interactive environment capabilities before initiating `enquirer` prompts or `ora` spinners to prevent CI/Docker hang errors.
5. **Git Operations**: Delegate git calls to `services/GitManager.js`. Always sanitize repo paths and handle corner cases (detached HEAD, uncommitted changes, missing remotes).
6. **Testing Requirement**: Every code modification MUST be accompanied by unit or corner-case test verifications under `tests/`. Run `npm test` before committing.

---

## Git Branch Management Strategy
- `main`: Primary stable release branch. All PRs must pass `npm test`.
- `Beta-V2`: Feature branch for v2 enhancements, expanded corner-case testing, and futuristic web features.
- `git-features-integration`: Feature branch for enhanced Git actions and action rerun workflows.
- `ui-polish-and-functionality-improvement`: Branch for UI polish, exit summaries, and theme standardization.

---

## Security & Credentials
- NEVER commit `.env` files, API keys, OAuth tokens, or sensitive credentials.
- Always use `process.env.OPENAI_API_KEY`, `process.env.PERPLEXITY_API_KEY`, or `services/GithubAuth.js` token managers.
