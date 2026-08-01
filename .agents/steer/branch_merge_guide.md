# Git Branch & Merge Management Guide

## Branch Architecture
| Branch Name | Status / Purpose | Key Features |
|---|---|---|
| `main` | Production Active | Clean build, 270/270 tests passing, Docker integration |
| `LLM-Support/OpenRouter-Support` | Feature | OpenRouter multi-model routing |
| `LLM-Support/GoogleAiStudio-Support` | Active Feature | Multi-provider model validator, free tier filters, token capacity UI |
| `git-features-integration` | Feature Branch | Startup logo animations, action rerun capabilities, UI polish |
| `ui-polish-and-functionality-improvement` | Feature Branch | Settings themes, exit summaries, documentation updates |
| `bash-command-support-update-language-support` | Docs Branch | 60+ language support documentation |

## Merge Guidelines
1. **Pre-merge Verification**: Always execute `npm test` on the source branch before attempting a merge into `main`.
2. **Conflict Resolution**: When merging feature branches, preserve Jest test assertions and avoid breaking API contracts in `server.js` or `bin/lorapok.js`.
3. **Commit Messages**: Follow standard conventional commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
