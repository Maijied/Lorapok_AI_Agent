/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Proprietary & Confidential. All Rights Reserved.
 */
'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { LorapokEnhancedAgent } = require('./lib/agent-enhanced');
const { ModelManager } = require('./services/ModelManager');
const { LorapokConfig } = require('./lib/config');
const logger = require('./lib/logger');
const modelCacheService = require('./services/ModelCacheService');

const app = express();
const sessions = new Map();
const connections = new Set();
const SESSION_TTL = 3600000; // 1 hour

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map(s => s.trim()) } : undefined));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: message,
        errorDetail: { code, message }
    });
}

function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function serializeModel(id, meta) {
    return {
        id,
        name: meta.name,
        provider: meta.provider,
        category: meta.category,
        contextLength: meta.contextLength,
        rateLimit: meta.rateLimit,
        resetWindow: meta.resetWindow,
        available: meta.available === true,
        paymentRequired: meta.paymentRequired === true || (meta.tier === 'pro' && meta.provider !== 'google-ai-studio'),
        rateLimited: Boolean(meta.rateLimited),
        tier: meta.tier,
        description: meta.description || ''
    };
}

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
 * Retrieve validated LLM models.
 * @route GET /api/models?view=usable|paid|all&sessionId=
 */
app.get('/api/models', asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || 'default';
    const view = String(req.query.view || 'usable').toLowerCase();
    const agent = getAgent(sessionId);
    const validated = await agent.checkAvailableModels();
    const mm = agent.modelManager;

    const toMap = (ids) => {
        const out = {};
        for (const id of ids) {
            out[id] = serializeModel(id, validated[id]);
        }
        return out;
    };

    const usableIds = mm.getUsableModelIds(validated);
    const paidIds = mm.getPaidCatalogIds(validated);

    if (view === 'paid') {
        return res.json({
            success: true,
            view: 'paid',
            counts: { usable: usableIds.length, paid: paidIds.length, total: Object.keys(validated).length },
            models: toMap(paidIds)
        });
    }
    if (view === 'all') {
        return res.json({
            success: true,
            view: 'all',
            counts: { usable: usableIds.length, paid: paidIds.length, total: Object.keys(validated).length },
            usable: toMap(usableIds),
            paid: toMap(paidIds)
        });
    }
    return res.json({
        success: true,
        view: 'usable',
        counts: { usable: usableIds.length, paid: paidIds.length, total: Object.keys(validated).length },
        models: toMap(usableIds)
    });
}));

/**
 * Refresh model catalog (mirrors CLI /refresh-models).
 * @route POST /api/models/refresh
 */
app.post('/api/models/refresh', asyncHandler(async (req, res) => {
    const sessionId = req.body?.sessionId || req.query.sessionId || 'default';
    const agent = getAgent(sessionId);
    modelCacheService.clearFailedModels();
    if (agent.cache) agent.cache.del('availableModels');
    const catalog = await agent.modelManager.fetchModels({ bypassCache: true });
    const validated = await agent.checkAvailableModels();
    res.json({
        success: true,
        loaded: Object.keys(catalog || {}).length,
        usable: agent.modelManager.getUsableModelIds(validated).length,
        paid: agent.modelManager.getPaidCatalogIds(validated).length
    });
}));

/**
 * Chat execution endpoint.
 * @route POST /api/chat
 */
app.post('/api/chat', asyncHandler(async (req, res) => {
    const { message, model, sessionId = 'default' } = req.body || {};

    if (!message || typeof message !== 'string') {
        return sendError(res, 400, 'MESSAGE_REQUIRED', 'Message is required');
    }
    if (message.length > 200000) {
        return sendError(res, 400, 'MESSAGE_TOO_LONG', 'Message exceeds maximum length');
    }

    const agent = getAgent(sessionId);
    if (model) {
        const validated = await agent.checkAvailableModels();
        if (!agent.modelManager.canSelectModel(model, validated)) {
            return sendError(res, 400, 'MODEL_NOT_ACCESSIBLE', `Model '${model}' is not accessible with current keys`);
        }
    }
    const response = await agent.chat(message, model);
    res.json(response);
}));

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
        hasApiKey: !!config.getApiKey(),
        hasGoogleKey: !!(typeof config.getGoogleApiKey === 'function' && config.getGoogleApiKey()),
        hasOpenRouterKey: !!(typeof config.getOpenRouterApiKey === 'function' && config.getOpenRouterApiKey()),
        hasPerplexityKey: !!(typeof config.getPerplexityApiKey === 'function' && config.getPerplexityApiKey()) || !!config.getApiKey()
    });
});

/**
 * Update system settings.
 * @route PUT /api/settings
 */
app.put('/api/settings', asyncHandler(async (req, res) => {
    const { model, language, apiKey, sessionId = 'default' } = req.body || {};
    const config = new LorapokConfig();

    if (model) {
        const agent = getAgent(sessionId);
        const validated = await agent.checkAvailableModels();
        if (!agent.modelManager.canSelectModel(model, validated)) {
            return sendError(res, 400, 'MODEL_NOT_ACCESSIBLE', `Model '${model}' is not accessible with current keys`);
        }
        config.setModel(model);
    }
    if (language) config.setLanguage(language);
    if (apiKey) config.setApiKey(apiKey);

    res.json({ success: true });
}));

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
    logger.error(`Express error: ${err.message}`);
    if (res.headersSent) return next(err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        errorDetail: { code: 'INTERNAL_ERROR', message: err.message }
    });
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
