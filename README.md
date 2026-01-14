# 🐛 Lorapok Coding Agent

AI-powered coding assistant with Perplexity API integration.

## Features

- 💬 **Chat** - Interactive AI conversations
- ✨ **Generate Code** - Create code from descriptions
- 🔍 **Analyze Code** - Get insights and suggestions
- 🐛 **Debug** - AI-powered error resolution
- 📁 **File Management** - AI file generation & editing
- 🔗 **Git Integration** - Smart commits & branch management
- 🌐 **REST API** - Web server for integrations

📚 **See [USAGE.md](USAGE.md) for detailed usage instructions.**

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Maijied/Lorapok_AI_Agent.git
cd Lorapok_AI_Agent
npm install
```

### 2. Configure API Key

Get your API key from [Perplexity](https://www.perplexity.ai/api-platform) and add to `.env`:

```bash
cp .env.example .env
# Edit .env and add your API key
```

```env
PERPLEXITY_API_KEY=pplx_your_api_key_here
PORT=3847
```

### 3. Run

**Interactive CLI:**
```bash
node index.js
```

**CLI Commands:**
```bash
node index.js chat              # Start chat mode
node index.js generate "code"   # Generate code
node index.js setup             # Configure settings
node index.js --help            # View all commands
```

**Web Server:**
```bash
node server.js
# API available at http://localhost:3847
```

---

## Docker Setup

### Using Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Docker CLI

```bash
# Build image
docker build -t lorapok-agent .

# Run container
docker run -d \
  --name lorapok \
  -p 3847:3847 \
  -e PERPLEXITY_API_KEY=your_key \
  lorapok-agent
```

**API Endpoint:** `http://localhost:3847`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/models` | List AI models |
| POST | `/api/chat` | Chat with AI |
| POST | `/api/generate` | Generate code |
| POST | `/api/analyze` | Analyze code |
| POST | `/api/debug` | Debug code |
| GET | `/api/files` | List files |
| GET | `/api/git/status` | Git status |

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PERPLEXITY_API_KEY` | Your Perplexity API key | Required |
| `PORT` | Server port | 3847 |
| `NODE_ENV` | Environment | development |

---

## License

MIT
