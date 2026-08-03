# 🧠 Automation: BRAIN Sync

Ensures that the repository's core memory remains perfectly synchronized with code changes.

- ⚡ **Trigger:** Changes detected under `services/Model*.js`, `services/ContextAssembler.js`, `services/IndexerService.js`, `lib/agent*.js`, `server.js`, or `Docs/`.
- ⚡ **Post-Prompt Trigger:** Agent must execute this automatically at the end of a prompt response if any of the above targets were modified.
- 🛠️ **Actions:** 
  1. Update `BRAIN.md` and `.agents/BRAIN.md`.
  2. Sync test counts if they drifted.
  3. Update the Module Map if necessary.
