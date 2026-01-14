const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { LorapokEnhancedAgent, MODELS } = require('./agent-enhanced');
const { LorapokConfig } = require('./config');

const app = express();
const sessions = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Get or create agent session
function getAgent(sessionId) {
    if (!sessions.has(sessionId)) {
        const config = new LorapokConfig();
        const agent = new LorapokEnhancedAgent(config.getApiKey());
        sessions.set(sessionId, agent);
    }
    return sessions.get(sessionId);
}

// ==================== ENDPOINTS ====================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Get available models
app.get('/api/models', (req, res) => {
    res.json({ models: MODELS });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, model, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const agent = getAgent(sessionId);
        const response = await agent.chat(message, model);

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate code endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const { requirements, language, framework, sessionId = 'default' } = req.body;

        if (!requirements) {
            return res.status(400).json({ error: 'Requirements is required' });
        }

        const agent = getAgent(sessionId);
        const response = await agent.generateCode(requirements, language, framework);

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze code endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { code, language, sessionId = 'default' } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const agent = getAgent(sessionId);
        const response = await agent.analyzeCode(code, language);

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug code endpoint
app.post('/api/debug', async (req, res) => {
    try {
        const { code, error: errorMsg, language, sessionId = 'default' } = req.body;

        if (!code || !errorMsg) {
            return res.status(400).json({ error: 'Code and error message are required' });
        }

        const agent = getAgent(sessionId);
        const response = await agent.debugCode(code, errorMsg, language);

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File operations
app.get('/api/files', (req, res) => {
    try {
        const agent = getAgent('default');
        const files = agent.listProjectFiles();
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/files/tree', (req, res) => {
    try {
        const agent = getAgent('default');
        const tree = agent.showFileTree();
        res.json({ tree });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/files/read', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Path query parameter is required' });
        }
        const agent = getAgent('default');
        const content = agent.fileManager.readFile(filePath);
        res.json({ path: filePath, content });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.post('/api/files/generate', async (req, res) => {
    try {
        const { path, description, sessionId = 'default' } = req.body;

        if (!path || !description) {
            return res.status(400).json({ error: 'Path and description are required' });
        }

        const agent = getAgent(sessionId);
        const result = await agent.generateFile(path, description);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Git operations
app.get('/api/git/status', (req, res) => {
    try {
        const agent = getAgent('default');
        const status = agent.getGitStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/git/branches', (req, res) => {
    try {
        const agent = getAgent('default');
        const branches = agent.listGitBranches();
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/git/log', (req, res) => {
    try {
        const count = parseInt(req.query.count) || 10;
        const agent = getAgent('default');
        const log = agent.getGitLog(count);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/git/commit', async (req, res) => {
    try {
        const { message, files = '.' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Commit message is required' });
        }

        const agent = getAgent('default');
        const result = await agent.commitChanges(message, files);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/git/smart-commit', async (req, res) => {
    try {
        const agent = getAgent('default');
        const result = await agent.smartCommit();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settings
app.get('/api/settings', (req, res) => {
    const config = new LorapokConfig();
    res.json({
        model: config.getModel(),
        language: config.getLanguage(),
        hasApiKey: !!config.getApiKey()
    });
});

app.put('/api/settings', (req, res) => {
    try {
        const { model, language, apiKey } = req.body;
        const config = new LorapokConfig();

        if (model) config.setModel(model);
        if (language) config.setLanguage(language);
        if (apiKey) config.setApiKey(apiKey);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear session
app.delete('/api/sessions/:sessionId', (req, res) => {
    sessions.delete(req.params.sessionId);
    res.json({ success: true });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
🐛 ════════════════════════════════════
   LORAPOK API SERVER v1.0.0
════════════════════════════════════

   Server running on port ${PORT}
   
   Endpoints:
   - GET  /health
   - GET  /api/models
   - POST /api/chat
   - POST /api/generate
   - POST /api/analyze
   - POST /api/debug
   - GET  /api/files
   - GET  /api/git/status
   - GET  /api/settings

════════════════════════════════════
  `);
});

module.exports = app;
