# Token Optimization Steering Guide

## Rules for AI Agent Token Conservation

1. **Scoped Context Retrieval**:
   - Use `grep_search` and bounded `view_file` calls (`StartLine` / `EndLine`) to inspect specific functions.
   - Do not request full file dumps of files larger than 100 lines unless required for comprehensive refactoring.

2. **Incremental File Mutations**:
   - Prefer `replace_file_content` or `multi_replace_file_content` over `write_to_file` when editing existing code.
   - Limit `TargetContent` to the smallest unique block necessary to anchor the change.

3. **Centralized Knowledge Index**:
   - Refer to `BRAIN.md` for project architecture, test metrics, and file locations.
   - Do not re-explore unchanged directories repeatedly.

4. **Output Truncation & Summarization**:
   - Truncate long terminal logs in responses to highlight only actionable error lines.
   - Keep natural language responses clear, structured, and concise.
