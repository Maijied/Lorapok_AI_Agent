# Original User Request

## 2026-07-22T20:08:39Z

Upgrade the **Lorapok AI Coding Agent** (by Lorapok Labs) from a functional prototype into a **complete, professional, market-standard AI CLI tool** — comparable to Aider, Claude Code, and Cline. The tool is a terminal-first AI coding assistant built on Perplexity AI with proactive file operations, Git integration, and GitHub Actions management. This upgrade covers: fixing all remaining bugs, refactoring the monolithic `index.js` into modular command handlers, implementing a production CI/CD pipeline with automated npm publishing via `release-please`, adding proper Lorapok Labs branding/credits everywhere, hardening security, and writing comprehensive enterprise-grade documentation.

Working directory: /home/maizied/Desktop/Personal_Projects/lorapok_ai_agent
Integrity mode: development

## Context & Current State

The project is a **Node.js terminal-first AI coding agent** that uses the Perplexity API to provide interactive coding assistance with proactive file operations (CREATE/UPDATE/DELETE), bash command execution, and full Git integration. It currently has:
- ~4,900 lines of source code across 14 files
- 53 passing Jest tests across 11 test files
- Docker-based execution environment
- Basic CI/CD workflows (`.github/workflows/ci.yml` and `release.yml`)
- Feature branches are all merged to `main`

**Organization**: Lorapok Labs (https://lorapok.com) — Founded by Mohammad Maizied Hasan Majumder (@Maijied)
**Mascot**: 🐛 (Bug/Beetle)
**License**: MIT

## Requirements

### R1. Codebase Quality & Bug Fixes
Fix all identified bugs and code quality issues to achieve production stability:
- Fix the CWD tracking bug in `executeCommand()` in `index.js` (the `cd` command parsing concatenates improperly)
- Fix duplicate `agent.gitManager.setLogger()` calls in `initialization()` (lines 143-150 of index.js)
- Fix unused imports (`Autocomplete` from enquirer, `readline` at top of index.js)
- Fix duplicate key `'pl'` in `langMap` in `agent-enhanced.js` (Perl vs Prolog)
- Fix duplicate keys in `LANG_DISPLAY` in `renderer.js`
- Fix `server.js` missing session cleanup on the `/api/sessions/:sessionId` DELETE endpoint (it accesses old Map format)
- Fix hardcoded user paths in `docker-compose.yml` (replace `/home/maizied/.gitconfig` and `/home/maizied/.ssh` with `~/.gitconfig` and `~/.ssh`)
- Fix hardcoded OAuth Client ID in `docker-compose.yml` — move to `.env`
- Fix token exposure risk in `GitManager.js` — redact tokens from log output
- Add shell injection protection to `executeCommand()` — sanitize or whitelist dangerous patterns
- Ensure all error paths have proper error handling and user-friendly messages
- Add `"use strict"` to all source files

### R2. Enterprise-Grade CI/CD Pipeline with npm Publishing
Replace the current basic CI/CD with a professional pipeline:
- **CI Workflow** (`.github/workflows/ci.yml`): Matrix testing across Node 18.x, 20.x, 22.x on Ubuntu, macOS, Windows; lint checking; Docker build validation
- **Release Workflow** (`.github/workflows/release.yml`): Use `release-please` for automated versioning via Conventional Commits; auto-generate CHANGELOG.md; build Docker image tarball; create GitHub Release with assets; **publish to npm with `--provenance`** using OIDC authentication
- **npm Publishing Readiness**: Update `package.json` with proper `files` array (whitelist only production files), `publishConfig`, `engines` (>=18.0.0), proper `author` (Lorapok Labs), `homepage`, `repository`, `bugs` URLs, `keywords`
- Ensure `bin/lorapok.js` has proper shebang, LF line endings, and executable permissions
- Add `.npmignore` or use `files` field to exclude tests, AIs/, docs from the published package
- Add `prepublishOnly` script that runs tests before publishing

### R3. Professional Documentation & Branding
Create market-standard documentation with proper Lorapok Labs branding:
- **README.md**: Professional README with logo/banner, feature highlights with GIFs/screenshots placeholders, installation instructions (npm, npx, Docker), quick start guide, configuration reference, API documentation, contributing guide, and footer credit
- **CHANGELOG.md**: Initialize with current version history
- **CONTRIBUTING.md**: Contribution guidelines with code style, PR process, testing requirements
- **LICENSE**: MIT license file with Lorapok Labs attribution
- **CODE_OF_CONDUCT.md**: Standard code of conduct
- **Branding Credits**: Add `Built with 🐛 by Lorapok Labs (https://lorapok.com)` to:
  - CLI startup banner
  - README footer
  - package.json metadata
  - `--version` output
  - Server health endpoint response
  - All major source file headers (copyright notice)

### R4. Architecture Hardening & Code Organization
Improve the codebase architecture for maintainability:
- Add JSDoc documentation to all public methods in all modules
- Extract the massive `index.js` (1570 lines) into modular command handlers (e.g., `commands/git.js`, `commands/chat.js`, `commands/settings.js`, `commands/actions.js`)
- Add input validation and sanitization across all user-facing inputs
- Implement proper error boundaries with structured error types
- Add graceful shutdown handling for the Express server
- Ensure consistent return types across all service methods (standardize on `{ success, data, error }`)

### R5. Test Coverage Enhancement
Expand test coverage to match enterprise standards:
- Add tests for all new command handler modules
- Add integration tests for the CLI entry point flow
- Add tests for error handling paths and edge cases
- Add tests for the `executeCommand()` function with shell safety
- Ensure test coverage for `GithubAuth.js` authentication flows
- Add a coverage reporter configuration and target minimum 70% coverage
- All tests must pass on the CI matrix (Ubuntu/macOS/Windows × Node 18/20/22)

## Acceptance Criteria

### Build & Test
- [ ] `npm test` passes all tests with 0 failures
- [ ] `npm run lint` (if added) passes with 0 errors
- [ ] `docker build -t lorapok-ai-agent .` succeeds without errors
- [ ] CI workflow runs successfully on all matrix combinations
- [ ] Test coverage meets or exceeds 70%

### npm Publishing
- [ ] `npm pack` produces a clean tarball with only production files (no tests, no AIs/, no .github/)
- [ ] `npx lorapok-coding-agent --version` outputs version with Lorapok Labs credit
- [ ] `npx lorapok-coding-agent --help` shows proper help with all commands documented
- [ ] package.json contains valid `author`, `homepage`, `repository`, `bugs`, `keywords`, `engines`, `files`, and `publishConfig` fields

### CI/CD Pipeline
- [ ] Push to `main` triggers CI with matrix testing
- [ ] Creating a Conventional Commit on `main` triggers `release-please` to open/update a Release PR
- [ ] Merging the Release PR triggers: npm publish with provenance, GitHub Release creation, Docker image tarball upload
- [ ] CHANGELOG.md is automatically maintained by release-please

### Documentation & Branding
- [ ] README.md exists with professional formatting, installation instructions, and Lorapok Labs footer credit
- [ ] CONTRIBUTING.md, LICENSE, CODE_OF_CONDUCT.md all exist
- [ ] Every source file in `lib/`, `services/`, `index.js`, `server.js` has a Lorapok Labs copyright header
- [ ] CLI startup displays `Lorapok Labs` credit
- [ ] `--version` flag output includes `Lorapok Labs`

### Code Quality
- [ ] No file exceeds 500 lines (index.js must be refactored into modules)
- [ ] All public methods have JSDoc comments
- [ ] No unused imports or variables
- [ ] Shell injection vectors are mitigated in `executeCommand()`
- [ ] Express server has graceful shutdown handling
