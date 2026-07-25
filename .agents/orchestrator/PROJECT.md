# Project: Lorapok AI Coding Agent Upgrade

## Architecture
The Lorapok AI Coding Agent is a Node.js terminal-first AI assistant built on top of the Perplexity AI API.
Components:
- `index.js` / CLI Entrypoint (`bin/lorapok.js`): Terminal user interface, REPL loop, command parsing, slash commands, file operations, bash execution.
- `server.js`: Express web server for web UI / REST endpoints and session management.
- `lib/` & `services/`: Core logic modules (GitManager, GithubAuth, Perplexity client, agent engine, renderer, etc.).
- `commands/`: Refactored command handler modules (git, chat, settings, actions, system).
- `.github/workflows/`: CI and Release pipelines.

## Code Layout
- `bin/lorapok.js`: Executable entrypoint
- `index.js`: Main CLI initializer and REPL routing logic (max 500 lines)
- `server.js`: Express REST API server with session handling and graceful shutdown
- `commands/`: Command handlers extracted from index.js
  - `commands/git.js`: Git operations and status slash commands
  - `commands/chat.js`: Chat, prompt sending, LLM interaction commands
  - `commands/settings.js`: Configuration, model selection, key management
  - `commands/actions.js`: File system operations (create/update/delete) and shell command execution
- `lib/`: Standard utility classes, renderer, git manager, auth manager, error boundary definitions
- `services/`: Service implementations with standardized return types `{ success, data, error }`
- `tests/`: Jest test files for lib, commands, integration, error paths

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Codebase Quality & Security Bug Fixes | R1: Fix CWD tracking, duplicate setLogger, unused imports, langMap duplicate 'pl', LANG_DISPLAY duplicate keys, server.js DELETE session cleanup, docker-compose paths & dotenv, GitManager token redaction, shell injection protection, "use strict", error handling | None | DONE |
| 2 | M2: Architecture Hardening & Command Handler Refactoring | R4: Extract index.js into commands/, JSDoc comments on public methods, input sanitization, error boundaries, Express graceful shutdown, standardize `{ success, data, error }` return types | M1 | DONE |
| 3 | M3: Professional Documentation, Licensing & Branding | R3: README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE, CODE_OF_CONDUCT.md, branding credits everywhere | M1 | DONE |
| 4 | M4: Enterprise CI/CD & npm Packaging Setup | R2: Matrix CI workflow, release-please workflow, package.json fields, shebang & permissions on bin/lorapok.js, .npmignore/files whitelist, prepublishOnly script | M2, M3 | IN_PROGRESS |
| 5 | M5: Test Coverage Enhancement (Target >= 70%) & E2E Verification | R5: Unit tests for command handlers, CLI flow integration tests, error handling tests, shell safety tests, GithubAuth test coverage, Jest coverage setup, verification of all acceptance criteria | M1-M4 | IN_PROGRESS |

## Interface Contracts
### Services & Command Handlers
- Every service method must return `{ success: boolean, data?: any, error?: Error | string }`.
- Command handlers take standard context `(agent, args, options)` and return `{ success: boolean, message?: string, data?: any }`.
