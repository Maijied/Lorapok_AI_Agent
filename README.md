# 🐛 Lorapok - Expert AI Coding Agent (Beta)

Lorapok is a full-featured, action-oriented coding agent powered by the **Perplexity Sonar API**. It goes beyond simple chat by proactively suggesting and implementing code changes across your project with full file and git awareness.

## 🚀 Key Features

- 💬 **Chat-First UI** - Starts directly into an interactive conversation.
- 🛠️ **Slash Commands** - Access commands like `/plan`, `/analyze`, `/logs`, and `/git` via a consistent dropdown menu.
- ⚡ **Proactive Actions** - The agent identifies `CREATE`, `UPDATE`, and `DELETE` actions and applies them with your permission.
- 📝 **Intelligent Diffs** - View concise, line-by-line diffs in a dedicated "Code Viewport" before confirming changes.
- 🐳 **Always-Docker** - Environment consistency guaranteed via automatic Docker redirection.
- 🔗 **Full Project Awareness** - The agent understands your entire project file tree in every interaction.
- 🐛 **Professional Branding** - Sleek Terminal UI with expert tips and detailed diagnostic logs.

---

## 🏗️ Quick Start (One-Step)

### 1. Clone & Setup
```bash
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent
```

### 2. Configure API Key
Get your key from [Perplexity](https://www.perplexity.ai/api-platform) and add to `.env`:
```bash
cp .env.example .env
# Add PERPLEXITY_API_KEY to .env
```

### 3. Install & Run
**Linux/macOS:**
```bash
chmod +x scripts/install.sh && ./scripts/install.sh
lorapok
```

**Windows (PowerShell):**
```bash
.\scripts\install.ps1
lorapok
```

---

## 📘 Usage Overview

### Direct Commands (/)
Type `/` or press Enter on an empty prompt in chat mode to open the command menu:
- `/plan` - Start a structured multi-step technical workflow.
- `/analyze` - Get deep architectural insights into your project.
- `/logs` - View real-time diagnostic logs for debugging.
- `/git` - Manage your repository with AI-generated commit messages.
- `/settings` - Swap models or change default languages.

### Mentions (@)
Use `@` in chat to autocomplete and mention specific files to the agent for context-aware help.

---

## 🌐 Web API & Automation

Lorapok includes a REST API for integration with other tools:
```bash
npm run server
# Access at http://localhost:3847
```

- **Health**: `GET /health`
- **Chat**: `POST /api/chat`
- **Generate**: `POST /api/generate`

---

## 🧪 Testing
Lorapok comes with a comprehensive Jest suite.
```bash
npm test
```

## 📜 License
MIT
