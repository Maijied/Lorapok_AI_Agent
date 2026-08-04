---
name: Antigravity IDE Workflow
description: The master operational workflow for Antigravity IDE agents working on the Lorapok AI Agent repository. Defines testing, documentation sync, and MCP usage.
---

# 🪐 Antigravity IDE Workflow: Lorapok AI Agent

This skill defines the highly-optimized, step-by-step development workflow for using the **Antigravity IDE** to autonomously build, test, and maintain the **Lorapok AI Agent** repository.

## 🎯 Phase 1: Initialization & Context Assembly

When you start a new task in Antigravity IDE, follow these steps before writing code:

1. **Review Governance Sources**: Always read `.agents/rules/`, `BRAIN.md`, and `.agents/INDEXING.md` to ensure your mental model of the Lorapok architecture and rules is perfectly up to date.
2. **Engage MCP Servers**: 
   - If the task involves checking web content like GitHub Actions, invoke the **browsermcp** MCP server.
   - If the task requires deep architectural refactoring, invoke the **Sequential Thinking** MCP server to plan the execution.
   - If the task involves GitHub issues/PRs, invoke the **GitHub** MCP server.

## 💻 Phase 2: Execution & Implementation

Lorapok is an advanced Node.js AI agent. When implementing features:

1. **Adhere strictly to CommonJS**: Use `require` and `module.exports`. Do not use ES Modules.
2. **Use Specialized Services**: Do not reinvent the wheel. 
   - Need to fetch models? Use `ModelManager.js`.
   - Need to route prompts? Use `ModeRouter.js`.
   - Need to handle files? Use `ContextAssembler.js` and `IndexerService.js`.
3. **Chunked Editing**: When using Antigravity's code-editing tools, use precise `replace_file_content` targeting exact line ranges. Avoid dumping entire files.

## 🧪 Phase 3: Verification & Testing

**ZERO REGRESSIONS PERMITTED.** Lorapok has a strict test suite.

1. **Run the Test Suite**: Before finalizing *any* execution, use Antigravity's terminal to run:
   \`\`\`bash
   npm test
   \`\`\`
2. **Corner-Case Validation**: If you added a new feature (e.g., a new CLI slash command), write a corresponding test in the `tests/` directory. Do not leave new code unverified.
3. **Iterate on Failures**: If tests fail, use Antigravity's terminal output to read the stack trace and fix the logic immediately.

## 📝 Phase 4: The Post-Prompt Trigger (Mandatory Documentation Sync)

As explicitly governed by `AGENTS.md` and `.agents/rules/`, Antigravity MUST synchronize documentation before completing a task.

1. **Update `BRAIN.md`**: Update `BRAIN.md` if you added a new service, updated test counts, or changed module mappings.
2. **Update `.agents/AGENTS.md`**: Modify this file whenever the governance rules of the agent change.
3. **Update `Docs/`**: In cases where the architecture significantly shifts, update `Docs/architecture/OVERVIEW.md` or `MODULE_MAP.md`.
4. **Cleanup**: Run `npm cache clean --force` in the terminal to leave the workspace pristine.
