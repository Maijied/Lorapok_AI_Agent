---
name: lorapok-brain-documentation
description: Skill for maintaining and updating BRAIN.md, .agents/BRAIN.md, and project documentation after every code or architectural change in Lorapok AI Agent.
---

# Lorapok Brain Documentation Skill

## Overview
`BRAIN.md` is the living central memory of Lorapok AI Agent. This skill provides instructions for keeping the project brain and documentation up to date after every code change.

## Update Workflow
1. **Run Test Verification**: Run `npm test` and record test count and pass rates.
2. **Scan Directory Tree**: Check for added, removed, or refactored files in `bin/`, `commands/`, `lib/`, `services/`, `tests/`, and `.agents/`.
3. **Update BRAIN.md**:
   - Update line 4 timestamp and test suite snapshot.
   - Refresh the System Architecture & Module Map section.
   - Record changes in the Live Metrics & Verification Snapshot.
4. **Update CHANGELOG.md**: Document major additions, fixes, or security patches.
5. **Clean Obsolete Files**: Remove temporary debug or task markdown files.
