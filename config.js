const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.lorapok');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json');

class LorapokConfig {
  constructor() {
    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      } catch (error) {
        console.error('❌ Error reading config file');
        return {};
      }
    }
    return {};
  }

  saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  getApiKey() {
    return this.config.apiKey || process.env.PERPLEXITY_API_KEY;
  }

  setApiKey(key) {
    this.set('apiKey', key);
  }

  getModel() {
    return this.config.model || 'sonar-pro';
  }

  setModel(model) {
    this.set('model', model);
  }

  getLanguage() {
    return this.config.language || 'javascript';
  }

  setLanguage(lang) {
    this.set('language', lang);
  }
}

module.exports = { LorapokConfig, CONFIG_DIR, CONFIG_FILE, HISTORY_FILE };
