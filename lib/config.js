const fs = require('fs');
const path = require('path');
const os = require('os');

class LorapokConfig {
  constructor(customDir = null) {
    this.configDir = customDir || path.join(os.homedir(), '.lorapok');
    this.configFile = path.join(this.configDir, 'config.json');
    this.historyFile = path.join(this.configDir, 'history.json');

    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  loadConfig() {
    if (fs.existsSync(this.configFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
      } catch (error) {
        console.error('❌ Error reading config file');
        return {};
      }
    }
    return {};
  }

  saveConfig() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
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
    return this.config.model || 'sonar';
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

module.exports = { LorapokConfig };
