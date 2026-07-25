/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Manages persistent interaction history logging to disk.
 */
class LorapokHistory {
    /**
     * @param {Object} [config=null] - LorapokConfig instance
     */
    constructor(config = null) {
        if (!config) {
            const { LorapokConfig } = require('./config');
            this.config = new LorapokConfig();
        } else {
            this.config = config;
        }
        this.historyFile = this.config.historyFile;
        this.history = this.loadHistory();
    }

    /**
     * Load history array from JSON file.
     * @returns {Array<Object>} History entries list
     */
    loadHistory() {
        if (fs.existsSync(this.historyFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
            } catch {
                return [];
            }
        }
        return [];
    }

    /**
     * Persist current history memory array to disk.
     * @returns {void}
     */
    save() {
        fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
    }

    /**
     * Add new entry to history and save to disk.
     * @param {string} type - Operation type
     * @param {string} input - User query or input sample
     * @param {string} output - Agent response or output sample
     * @param {string} model - LLM model used
     * @returns {void}
     */
    add(type, input, output, model) {
        this.history.push({
            timestamp: new Date().toISOString(),
            type,
            input: String(input).substring(0, 100),
            output: String(output).substring(0, 100),
            model
        });
        this.save();
    }

    /**
     * Get all recorded history entries.
     * @returns {Array<Object>} List of history entries
     */
    getAll() {
        return this.history;
    }

    /**
     * Clear all recorded history entries.
     * @returns {void}
     */
    clear() {
        this.history = [];
        this.save();
    }
}

module.exports = LorapokHistory;
