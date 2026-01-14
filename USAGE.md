# 🐛 Lorapok - Detailed Usage Guide

Welcome to the Lorapok expert coding experience. This guide covers how to maximize the agent's potential.

---

## 💬 The Chat-First Workflow

Lorapok starts directly in **Chat Mode**. This is your command center.

- **Objective-Oriented**: Tell the agent what you want to build. "Add a login page with social auth" or "Refactor index.js to use async/await".
- **Action Prompts**: When the agent suggests code changes, you'll see a **"Apply Action?"** prompt. 
- **Diff Verification**: Lorapok shows a "Code Viewport" highlighting exact lines added (`+`) or removed (`-`). Confirm with **Yes** to write to disk.

### ⌨️ Key Interactions
- `/` or **Enter**: Open the Slash Command dropdown.
- `@`: Mention a file for specific context.
- **Esc**: Exit current mode or command.
- **Ctrl+C twice**: Exit the application.

---

## 🛠️ Slash Commands (/)

### 📋 `/plan` (The Pro Workflow)
The most powerful mode for complex features.
1. **Planning**: AI provides a technical strategy and risks.
2. **Tasks**: AI breaks the plan into a granular checklist.
3. **Implementation**: AI generates code actions (CREATE/UPDATE).
4. **Walkthrough**: AI summarizes the changes and how to verify them.

### 🔍 `/analyze`
Analyzes your project structure and top code files. Use this when entering a new project to identify architectural flaws or security concerns.

### 🔗 `/git` (Smart Version Control)
- **Smart Commit**: Uses `git diff` to generate meaningful commit messages (follows Conventional Commits).
- **Branch Management**: Create, switch, and view branches directly from the CLI.

### 📊 `/logs`
Forgot why a command failed? View the last 20 lines of diagnostic logs (`combined.log`) instantly without leaving the terminal.

---

## 🐳 Always-Docker Architecture

Lorapok ensures that what works on the agent's machine works on yours.

- **Auto-Redirection**: Commands run from your host are automatically redirected to `docker compose exec`.
- **State Persistence**: Your history, settings, and logs are mapped between the host and container.
- **Environment**: Your local code directory is mounted as a volume, so changes made by the AI are reflected on your host immediately.

---

## ⚙️ Advanced Configuration

Access via `/settings`:
- **Model Switching**: Toggle between `sonar` (speed), `sonar-pro` (accuracy), or `sonar-reasoning` (complex logic).
- **Language Defaults**: Set your primary project language for better code generation snippets.
- **Model Probing**: Lorapok automatically probes your API key to check which models you have access to.

---

## 🧪 Verification & Stability

Run the test suite to ensure your environment is configured correctly:
```bash
npm test
```
*Current tests: 26 (File Ops, Git Ops, Config, API, Agent Logic)*

---
*Lorapok Beta - Built for speed, precision, and developer happiness.*
