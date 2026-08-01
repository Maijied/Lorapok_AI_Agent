/**
 * @lorapok/sdk — thin fetch wrappers for Lorapok Express API
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 */
'use strict';

/**
 * @param {string} [baseUrl='http://localhost:3847']
 */
function createLorapokClient(baseUrl = 'http://localhost:3847') {
    const root = String(baseUrl).replace(/\/$/, '');

    async function request(path, options = {}) {
        const res = await fetch(`${root}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.error || data.message || `HTTP ${res.status}`);
            err.status = res.status;
            err.body = data;
            throw err;
        }
        return data;
    }

    return {
        health: () => request('/health'),
        getModels: (view = 'usable', sessionId = 'default') =>
            request(`/api/models?view=${encodeURIComponent(view)}&sessionId=${encodeURIComponent(sessionId)}`),
        refreshModels: (sessionId = 'default') =>
            request('/api/models/refresh', { method: 'POST', body: JSON.stringify({ sessionId }) }),
        chat: (message, { model, sessionId = 'default' } = {}) =>
            request('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ message, model, sessionId })
            }),
        getSettings: () => request('/api/settings'),
        updateSettings: (body) =>
            request('/api/settings', { method: 'PUT', body: JSON.stringify(body || {}) })
    };
}

module.exports = { createLorapokClient };
