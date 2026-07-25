# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-23

### Added
- Initial production-ready release of the Lorapok AI Coding Agent 🐛
- Interactive terminal REPL powered by Perplexity AI models (`sonar`, `sonar-pro`, `sonar-reasoning`)
- Proactive file actions system (CREATE, UPDATE, DELETE) with interactive code viewport diff previews
- Safe bash command execution with safety confirmations and persistent CWD tracking
- Full Git integration suite (status, diff, smart AI commit message generation, branch management, push/pull, stashing)
- GitHub Actions manager for browsing, inspecting, and triggering workflow runs
- GitHub authentication system supporting Personal Access Tokens, OAuth Device Flow, and GitHub CLI credential sharing
- Express REST API server (`server.js`) on port 3847 with session management and health monitoring
- Docker containerization architecture with automatic host volume mounting
- Enterprise documentation suite (`README.md`, `CONTRIBUTING.md`, `LICENSE`, `CODE_OF_CONDUCT.md`)

### Changed
- Refactored monolithic `index.js` into modular command handlers (`commands/git.js`, `commands/actions.js`, `commands/auth.js`, `commands/settings.js`, `commands/workflow.js`, `commands/utils.js`)
- Standardized service return signature to `{ success, data, error }` across `GitManager`, `FileManager`, `ActionsManager`, and `GithubAuth`
- Enhanced UI renderer with 12 ASCII logo font options, animated startup, and markdown syntax highlighting

### Fixed
- Fixed CWD tracking concatenation bug in `executeCommand()`
- Fixed duplicate `setLogger()` calls in CLI initialization
- Fixed duplicate key definitions in `langMap` and `LANG_DISPLAY`
- Fixed Express server DELETE session cleanup memory leak
- Fixed hardcoded user path assumptions in Docker compose configuration
- Redacted sensitive tokens in `GitManager` log outputs to prevent credential leaks

### Security
- Added input sanitization and command whitelisting to block dangerous shell injection patterns in `executeCommand()`

---
*Built with 🐛 by Lorapok Labs (https://lorapok.tech)*
