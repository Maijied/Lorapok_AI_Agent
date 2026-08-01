# Lorapok AI Agent - Developer & Agent Rules (AGENTS.md)

## Overview
**Lorapok AI Agent** is an expert AI Coding Agent providing an action-oriented CLI (`bin/lorapok.js`, `index.js`) and Express REST API (`server.js`), with Docs, `packages/sdk`, and `apps/website` for multi-client growth.

## Core Architecture & Stack
- **Runtime**: Node.js >= 18.0.0 (Supports native execution and Docker container fallback).
- **Core CLI Engine**: `index.js`, `lib/agent.js`, `lib/agent-enhanced.js`
- **Services**: `services/GitManager.js`, `services/FileManager.js`, `services/ActionsManager.js`, `services/GithubAuth.js`, `services/ModelManager.js`, `services/ModelValidator.js`, `services/ModelCacheService.js`
- **Commands**: `commands/registry.js` (slash source of truth), `actions`, `auth`, `chat`, `git`, `settings`, `system`, `utils`, `workflow`
- **Web API**: `server.js` (Express + CORS; validated `/api/models` views)
- **Clients**: `packages/sdk`, `apps/website`
- **Docs / Agents**: `Docs/`, `.agents/rules|hooks|automations|skills|steer|subagents`
- **Terminal UI**: `lib/ui.js`, `lib/renderer.js` (Chalk, Boxen, Ora, Enquirer, Figlet, Marked)
- **Test Runner**: Jest (`npm test`, 33 test suites, 321 tests)

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
- `LLM-Support/GoogleAiStudio-Support`: Feature branch for v2 enhancements, Google AI Studio integration, expanded corner-case testing, and fallback handling.
- `git-features-integration`: Feature branch for enhanced Git actions and action rerun workflows.
- `ui-polish-and-functionality-improvement`: Branch for UI polish, exit summaries, and theme standardization.
- `LLM-Support/OpenRouter-Support`: Branch for multi-provider API model routing and dynamic UI selection logic.

---

## Token Optimization & Context Conservation
1. **Targeted File Reading**: Always specify line ranges (`StartLine`/`EndLine`) when viewing large files to minimize prompt context overhead.
2. **Concise Edits**: Use `replace_file_content` with minimal target chunks instead of dumping full file contents.
3. **Single Source of Truth**: Use `BRAIN.md` for architecture and component maps instead of executing full workspace dir scans.
4. **Log Scoping**: Filter test log outputs to tracebacks and summary statistics.

---

## Security & Credentials
- NEVER commit `.env` files, API keys, OAuth tokens, or sensitive credentials.
- Always use `process.env.OPENAI_API_KEY`, `process.env.PERPLEXITY_API_KEY`, or `services/GithubAuth.js` token managers.

---

## Universal Agent Workflow (Mandatory Lifecycle)
For **EVERY** task or prompt, you MUST adhere to the following strict sequence:

1. **Initial Assessment (Start of Task)**:
 - **Load Context**: IMMEDIATELY read `.agents/rules/`, steering in `.agents/steer/`, and subagent constraints in `.agents/subagents/` before modifying any code.
 - **Engage Skills**: Identify and read relevant skills from `.agents/skills/` (see `.agents/skills/README.md`).
 - **Architectural Grounding**: Consult `BRAIN.md`, `.agents/BRAIN.md`, and `Docs/architecture/OVERVIEW.md`.
2. **Execution**: Perform the requested changes while strictly adhering to the Architectural & Coding Rules above.
3. **Verification & Synchronization (End of Task)**:
   - **Validate**: Verify that all changes pass the `npm test` suite flawlessly.
   - **Synchronize Docs**: If your code changes introduced new files, modified architectures, or changed test counts, you MUST perfectly update `BRAIN.md`, `.agents/BRAIN.md`, `AGENTS.md`, and `.agents/subagents/` accordingly.
   - **Final Polish**: Run `npm cache clean --force` and ensure the workspace is perfectly up-to-date and completely clean for the next task.

