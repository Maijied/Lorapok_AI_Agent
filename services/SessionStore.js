/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const MAX_SESSIONS = 50;

/**
 * Persist SESSION RECAP payloads under ~/.lorapok/sessions/
 */
class SessionStore {
    /**
     * @param {string|null} [configDir=null]
     */
    constructor(configDir = null) {
        this.configDir = configDir || path.join(os.homedir(), '.lorapok');
        this.sessionsDir = path.join(this.configDir, 'sessions');
        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true, mode: 0o700 });
        }
    }

    /**
     * @param {Object} sessionData
     * @returns {string} Absolute path written
     */
    save(sessionData) {
        this.ensureDir();
        const id = (sessionData && sessionData.id) || Math.random().toString(36).slice(2, 10).toUpperCase();
        const record = {
            ...sessionData,
            id,
            savedAt: new Date().toISOString(),
            endTime: sessionData.endTime || Date.now()
        };
        const file = path.join(this.sessionsDir, `${id}.json`);
        fs.writeFileSync(file, JSON.stringify(record, null, 2), { mode: 0o600 });
        this.prune();
        return file;
    }

    /**
     * @returns {Array<{ id: string, savedAt: string, count: number, file: string }>}
     */
    list(limit = 20) {
        this.ensureDir();
        if (!fs.existsSync(this.sessionsDir)) return [];
        const files = fs.readdirSync(this.sessionsDir).filter(f => f.endsWith('.json'));
        const rows = [];
        for (const f of files) {
            try {
                const full = path.join(this.sessionsDir, f);
                const data = JSON.parse(fs.readFileSync(full, 'utf8'));
                rows.push({
                    id: data.id || f.replace(/\.json$/, ''),
                    savedAt: data.savedAt || '',
                    count: data.count || 0,
                    successRate: data.successRate,
                    tokens: data.tokens,
                    file: full
                });
            } catch (_) { /* skip corrupt */ }
        }
        rows.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
        return rows.slice(0, limit);
    }

    /**
     * @param {string} id
     * @returns {Object|null}
     */
    load(id) {
        const file = path.join(this.sessionsDir, `${id}.json`);
        if (!fs.existsSync(file)) return null;
        try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (_) {
            return null;
        }
    }

    prune() {
        const all = this.list(1000);
        if (all.length <= MAX_SESSIONS) return;
        for (const row of all.slice(MAX_SESSIONS)) {
            try { fs.unlinkSync(row.file); } catch (_) { /* ignore */ }
        }
    }
}

module.exports = { SessionStore, MAX_SESSIONS };
