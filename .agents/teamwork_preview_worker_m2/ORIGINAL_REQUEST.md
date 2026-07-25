## 2026-07-23T02:30:47Z

You are the Implementer Worker subagent for Milestone 2 (Architecture Hardening & Command Handler Refactoring).

Your working directory is: /home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/teamwork_preview_worker_m2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
Read the Explorer handoff report at `/home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/teamwork_preview_explorer_m2/handoff.md` and analysis at `/home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/teamwork_preview_explorer_m2/analysis.md`.

Implement the following:
1. **Command Handlers Extraction (`commands/`)**:
   - Create `commands/chat.js` and `commands/system.js`.
   - Enhance `commands/git.js`, `commands/actions.js`, `commands/settings.js`, `commands/utils.js`.
   - Refactor `index.js` so that `index.js` becomes a lightweight dispatcher/initializer (< 500 lines requirement).
2. **JSDoc Documentation**:
   - Add JSDoc comments (`@param`, `@returns`, `@throws`) to all public methods in all modules across `lib/`, `services/`, `commands/`, `index.js`, `server.js`.
3. **Structured Error Handling**:
   - Create `lib/errors.js` containing standard error boundary classes (`LorapokError`, `APIError`, `ValidationError`, `FileSystemError`, `GitError`).
4. **Service Return Type Standardization**:
   - Standardize return types across service methods in `services/` to `{ success: boolean, data?: any, error?: Error | string }`. Update dependent tests accordingly.
5. **Express Graceful Shutdown**:
   - Update `server.js` with socket tracking to force-close keep-alive sockets on `SIGINT`/`SIGTERM` and perform session history cleanup.

Verification:
- Run `npm test` and verify that all test suites pass.
- Document executed commands and results in `/home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/teamwork_preview_worker_m2/handoff.md` and send a message to the orchestrator.
