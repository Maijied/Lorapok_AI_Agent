# Milestone 1 Bug Investigation & Analysis Report

**Subagent**: Explorer (`teamwork_preview_explorer_m1_bugs_2`)  
**Date**: 2026-07-23  
**Target Scope**: 4 Codebase Quality & Security Bugs in Lorapok AI Agent  

---

## Executive Summary

This report documents the in-depth investigation and fix strategies for 4 assigned bugs under Milestone 1 (Codebase Quality & Security Bug Fixes):
1. **`lib/agent-enhanced.js`**: Duplicate `'pl'` key in `langMap` causing Perl files (`.pl`) to be incorrectly detected as Prolog.
2. **`lib/renderer.js`**: Uniqueness audit of `LANG_DISPLAY` keys and alias alignment.
3. **`server.js`**: Missing session cleanup (`clearHistory`) and error handling on `DELETE /api/sessions/:sessionId`.
4. **`services/GitManager.js`**: Token exposure vulnerability where GitHub/Git authentication tokens leak into log outputs via unredacted output strings and narrow regex redaction.

---

## Detailed Findings & Fix Strategies

### 1. `lib/agent-enhanced.js` - Duplicate `'pl'` Key in `langMap`

#### Investigation Findings
- **Location**: `lib/agent-enhanced.js`, lines 200–222 within the `detectLanguage(filePath)` method.
- **Problem Line 211**: `'pl': 'perl', 'perl': 'perl', 'r': 'r',`
- **Problem Line 220**: `'sol': 'solidity', 'pas': 'pascal', 'pl': 'prolog', 'd': 'd',`
- **Root Cause**: In JavaScript object literals, defining a duplicate key (`'pl'`) overwrites any earlier definition. Because line 220 defines `'pl': 'prolog'`, it overwrites line 211's `'pl': 'perl'`.
- **Effect**: Any file with a `.pl` extension (standard Perl extension) is detected as `'prolog'` instead of `'perl'`.

#### Proposed Fix Strategy
1. In `lib/agent-enhanced.js`, retain `'pl': 'perl'` on line 211.
2. On line 220, change `'pl': 'prolog'` to `'pro': 'prolog'` (or `'prolog': 'prolog'`).
3. Add a unit test in `tests/agent-enhanced.test.js`:
   ```javascript
   test('should detect perl and prolog extensions correctly', () => {
       expect(agent.detectLanguage('script.pl')).toBe('perl');
       expect(agent.detectLanguage('logic.pro')).toBe('prolog');
   });
   ```

---

### 2. `lib/renderer.js` - `LANG_DISPLAY` Key Audit & Alias Alignment

#### Investigation Findings
- **Location**: `lib/renderer.js`, lines 19–108 (`LANG_DISPLAY` object).
- **Key Uniqueness Audit**: Examined all 88 keys currently in `LANG_DISPLAY`. All 88 keys (`js`, `javascript`, `jsx`, `ts`, `typescript`, `tsx`, `json`, `bash`, `sh`, `shell`, `yaml`, `yml`, `html`, `css`, `python`, `py`, `sql`, `markdown`, `md`, `dockerfile`, `docker`, `go`, `rust`, `rs`, `php`, `rb`, `ruby`, `java`, `kotlin`, `kt`, `scala`, `perl`, `pl`, `r`, `haskell`, `hs`, `lua`, `asm`, `nasm`, `cmake`, `nix`, `zig`, `groovy`, `clojure`, `clj`, `elixir`, `ex`, `erlang`, `erl`, `ocaml`, `ml`, `elm`, `lisp`, `vue`, `svelte`, `scss`, `sass`, `less`, `xml`, `toml`, `graphql`, `gql`, `proto`, `thrift`, `julia`, `sas`, `solidity`, `sol`, `pascal`, `prolog`, `d`, `crystal`, `cobol`, `c`, `cpp`, `cs`, `csharp`, `dart`, `swift`, `hcl`, `tf`, `fsharp`, `fs`, `powershell`, `ps1`, `makefile`, `diff`, `''`) were verified to be distinct strings in `renderer.js`.
- **Missing Alias**: In `LANG_DISPLAY`, `'pl'` maps to `'Perl'` and `'prolog'` maps to `'Prolog'`. Once `agent-enhanced.js` detects `.pro` files as `'prolog'`, `LANG_DISPLAY` handles `'prolog'`, but adding `'pro': 'Prolog'` to `LANG_DISPLAY` completes the alias coverage for Prolog.

#### Proposed Fix Strategy
1. In `lib/renderer.js`, confirm key uniqueness across `LANG_DISPLAY` and add `'pro': 'Prolog'`.
2. Add a unit test in `tests/renderer.test.js`:
   ```javascript
   test('should render prolog code box label', () => {
       const output = createCodeBox(':- initialization(main).', 'pro');
       expect(output).toContain('PROLOG');
   });
   ```

---

### 3. `server.js` - `DELETE /api/sessions/:sessionId` Missing Session Cleanup

#### Investigation Findings
- **Location**: `server.js`, lines 295–299.
- **Current Implementation**:
  ```javascript
  // Clear session
  app.delete('/api/sessions/:sessionId', (req, res) => {
      const deleted = sessions.delete(req.params.sessionId);
      res.json({ success: true, deleted });
  });
  ```
- **Flaws Identified**:
  1. `sessions` stores session objects formatted as `{ agent, lastAccessed }`. Calling `sessions.delete(sessionId)` directly without retrieving the session first bypasses any internal cleanup on `agent` (e.g. `agent.clearHistory()`).
  2. The endpoint lacks `try ... catch` error handling, risking uncaught exceptions returning unformatted 500 HTML responses instead of standard JSON error objects.

#### Proposed Fix Strategy
1. Update `app.delete('/api/sessions/:sessionId', (req, res) => ...)` in `server.js`:
   ```javascript
   // Clear session
   app.delete('/api/sessions/:sessionId', (req, res) => {
       try {
           const sessionId = req.params.sessionId;
           const session = sessions.get(sessionId);
           if (session) {
               if (session.agent && typeof session.agent.clearHistory === 'function') {
                   session.agent.clearHistory();
               }
               sessions.delete(sessionId);
               return res.json({ success: true, deleted: true });
           }
           res.json({ success: true, deleted: false });
       } catch (error) {
           res.status(500).json({ error: error.message });
       }
   });
   ```
2. Add unit/integration tests in `tests/api.test.js` targeting `DELETE /api/sessions/:sessionId` for both valid existing sessions and non-existing session IDs.

---

### 4. `services/GitManager.js` - Token Exposure Risk in Log Output

#### Investigation Findings
- **Location**: `services/GitManager.js`, lines 33–44 inside `executeGit(command, options)`.
- **Current Logging Code**:
  ```javascript
  if (this.logger && options.verbose !== false) {
      const redactedCmd = command.replace(/(https:\/\/)[^@]+(@github\.com)/gi, '$1***$2');
      this.logger(redactedCmd, output, true);
  }
  ```
- **Vulnerabilities Identified**:
  1. **Unredacted Command Output**: `output` (and error output) passed to `this.logger(...)` is logged unredacted. If a git command fails or produces output containing a repository URL with credentials (e.g., `fatal: repository 'https://ghp_secretToken@github.com/user/repo.git' not found`), the secret token is logged in cleartext.
  2. **Incomplete Regex**: The regex `/(https:\/\/)[^@]+(@github\.com)/gi` only matches `https://...@github.com`. It misses:
     - URLs with username:password format (`https://user:ghp_xxx@github.com`)
     - GitHub Personal Access Tokens in non-URL contexts or generic formats (`ghp_...`, `github_pat_...`)
     - URLs targeting enterprise Git servers or non-GitHub hosts.

#### Proposed Fix Strategy
1. Add a robust `redactTokens(text)` method to `GitManager.js`:
   ```javascript
   redactTokens(text) {
       if (!text || typeof text !== 'string') return text;
       return text
           // Redact credentials in HTTP(S) URLs
           .replace(/(https?:\/\/)([^:@\s]+)(:[^@\s]+)?@/gi, '$1***@')
           // Redact GitHub Personal Access Tokens and classic tokens
           .replace(/\b(gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{36,255})\b/gi, '***')
           // Redact token parameters
           .replace(/([?&](?:token|access_token|api_key)=)[^&\s]+/gi, '$1***');
   }
   ```
2. Update `executeGit` to redact both `command` AND `output`:
   ```javascript
   const redactedCmd = this.redactTokens(command);
   const redactedOutput = this.redactTokens(output);
   if (this.logger && options.verbose !== false) {
       this.logger(redactedCmd, redactedOutput, true); // or false on error
   }
   ```
3. Add tests in `tests/GitManagerExtended.test.js` to verify that `GitManager` log output redacts tokens from both command strings and git stdout/stderr messages.

---

## Proposed Patch Snippets Summary

| File | Line / Location | Proposed Modification |
|---|---|---|
| `lib/agent-enhanced.js` | Line 220 | Change `'pl': 'prolog'` to `'pro': 'prolog'` |
| `lib/renderer.js` | Line 89 | Add `'pro': 'Prolog'` to `LANG_DISPLAY` |
| `server.js` | Lines 295–299 | Add `sessions.get()` check, `agent.clearHistory()`, `sessions.delete()`, and `try/catch` |
| `services/GitManager.js` | Lines 22–51 | Implement `redactTokens(text)` helper and apply to both `command` & `output` in logger calls |
