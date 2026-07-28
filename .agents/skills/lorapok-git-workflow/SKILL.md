---
name: lorapok-git-workflow
description: Skill for managing git integration features, branch management, merge conflict resolution, pull request workflow, and git automation actions in Lorapok.
---

# Lorapok Git Workflow Skill

## Overview
Lorapok AI Agent integrates deeply with Git repositories via `services/GitManager.js` and `commands/git.js`.

## Key Capabilities
- **Status & Diff Inspection**: Parsing uncommitted changes, staged files, and branch diffs.
- **Smart Commit Generation**: AI-generated commit messages based on diff analysis.
- **Branch Management**: Listing, switching, creating, and merging local and remote git branches.
- **Action Reruns & Stashes**: Handling stashed changes, cherry-picks, and conflict resolution cleanly.

## Usage Guidelines
- Always verify repository root using `GitManager.getRoot()`.
- Handle non-git directory errors gracefully (`GitError`).
