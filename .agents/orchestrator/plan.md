# Execution Plan: Lorapok AI Coding Agent Upgrade

## Overview
This plan outlines the systematic upgrade of the Lorapok AI Coding Agent CLI tool from a functional prototype to a market-standard production tool across 5 milestones.

## Milestone Plan

### Milestone 1: Codebase Quality & Security Bug Fixes (M1)
- Objective: Resolve all identified bugs and security risks (R1).
- Key Tasks:
  1. Fix CWD tracking bug in `executeCommand()` (`index.js`).
  2. Remove duplicate `agent.gitManager.setLogger()` in `initialization()` (`index.js`).
  3. Clean up unused imports (`Autocomplete` from enquirer, `readline`).
  4. Fix duplicate `'pl'` in `langMap` (`agent-enhanced.js`) and duplicate keys in `LANG_DISPLAY` (`renderer.js`).
  5. Fix missing session cleanup on DELETE `/api/sessions/:sessionId` in `server.js`.
  6. Fix hardcoded `/home/maizied` paths and hardcoded OAuth Client ID in `docker-compose.yml`.
  7. Implement token redaction in `GitManager.js` logs.
  8. Implement shell injection protection & sanitization in `executeCommand()`.
  9. Add `"use strict"` to all JavaScript files.
  10. Improve error messages and fallback error handling across service entry points.

### Milestone 2: Architecture Hardening & Command Handler Refactoring (M2)
- Objective: Extract monolithic `index.js` (~1570 lines) into modular command handlers and standardize return types/JSDoc (R4).
- Key Tasks:
  1. Create `commands/` directory.
  2. Refactor `index.js` into command handler modules (`commands/git.js`, `commands/chat.js`, `commands/settings.js`, `commands/actions.js`, `commands/system.js`).
  3. Keep `index.js` lightweight (< 500 lines) for CLI initialization and dispatcher loop.
  4. Add complete JSDoc documentation to all public methods in all modules.
  5. Standardize service method return types to `{ success, data, error }`.
  6. Add input validation/sanitization across all user-facing inputs.
  7. Add error boundary classes with structured error types.
  8. Add graceful shutdown handling for Express server (`server.js`).

### Milestone 3: Professional Documentation, Licensing & Branding (M3)
- Objective: Establish Lorapok Labs branding and write enterprise-grade documentation (R3).
- Key Tasks:
  1. Create enterprise `README.md` with banner, feature matrix, installation (npm/npx/Docker), quick start, configuration reference, API docs, contributing link, Lorapok Labs footer.
  2. Create `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE` (MIT Lorapok Labs), and `CODE_OF_CONDUCT.md`.
  3. Add `Built with 🐛 by Lorapok Labs (https://lorapok.com)` credit to CLI banner, `--version` output, README footer, `package.json` metadata, server health endpoint, and copyright header in all major source files.

### Milestone 4: Enterprise CI/CD & npm Packaging Setup (M4)
- Objective: Configure GitHub Actions CI/CD with release-please and npm packaging readiness (R2).
- Key Tasks:
  1. Upgrade `.github/workflows/ci.yml`: matrix build across Node 18/20/22 on Ubuntu/macOS/Windows, lint check, Docker build validation.
  2. Upgrade `.github/workflows/release.yml`: `release-please` integration, automated release PR, CHANGELOG maintenance, Docker image tarball asset, npm publish with `--provenance` via OIDC.
  3. Configure `package.json`: `files` whitelist, `publishConfig`, `engines`, `author`, `homepage`, `repository`, `bugs`, `keywords`, `prepublishOnly`, `lint`.
  4. Ensure `bin/lorapok.js` shebang `#!/usr/bin/env node`, LF line endings, executable chmod permissions.
  5. Add `.npmignore` / verification for tarball contents (`npm pack`).

### Milestone 5: Test Coverage Enhancement (Target >= 70%) & E2E Verification (M5)
- Objective: Expand unit & integration tests, enforce >= 70% coverage, and verify all acceptance criteria (R5).
- Key Tasks:
  1. Add Jest tests for new command handlers (`commands/*.js`).
  2. Add integration tests for CLI flow and slash commands.
  3. Add unit tests for shell safety in `executeCommand()`.
  4. Add test coverage for `GithubAuth.js` authentication flows.
  5. Add Jest coverage threshold config (>= 70%) in `package.json` / `jest.config.js`.
  6. Run full verification: `npm test`, `npm run lint`, `docker build`, `npm pack`, CLI execution tests.
