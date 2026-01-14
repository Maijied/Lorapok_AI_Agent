# 🐛 LORAPOK - CURSOR-INSPIRED ARCHITECTURE
## Complete Design Document v2.0

---

## 📋 TABLE OF CONTENTS
1. Architecture Overview
2. Core Features (Like Cursor)
3. Project Structure
4. Technology Stack
5. Database Schema
6. API Design
7. Frontend Components
8. Workflow Engine
9. Implementation Roadmap

---

# PART 1: ARCHITECTURE OVERVIEW

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LORAPOK SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          FRONTEND (React/Web & CLI)                  │  │
│  │  - Code Editor with Syntax Highlight              │  │
│  │  - File Explorer                                   │  │
│  │  - Chat Interface                                  │  │
│  │  - Terminal Emulator                               │  │
│  │  - Git Visualization                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         API GATEWAY & ORCHESTRATION                 │  │
│  │  - Request Router                                  │  │
│  │  - Authentication                                  │  │
│  │  - Rate Limiting                                   │  │
│  │  - Caching Layer                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      CORE SERVICES LAYER                            │  │
│  │  ┌──────────────┬──────────────┬─────────────────┐  │  │
│  │  │ Code Engine  │ File Manager │ Git Manager    │  │  │
│  │  ├──────────────┼──────────────┼─────────────────┤  │  │
│  │  │ AST Parser   │ File Watcher │ Commit Engine  │  │  │
│  │  │ Linter       │ Diff Engine  │ Branch Manager │  │  │
│  │  │ Type Checker │ Search Index │ Sync Engine    │  │  │
│  │  └──────────────┴──────────────┴─────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────┬──────────────┬─────────────────┐  │  │
│  │  │ AI Services  │ Build Engine │ Test Runner    │  │  │
│  │  ├──────────────┼──────────────┼─────────────────┤  │  │
│  │  │ Perplexity   │ Compiler     │ Test Framework │  │  │
│  │  │ Embeddings   │ Bundler      │ Coverage Tools │  │  │
│  │  │ RAG System   │ Hot Reload   │ Report Gen     │  │  │
│  │  └──────────────┴──────────────┴─────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         DATA LAYER                                  │  │
│  │  - PostgreSQL (Projects, Sessions, History)        │  │
│  │  - Redis (Cache, Sessions, Real-time)              │  │
│  │  - File System (Code, Backups)                      │  │
│  │  - Vector DB (Code Embeddings)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PART 2: CURSOR-INSPIRED FEATURES

## 2.1 Core Features Mapping

### Cursor Features → Lorapok Implementation

| Feature | Cursor | Lorapok |
|---------|--------|---------|
| **Code Generation** | ✅ AI generates code | ✅ Perplexity API |
| **Chat with Code** | ✅ In-editor chat | ✅ Chat with context |
| **Auto-completion** | ✅ Smart autocomplete | ✅ AI-powered suggestions |
| **File Management** | ✅ Create/Edit/Delete | ✅ Full file operations |
| **Git Integration** | ✅ Native git | ✅ Git + AI commit messages |
| **Terminal Access** | ✅ Integrated terminal | ✅ Command runner |
| **Project Structure** | ✅ Full indexing | ✅ AST-based indexing |
| **Codebase Search** | ✅ Fast search | ✅ Vector + Regex search |
| **Refactoring** | ✅ AI refactoring | ✅ AI-powered refactoring |
| **Debugging** | ✅ Debug helpers | ✅ AI error analysis |
| **Testing** | ✅ Test generation | ✅ Test writing with AI |
| **Documentation** | ✅ Auto docs | ✅ Doc generation |
| **VS Code Sync** | ✅ Opens in editor | ✅ VSCode integration |
| **Multi-Model** | ✅ Claude, GPT, etc | ✅ All Perplexity models |
| **Context Window** | ✅ 200k tokens | ✅ Full context memory |
| **Real-time Collab** | ✅ Live Share | ✅ Session-based |

## 2.2 Unique Features We'll Add

```
✨ AI Code Suggestions - Real-time as you type
✨ Smart Git Messages - AI generates commit messages
✨ Project Templates - Start from 50+ templates
✨ Code Metrics - Complexity, maintainability scores
✨ Performance Profiling - AI analyzes performance
✨ Security Scanning - AI checks for vulnerabilities
✨ Test Coverage - AI suggests test cases
✨ API Documentation - Auto-generates API docs
✨ Dependency Analysis - Suggest updates/alternatives
✨ Cloud Sync - Your projects sync across devices
```

---

# PART 3: PROJECT STRUCTURE

## Complete Folder Structure

```
lorapok-project/
│
├── 📦 BACKEND/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.routes.js         # Authentication
│   │   │   ├── projects.routes.js     # Project management
│   │   │   ├── code.routes.js         # Code operations
│   │   │   ├── git.routes.js          # Git operations
│   │   │   ├── ai.routes.js           # AI operations
│   │   │   └── files.routes.js        # File operations
│   │   │
│   │   ├── services/
│   │   │   ├── AiService.js           # Perplexity AI
│   │   │   ├── CodeEngine.js          # Code analysis/generation
│   │   │   ├── FileManager.js         # File operations
│   │   │   ├── GitManager.js          # Git operations
│   │   │   ├── ProjectService.js      # Project management
│   │   │   ├── CacheService.js        # Redis cache
│   │   │   ├── SearchService.js       # Vector search
│   │   │   ├── AstParser.js           # AST parsing
│   │   │   └── BuildService.js        # Build operations
│   │   │
│   │   ├── models/
│   │   │   ├── User.js                # User model
│   │   │   ├── Project.js             # Project model
│   │   │   ├── Session.js             # Session model
│   │   │   ├── CodeContext.js         # Code context
│   │   │   └── Message.js             # Chat message
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                # Authentication
│   │   │   ├── errorHandler.js        # Error handling
│   │   │   ├── logger.js              # Logging
│   │   │   ├── rateLimit.js           # Rate limiting
│   │   │   └── validation.js          # Input validation
│   │   │
│   │   ├── utils/
│   │   │   ├── tokenizer.js           # Code tokenizer
│   │   │   ├── embeddings.js          # Vector embeddings
│   │   │   ├── prompts.js             # AI prompts
│   │   │   ├── validators.js          # Validators
│   │   │   └── helpers.js             # Utility functions
│   │   │
│   │   ├── workers/
│   │   │   ├── codeIndexer.js         # Index code
│   │   │   ├── gitWatcher.js          # Watch git
│   │   │   └── backgroundJobs.js      # Background tasks
│   │   │
│   │   └── server.js                  # Main server
│   │
│   ├── database/
│   │   ├── migrations/                # DB migrations
│   │   ├── seeders/                   # Seed data
│   │   └── schema.sql                 # Schema
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── api.js
│   │   └── env.js
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── docker-compose.yml
│
├── 🎨 FRONTEND/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.jsx             # Code editor
│   │   │   ├── FileExplorer.jsx       # File tree
│   │   │   ├── Chat.jsx               # Chat interface
│   │   │   ├── Terminal.jsx           # Terminal
│   │   │   ├── GitPanel.jsx           # Git visualization
│   │   │   ├── SearchPanel.jsx        # Search
│   │   │   └── StatusBar.jsx          # Status bar
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   ├── Editor.jsx             # Editor view
│   │   │   ├── Projects.jsx           # Projects list
│   │   │   ├── Settings.jsx           # Settings
│   │   │   └── Login.jsx              # Login
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCode.js             # Code state
│   │   │   ├── useProject.js          # Project state
│   │   │   ├── useAi.js               # AI operations
│   │   │   ├── useGit.js              # Git operations
│   │   │   └── useSocket.js           # Real-time
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                 # API client
│   │   │   ├── ai.js                  # AI service
│   │   │   ├── socket.js              # WebSocket
│   │   │   └── storage.js             # Local storage
│   │   │
│   │   ├── styles/
│   │   │   ├── editor.css
│   │   │   ├── layout.css
│   │   │   └── theme.css
│   │   │
│   │   ├── App.jsx
│   │   └── index.js
│   │
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── 🖥️ CLI/
│   ├── bin/
│   │   └── lorapok.js                # CLI entry point
│   │
│   ├── src/
│   │   ├── commands/
│   │   │   ├── init.js               # Initialize project
│   │   │   ├── code.js               # Code operations
│   │   │   ├── file.js               # File operations
│   │   │   ├── git.js                # Git operations
│   │   │   └── ai.js                 # AI operations
│   │   │
│   │   ├── cli.js                    # CLI main
│   │   └── config.js                 # CLI config
│   │
│   ├── package.json
│   └── .env.example
│
├── 📚 DOCS/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── CLI.md
│   └── CONTRIBUTING.md
│
└── 🧪 TESTS/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

---

# PART 4: TECHNOLOGY STACK

## Backend Stack
```
Runtime:      Node.js 18+
Framework:    Express.js
Language:     JavaScript/TypeScript
Database:     PostgreSQL (primary)
Cache:        Redis
Vector DB:    Weaviate/Pinecone (embeddings)
Task Queue:   Bull (background jobs)
Auth:         JWT + OAuth
Logging:      Winston
Testing:      Jest + Supertest
```

## Frontend Stack
```
Framework:    React 18+
Build:        Vite
Language:     TypeScript/JavaScript
State:        Zustand/Redux
Styling:      Tailwind CSS
Editor:       Monaco Editor / Ace Editor
Icons:        Lucide React
UI:           shadcn/ui
HTTP:         Axios
WebSocket:    Socket.io
Testing:      Vitest + React Testing Library
```

## Integrations
```
AI:           Perplexity API (all models)
VCS:          Git (native)
Editor:       VS Code extensions
Terminal:     xterm.js
Metrics:      PostHog / Plausible
Docs:         Swagger/OpenAPI
Deployment:   Docker + Kubernetes
```

---

# PART 5: DATABASE SCHEMA

## Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  username VARCHAR(100),
  api_key VARCHAR(255) UNIQUE,
  perplexity_api_key VARCHAR(255) ENCRYPTED,
  preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  path VARCHAR(1024),
  git_remote VARCHAR(512),
  template VARCHAR(100),
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Code Files
CREATE TABLE code_files (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  path VARCHAR(1024) NOT NULL,
  content TEXT,
  language VARCHAR(50),
  git_hash VARCHAR(40),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  context JSONB,
  model VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id),
  role VARCHAR(20), -- 'user' or 'assistant'
  content TEXT,
  tokens_used INT,
  model VARCHAR(50),
  created_at TIMESTAMP
);

-- Code Context (for RAG)
CREATE TABLE code_embeddings (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES code_files(id),
  chunk_content TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP
);

-- Git History
CREATE TABLE git_commits (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  hash VARCHAR(40),
  message TEXT,
  author VARCHAR(255),
  created_at TIMESTAMP
);
```

---

# PART 6: API DESIGN

## RESTful API Endpoints

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh

PROJECTS
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/fork
POST   /api/projects/:id/publish

CODE OPERATIONS
GET    /api/projects/:id/files
POST   /api/projects/:id/files
GET    /api/projects/:id/files/:fileId
PUT    /api/projects/:id/files/:fileId
DELETE /api/projects/:id/files/:fileId
POST   /api/projects/:id/files/:fileId/analyze
POST   /api/projects/:id/files/:fileId/refactor

AI OPERATIONS
POST   /api/ai/chat
POST   /api/ai/generate-code
POST   /api/ai/analyze-file
POST   /api/ai/refactor
POST   /api/ai/generate-tests
POST   /api/ai/commit-message
POST   /api/ai/debug
POST   /api/ai/optimize

GIT OPERATIONS
GET    /api/projects/:id/git/status
POST   /api/projects/:id/git/commit
POST   /api/projects/:id/git/push
POST   /api/projects/:id/git/pull
GET    /api/projects/:id/git/log
POST   /api/projects/:id/git/branch
GET    /api/projects/:id/git/branches

BUILD & TEST
POST   /api/projects/:id/build
POST   /api/projects/:id/run
POST   /api/projects/:id/test
GET    /api/projects/:id/logs

SEARCH
POST   /api/projects/:id/search
POST   /api/projects/:id/search/code
POST   /api/projects/:id/search/semantic

SETTINGS
GET    /api/settings
PUT    /api/settings
POST   /api/settings/models
GET    /api/settings/usage
```

## WebSocket Events

```javascript
// Real-time updates
socket.on('file:changed', (data) => {})
socket.on('file:saved', (data) => {})
socket.on('git:status', (data) => {})
socket.on('ai:thinking', (data) => {})
socket.on('ai:response', (data) => {})
socket.on('terminal:output', (data) => {})
socket.on('build:status', (data) => {})
socket.on('test:result', (data) => {})
```

---

# PART 7: FRONTEND COMPONENTS

## Main Views

```jsx
// Layout
<Layout>
  <FileExplorer />      // Left sidebar - files
  <EditorPanel />       // Main - code editor
  <ChatPanel />         // Right sidebar - AI chat
  <Terminal />          // Bottom - terminal
  <StatusBar />         // Bottom bar
</Layout>

// Key Components
<Editor />             // Monaco/Ace code editor
<Chat />               // Chat with context
<FileTree />           // Project files
<GitPanel />           // Git visualization
<Terminal />           // Command terminal
<SearchBar />          // Global search
<Suggestions />        // AI suggestions
<Diff />               // Diff viewer
```

## Editor Features

```
✅ Syntax highlighting (100+ languages)
✅ Auto-completion with AI
✅ Go to definition
✅ Find/Replace
✅ Multi-cursor editing
✅ Vim/Emacs keybindings
✅ Bracket matching
✅ Line numbers + minimap
✅ Themes (light/dark/custom)
✅ Font size control
✅ Split editors
✅ Diff viewer
```

---

# PART 8: WORKFLOW ENGINE

## AI-Powered Workflows

```
1. CODE GENERATION FLOW
   User Request → AI Context → Generate Code → Preview → Apply

2. REFACTORING FLOW
   Select Code → Analyze → Generate Improved → Diff → Commit

3. DEBUGGING FLOW
   Paste Error → Analyze → Suggest Fix → Apply → Test

4. GIT FLOW
   Changes → AI Analyze → Generate Commit Message → Commit → Push

5. TEST GENERATION
   Select File → Analyze Coverage → Generate Tests → Run → Commit

6. DOCUMENTATION
   Select Code → Analyze → Generate Docs → Insert → Format

7. SEARCH FLOW
   Query → Vector Search + Regex → Rank → Display + Context
```

---

# PART 9: IMPLEMENTATION ROADMAP

## Phase 1: Core (Week 1-2)
- [ ] Project structure
- [ ] Authentication system
- [ ] Database setup
- [ ] Basic file operations
- [ ] Git integration
- [ ] API endpoints

## Phase 2: AI Integration (Week 3-4)
- [ ] Perplexity API integration
- [ ] Chat system
- [ ] Code generation
- [ ] Code analysis
- [ ] Caching layer

## Phase 3: Frontend (Week 5-7)
- [ ] React setup
- [ ] Editor component
- [ ] File explorer
- [ ] Chat interface
- [ ] Git panel
- [ ] Terminal

## Phase 4: Advanced Features (Week 8-10)
- [ ] Search & indexing
- [ ] Test generation
- [ ] Performance analysis
- [ ] Security scanning
- [ ] Real-time collaboration

## Phase 5: Polish & Deployment (Week 11-12)
- [ ] Testing (unit, integration, e2e)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation
- [ ] Docker & deployment

---

# KEY ARCHITECTURAL DECISIONS

## 1. Service-Oriented Architecture
- Each feature is a service
- Services are independent
- Can scale individually

## 2. Event-Driven Communication
- Real-time updates via WebSocket
- Background jobs via Bull
- Decoupled services

## 3. Layered Architecture
- Controllers → Services → Models → Database
- Clear separation of concerns
- Easy testing

## 4. Context Window Management
- Store conversation history
- Use vector embeddings for RAG
- Compress context for efficiency

## 5. Multi-Model Support
- Abstract AI calls
- Easy to add new models
- User can choose preferred model

## 6. File Watcher Pattern
- Watch project files
- Auto-index changes
- Enable real-time features

## 7. Caching Strategy
- Redis for session/temp data
- Vector DB for code embeddings
- File system for persistent code

---

# SECURITY CONSIDERATIONS

```
✅ API Key encryption at rest
✅ JWT for authentication
✅ Rate limiting on all endpoints
✅ Input validation & sanitization
✅ SQL injection prevention (ORM)
✅ CORS configuration
✅ Helmet.js for headers
✅ Environment variables management
✅ Audit logging
✅ File access restrictions
✅ Sandbox execution (optional)
```

---

# PERFORMANCE TARGETS

```
✅ Chat response: < 2 seconds
✅ File load: < 500ms
✅ Search: < 300ms
✅ Code generation: < 5 seconds
✅ Build: < 10 seconds
✅ Memory usage: < 500MB
✅ API latency: < 200ms (p95)
✅ Concurrent users: 1000+
```

---

# SUCCESS METRICS

```
📊 User can create project in < 30 seconds
📊 Chat responds with relevant code
📊 Generated code is > 80% working
📊 File operations < 500ms
📊 Zero accidental file deletions
📊 Git integration reliable
📊 No sensitive data exposure
📊 API uptime > 99.9%
```

---

## NEXT STEPS

After this design review:
1. ✅ Review architecture
2. ✅ Validate tech stack
3. ✅ Approve database schema
4. ✅ Then → **FULL BUILD INSTRUCTIONS** will be provided

**Ready to proceed?** Say "YES" and I'll give you complete step-by-step instructions to build this from scratch!