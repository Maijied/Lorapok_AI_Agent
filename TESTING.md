# 🧪 Lorapok - Beta Verification Guide

Follow these steps to ensure your Lorapok installation is 100% functional.

## 1. Environment Health Check
```bash
npm run setup
```
- **Check**: Does the Docker build complete without errors?
- **Check**: Is the `lorapok` command available globally?

## 2. Interactive UI Verification
Run `lorapok` to enter the primary chat mode.

### A. Slash Command Test
1. Type `/` and press **Enter**.
2. **Check**: Does the "Select Action" dropdown appear?
3. Select `Help Reference`.
4. **Expected**: A professional table of commands should be displayed.

### B. Proactive Implementation Test (CRITICAL)
1. Ask: `Create a file called beta-test.txt with the content 'Lorapok Pro Beta Verified'`
2. **Check**: Does the agent propose a `CREATE` action?
3. **Check**: Do you see a `Code Viewport` diff?
4. Select **Yes**.
5. **Expected**: The file `beta-test.txt` should exist on your host machine.

### C. Code Hiding Test
1. Ask: `Generate a 30-line boilerplate for an Express server`
2. **Expected**: The long code block should be replaced with: `[... 30 lines of code hidden ...]`
3. **Check**: The explanation should still be visible.

### D. Redirection Test
1. From your host terminal, run: `lorapok --help`
2. **Expected**: `🐳 Lorapok: Redirecting to Docker container...` should appear before the help output.

## 3. UI Polish Verification
1. **Startup**: Run `lorapok`. Verify the animated "LORAPOK CLI 🐛" branding.
2. **Identity**: Type `who are you`. Verify the instant "I'm 🐛 Lorapok" response.
3. **Logs**: Type `/logs`. Verify the professional table view.
4. **Navigation**: Type `@`. Verify the hierarchical file/folder navigator.
5. **Exit**: Type `exit`. Verify the "SESSION RECAP" with token usage stats.

## 4. Automated Suite
```bash
npm test
```
- **Goal**: 26/26 Passing.

---
*Clean up your environment after testing:*
```bash
rm beta-test.txt
```
