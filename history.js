const fs = require('fs');
const { HISTORY_FILE } = require('./config');

class LorapokHistory {
    constructor() {
        this.history = this.loadHistory();
    }

    loadHistory() {
        if (fs.existsSync(HISTORY_FILE)) {
            try {
                return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
            } catch {
                return [];
            }
        }
        return [];
    }

    save() {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    }

    add(type, input, output, model) {
        this.history.push({
            timestamp: new Date().toISOString(),
            type,
            input: input.substring(0, 100),
            output: output.substring(0, 100),
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
