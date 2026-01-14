const fs = require('fs');
const path = require('path');

class LorapokHistory {
    constructor(config) {
        if (!config) {
            const { LorapokConfig } = require('./config');
            this.config = new LorapokConfig();
        } else {
            this.config = config;
        }
        this.historyFile = this.config.historyFile;
        this.history = this.loadHistory();
    }

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

    save() {
        fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
    }

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

    getAll() {
        return this.history;
    }

    clear() {
        this.history = [];
        this.save();
    }
}

module.exports = LorapokHistory;
