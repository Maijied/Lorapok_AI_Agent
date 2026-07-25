/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { LorapokEnhancedAgent, MODELS } = require('./lib/agent-enhanced');
const { LorapokConfig } = require('./lib/config');

const app = express();
const sessions = new Map();
const connections = new Set();
const SESSION_TTL = 3600000; // 1 hour

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

/**
 * Get or instantiate agent session by ID.
 * @param {string} sessionId - Session identifier string
 * @returns {LorapokEnhancedAgent} Agent instance
 */
function getAgent(sessionId) {
    if (!sessions.has(sessionId)) {
        const config = new LorapokConfig();
        const agent = new LorapokEnhancedAgent(config.getApiKey());
        sessions.set(sessionId, { agent, lastAccessed: Date.now() });
    }
    
    const session = sessions.get(sessionId);
    session.lastAccessed = Date.now();
    
    // Cleanup old sessions
    for (const [id, s] of sessions.entries()) {
        if (Date.now() - s.lastAccessed > SESSION_TTL) {
            if (s.agent && typeof s.agent.clearHistory === 'function') {
                s.agent.clearHistory();
            }
            sessions.delete(id);
        }
    }
    
    return session.agent;
}

// ==================== ENDPOINTS ====================

/**
 * Health check endpoint.
 * @route GET /health
 */
app.get('/health', (req, res) => {
    const pkg = require('./package.json');
    res.json({
        status: 'ok',
        name: pkg.name,
        version: pkg.version,
        credit: 'Built with 🐛 by Lorapok Labs (https://lorapok.tech)',
        author: 'Lorapok Labs (https://lorapok.tech)',
        timestamp: new Date().toISOString()
    });
});

/**
 * Retrieve available LLM models.
 * @route GET /api/models
 */
app.get('/api/models', (req, res) => {
    res.json({ models: MODELS });
});

/**
 * Chat execution endpoint.
 * @route POST /api/chat
 */
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

/**
 * Code generation endpoint.
 * @route POST /api/generate
 */
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

/**
 * Code analysis endpoint.
 * @route POST /api/analyze
 */
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

/**
 * Debug code endpoint.
 * @route POST /api/debug
 */
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

/**
 * List project files.
 * @route GET /api/files
 */
app.get('/api/files', (req, res) => {
    try {
        const agent = getAgent('default');
        const files = agent.listProjectFiles();
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Show project file tree.
 * @route GET /api/files/tree
 */
app.get('/api/files/tree', (req, res) => {
    try {
        const agent = getAgent('default');
        const tree = agent.showFileTree();
        res.json({ tree });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Read specific file content.
 * @route GET /api/files/read
 */
app.get('/api/files/read', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Path query parameter is required' });
        }
        const agent = getAgent('default');
        const fileRes = agent.fileManager.readFile(filePath);
        if (!fileRes.success) {
            return res.status(404).json({ error: fileRes.error });
        }
        res.json({ path: filePath, content: fileRes.data });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * Generate specific target file.
 * @route POST /api/files/generate
 */
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

/**
 * Get formatted Git status.
 * @route GET /api/git/status
 */
app.get('/api/git/status', (req, res) => {
    try {
        const agent = getAgent('default');
        const status = agent.getGitStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get repository branches.
 * @route GET /api/git/branches
 */
app.get('/api/git/branches', (req, res) => {
    try {
        const agent = getAgent('default');
        const branches = agent.listGitBranches();
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get commit log history.
 * @route GET /api/git/log
 */
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

/**
 * Commit changes.
 * @route POST /api/git/commit
 */
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

/**
 * Trigger AI smart commit.
 * @route POST /api/git/smart-commit
 */
app.post('/api/git/smart-commit', async (req, res) => {
    try {
        const agent = getAgent('default');
        const result = await agent.smartCommit();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Single agent chat compatibility route.
 * @route POST /agent/single
 */
app.post('/agent/single', async (req, res) => {
    try {
        const { query, sessionId = 'default' } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        const agent = getAgent(sessionId);
        const response = await agent.chat(query);
        res.json({ success: true, ...response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Multi agent chat compatibility route.
 * @route POST /agent/multi
 */
app.post('/agent/multi', async (req, res) => {
    try {
        const { query, sessionId = 'default' } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        const agent = getAgent(sessionId);
        const response = await agent.chat(`[MULTI-AGENT MODE] ${query}`);
        res.json({ success: true, ...response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Retrieve system settings.
 * @route GET /api/settings
 */
app.get('/api/settings', (req, res) => {
    const config = new LorapokConfig();
    res.json({
        model: config.getModel(),
        language: config.getLanguage(),
        hasApiKey: !!config.getApiKey()
    });
});

/**
 * Update system settings.
 * @route PUT /api/settings
 */
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

/**
 * Terminate and clear active session.
 * @route DELETE /api/sessions/:sessionId
 */
app.delete('/api/sessions/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessions.has(sessionId)) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        const session = sessions.get(sessionId);
        if (session && session.agent && typeof session.agent.clearHistory === 'function') {
            session.agent.clearHistory();
        }
        sessions.delete(sessionId);
        res.json({ success: true, deleted: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Global Express error handling middleware.
 */
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Server Lifecycle & Graceful Shutdown
const PORT = process.env.PORT || 3847;
let server;

/**
 * Perform graceful server shutdown and socket cleanup.
 * @param {string} signal - Triggering signal (SIGINT or SIGTERM)
 * @returns {void}
 */
function gracefulShutdown(signal) {
    console.log(`\n🐛 Received ${signal}. Shutting down gracefully...`);

    if (server) {
        server.close(() => {
            console.log('HTTP server closed.');
            for (const [id, s] of sessions.entries()) {
                if (s && s.agent && typeof s.agent.clearHistory === 'function') {
                    s.agent.clearHistory();
                }
            }
            sessions.clear();
            console.log('Sessions cleared. Goodbye! 🐛');
            process.exit(0);
        });

        for (const socket of connections) {
            socket.destroy();
        }

        setTimeout(() => {
            console.error('Forced shutdown due to timeout.');
            process.exit(1);
        }, 5000);
    }
}

/**
 * Start Express HTTP server with socket tracking.
 * @param {number} [port=PORT] - Target port
 * @returns {Object} HTTP Server instance
 */
function startServer(port = PORT) {
    server = app.listen(port, () => {
        const pkg = require('./package.json');
        console.log(`
    🐛 ════════════════════════════════════
       LORAPOK API SERVER v${pkg.version}
       Built with 🐛 by Lorapok Labs
    ════════════════════════════════════
    
       Server running on port ${port}
    ════════════════════════════════════
      `);
    });

    server.on('connection', (socket) => {
        connections.add(socket);
        socket.on('close', () => connections.delete(socket));
    });

    return server;
}

if (require.main === module) {
    startServer(PORT);
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.gracefulShutdown = gracefulShutdown;
