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
    let key = this.config.apiKey || process.env.PERPLEXITY_API_KEY;
    if (!key) return null;

    // Aggressive cleaning: trim and remove surrounding quotes
    key = key.trim().replace(/^["'](.+)["']$/, '$1');
    return key;
  }

  setApiKey(key) {
    this.set('apiKey', key);
  }

  getGitHubToken() {
    return this.config.githubToken || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  }

  setGitHubToken(token) {
    this.set('githubToken', token);
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

  getUserName() {
    return this.config.userName || null;
  }

  setUserName(name) {
    this.set('userName', name);
  }

  getBrandingFont() {
    return this.config.brandingFont || 'Slant';
  }

  setBrandingFont(font) {
    this.set('brandingFont', font);
  }

  isFirstRun() {
    return !this.config.userName;
  }
}

module.exports = { LorapokConfig };
