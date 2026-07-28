---
name: lorapok-token-efficiency
description: Skill for optimizing token usage and context retrieval when AI agents work on the Lorapok AI Agent codebase.
---

# Lorapok Token Efficiency Skill

## Overview
This skill guides AI agents operating on `lorapok_ai_agent` to minimize context overhead, reduce unnecessary tool calls, and save LLM prompt/completion tokens.

## Token Optimization Strategies

### 1. Targeted File Views (Line Ranges)
- Never load entire files when modifying a specific function or class.
- Always pass `StartLine` and `EndLine` parameters to `view_file`.
- Example: View lines 100 to 150 instead of an 800-line file view.

### 2. Precise Code Edits
- Use `replace_file_content` with concise `TargetContent` blocks.
- Avoid rewriting entire files or large contiguous blocks unless strictly necessary.

### 3. Consult `BRAIN.md` First
- Check `BRAIN.md` or `.agents/BRAIN.md` for architecture details, test counts, and module maps.
- Avoid running repetitive `list_dir` or full-repository scans.

### 4. Search via `grep_search`
- Use `grep_search` with exact `Includes` patterns (e.g. `*.js`) to pinpoint function signatures or variable names.
- Read only the matching line numbers returned by grep.

### 5. Log & Traceback Scoping
- When inspecting test failures or runtime logs, extract only the failing stack trace lines.
- Do not dump thousands of lines of successful test outputs into context.
