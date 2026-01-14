# 🐛 Lorapok Coding Agent - Usage Guide

Complete guide for using the AI-powered coding assistant.

---

## Quick Start

### 1. Configure API Key

```bash
# Interactive setup
node index.js setup

# Or edit .env directly
PERPLEXITY_API_KEY=pplx_your_key_here
```

### 2. Launch

```bash
node index.js
```

---

## CLI Modes

### 💬 Chat Mode

Interactive conversation with AI:

```bash
node index.js           # Menu → Option 1
node index.js chat      # Direct chat
```

**Example:**
```
You: How do I create a REST API in Node.js?
🐛 Lorapok: [Provides detailed code and explanation]
```

### ✨ Generate Code

Create code from descriptions:

```bash
node index.js generate "user authentication with JWT"
node index.js generate "REST API for todo app" -l typescript
```

**Interactive:**
```
What code do you need? User login form with validation
Language [javascript]: react
Framework (optional): tailwind
```

### 🔍 Analyze Code

Get code review and suggestions:

```bash
node index.js analyze "const x = 5;"
```

**Interactive:** Menu → Option 3, then paste your code

**Provides:**
- Code quality assessment
- Performance insights
- Security concerns
- Best practices
- Refactoring suggestions

### 🐛 Debug Code

Fix errors with AI assistance:

**Interactive:** Menu → Option 4
1. Paste your code
2. Paste the error message
3. Get solution with fixed code

---

## 📁 File Management

Access via Menu → Option 5

| Option | Function |
|--------|----------|
| 1 | List project files |
| 2 | Show file tree |
| 3 | Read file content |
| 4 | Edit file with AI |
| 5 | Generate new file with AI |
| 6 | Analyze file with AI |
| 7 | Search files |

### AI File Generation

```
New file path: src/utils/validator.js
What should this file do? Email and password validation functions
→ AI creates complete file with documentation
```

### AI File Editing

```
File path: src/api.js
Describe changes: Add rate limiting and error handling
→ AI updates the file automatically
```

---

## 🔗 Git Management

Access via Menu → Option 6

| Option | Function |
|--------|----------|
| 1 | Git status |
| 2 | Commit changes |
| 3 | Smart commit (AI message) |
| 4 | Push to remote |
| 5 | Pull from remote |
| 6 | Create branch |
| 7 | Switch branch |
| 8 | View branches |
| 9 | View commit log |

### Smart Commit

AI generates commit messages based on your changes:

```bash
# After making changes
Menu → 6 → 3
→ AI analyzes diff and creates: "feat(api): Add user authentication endpoint"
```

---

## 🌐 Web API

Start the API server:

```bash
node server.js
# Server runs on http://localhost:3847
```

### Endpoints

```bash
# Health check
curl http://localhost:3847/health

# Chat
curl -X POST http://localhost:3847/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How to use async/await?"}'

# Generate code
curl -X POST http://localhost:3847/api/generate \
  -H "Content-Type: application/json" \
  -d '{"requirements": "login form", "language": "javascript"}'

# Analyze code
curl -X POST http://localhost:3847/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "function add(a,b){return a+b}", "language": "javascript"}'

# List files
curl http://localhost:3847/api/files

# Git status
curl http://localhost:3847/api/git/status
```

---

## 🐳 Docker Usage

```bash
# Start container
docker-compose up -d

# View logs
docker logs -f lorapok-ai-agent

# Stop
docker-compose down

# Rebuild after changes
docker-compose build && docker-compose up -d
```

---

## ⚙️ Configuration

### Change AI Model

Menu → Option 7

**Available Models:**
- 🚀 Sonar Small (free)
- ⚡ Sonar (free)  
- 🎯 Sonar Pro (free)
- ✨ Claude 3.5 Sonnet (pro)
- 🤖 GPT-4o (pro)
- 🧠 Gemini 3 Pro (pro)

### Change Default Language

Menu → Option 8

Supported: JavaScript, TypeScript, Python, Java, Go, Rust, PHP, Ruby, C++, C#

### View Settings

Menu → Option 9

---

## 💡 Tips

1. **Be specific** - Detailed prompts get better results
2. **Iterate** - Use chat mode for follow-up questions
3. **Review AI code** - Always check generated code before using
4. **Use smart commits** - AI creates meaningful commit messages
5. **Analyze before refactoring** - Get suggestions first

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0` | Exit / Back |
| `exit` | Exit chat mode |
| `Ctrl+C` | Force quit |

---

## Troubleshooting

**"API key required"**
- Run `node index.js setup` to configure

**"Invalid API key"**
- Check key at https://www.perplexity.ai/api-platform

**"Cannot find module"**
- Run `npm install`

**Docker "port already in use"**
- Change port in `.env` and `docker-compose.yml`
