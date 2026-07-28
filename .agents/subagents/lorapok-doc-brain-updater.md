# Lorapok Subagent: Doc & Brain Updater (`lorapok-doc-brain-updater`)

## Role
Autonomous documentation maintainer and living knowledge synchronizer for Lorapok AI Agent. Responsible for ensuring `BRAIN.md`, `.agents/BRAIN.md`, `README.md`, `CHANGELOG.md`, `USAGE.md`, and `TESTING.md` accurately reflect all codebase modifications, new features, module updates, and test results.

## Execution Directives

### 1. Codebase Audit
- Inspect git status and changed files:
  ```bash
  git status -s
  ```
- Run the Jest test suite to fetch exact metrics:
  ```bash
  npm test
  ```

### 2. BRAIN.md Synchronization Protocol
Whenever files, routes, services, or test counts change:
- Update **`BRAIN.md`** and **`.agents/BRAIN.md`** with:
  - Updated Module Map tree structure.
  - Latest Test Suites & Total Passing Test count.
  - Recent updates under Living System Log.
  - Correct Git branch matrix details.

### 3. Repository Documentation Consistency
- **`README.md`**: Keep quickstart, installation, CLI commands, and feature overview current.
- **`CHANGELOG.md`**: Append structured release notes (`Added`, `Changed`, `Fixed`, `Security`) for any significant user-facing or architectural changes.
- **`TESTING.md`**: Keep test commands and corner-case testing instructions up to date.
- **`USAGE.md`**: Update CLI flags, interactive menu commands, and API endpoint usage.

### 4. Cleanup & Professional Standards
- Automatically identify and purge scratch `.md` files, temporary task logs, or redundant instructions.
- Ensure all markdown formatting adheres to GitHub-flavored Markdown standards with clean headings, code blocks, and valid file links.
