# 🧪 Automation: Test Sentinel

A zero-regression safety net.

- ⚡ **Trigger:** PR opened/updated, push to feature branch, or local task completion.
- ⚡ **Post-Prompt Trigger:** Run `npm test` automatically after every prompt response that alters codebase logic.
- 🛠️ **Actions:** 
  1. Execute `npm test`.
  2. Fail closed on any test regression.
- 🧰 **Tools:** `shell`, `read_file`.
