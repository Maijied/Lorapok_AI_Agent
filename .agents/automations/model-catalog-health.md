# ⚡ Automation: Model Catalog Health

Ensures that the active API catalog does not contain dead models or exhausted rate-limited keys.

- ⚡ **Trigger:** Weekly schedule OR manual invocation.
- ⚡ **Post-Prompt Trigger:** Agent should consider running `/refresh-models` if a prompt response involves testing models or adding a new API key.
- 🛠️ **Actions:** 
  1. Trigger `/refresh-models` logic via script.
  2. Flag ghost IDs or empty usable sets in logs.
