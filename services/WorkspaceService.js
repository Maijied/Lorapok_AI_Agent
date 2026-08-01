/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const logger = require('../lib/logger');

const HOME_MARKER = 'workspace_schema_version';
const SCHEMA_VERSION = 1;

/**
 * Central ~/.lorapok + project .lorapok onboarding helpers.
 */
class WorkspaceService {
    constructor(options = {}) {
        this.homeDir = options.homeDir || path.join(os.homedir(), '.lorapok');
        this.legacyCandidates = options.legacyCandidates || [
            path.join(os.homedir(), 'Lorapok'),
            path.join(os.homedir(), '.Lorapok')
        ];
    }

    ensureHome() {
        if (!fs.existsSync(this.homeDir)) {
            fs.mkdirSync(this.homeDir, { recursive: true });
            logger.info(`WorkspaceService: created central home ${this.homeDir}`);
        }
        for (const sub of ['logs', 'backups']) {
            const p = path.join(this.homeDir, sub);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        }
        const markerFile = path.join(this.homeDir, '.schema.json');
        if (!fs.existsSync(markerFile)) {
            fs.writeFileSync(markerFile, JSON.stringify({ [HOME_MARKER]: SCHEMA_VERSION, createdAt: Date.now() }, null, 2));
        }
        return this.homeDir;
    }

    isHomeOnboarded() {
        const markerFile = path.join(this.homeDir, '.schema.json');
        return fs.existsSync(markerFile);
    }

    detectLegacy() {
        const found = [];
        for (const candidate of this.legacyCandidates) {
            try {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
                    // Don't treat active ~/.lorapok as legacy
                    if (path.resolve(candidate) === path.resolve(this.homeDir)) continue;
                    found.push(candidate);
                }
            } catch (_) { /* ignore */ }
        }
        // Upgrade marker missing but home has old files without schema
        if (fs.existsSync(this.homeDir) && !this.isHomeOnboarded()) {
            const hasConfig = fs.existsSync(path.join(this.homeDir, 'config.json'));
            if (hasConfig) found.push(this.homeDir);
        }
        return found;
    }

    backupLegacy(sources = null) {
        this.ensureHome();
        const list = sources || this.detectLegacy();
        if (!list.length) return null;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dest = path.join(this.homeDir, 'backups', stamp);
        fs.mkdirSync(dest, { recursive: true });
        for (const src of list) {
            const name = path.basename(src) + (src === this.homeDir ? '-home-pre-upgrade' : '');
            const target = path.join(dest, name);
            this._copyRecursive(src, target);
        }
        logger.info(`WorkspaceService: backed up legacy data to ${dest}`);
        return dest;
    }

    _copyRecursive(src, dest) {
        if (!fs.existsSync(src)) return;
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            for (const entry of fs.readdirSync(src)) {
                // Avoid copying backups into themselves
                if (entry === 'backups' && path.resolve(src) === path.resolve(this.homeDir)) continue;
                this._copyRecursive(path.join(src, entry), path.join(dest, entry));
            }
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    projectLorapokPath(cwd = process.cwd()) {
        return path.join(cwd, '.lorapok');
    }

    hasProjectLorapok(cwd = process.cwd()) {
        return fs.existsSync(this.projectLorapokPath(cwd));
    }

    ensureProjectLorapok(cwd = process.cwd()) {
        const dir = this.projectLorapokPath(cwd);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const readme = path.join(dir, 'README.md');
        if (!fs.existsSync(readme)) {
            fs.writeFileSync(readme, [
                '# Lorapok workspace',
                '',
                'Project-local Lorapok data (sessions, caches, overrides).',
                'Central user config lives in `~/.lorapok`.',
                ''
            ].join('\n'));
        }
        const gitignorePath = path.join(cwd, '.gitignore');
        this._ensureGitignoreEntry(gitignorePath, '.lorapok/');
        return dir;
    }

    _ensureGitignoreEntry(gitignorePath, entry) {
        try {
            let content = '';
            if (fs.existsSync(gitignorePath)) {
                content = fs.readFileSync(gitignorePath, 'utf8');
                if (content.split(/\r?\n/).some(line => line.trim() === entry || line.trim() === entry.replace(/\/$/, ''))) {
                    return;
                }
                content = content.endsWith('\n') ? content : content + '\n';
            }
            fs.writeFileSync(gitignorePath, `${content}${entry}\n`);
        } catch (err) {
            logger.warn(`WorkspaceService: could not update .gitignore — ${err.message}`);
        }
    }

    /**
     * Interactive-friendly decision helper (caller shows Enquirer).
     */
    async runOnboarding(options = {}) {
        const {
            cwd = process.cwd(),
            isTTY = Boolean(process.stdout.isTTY),
            askLegacy = null,
            askProject = null,
            forceProject = process.env.LORAPOK_INIT_WORKSPACE === '1'
        } = options;

        this.ensureHome();
        const legacy = this.detectLegacy();
        let migration = 'none';

        if (legacy.length && isTTY && typeof askLegacy === 'function') {
            const choice = await askLegacy(legacy);
            if (choice === 'backup') {
                this.backupLegacy(legacy);
                this.ensureHome();
                migration = 'backup';
            } else if (choice === 'fresh') {
                this.backupLegacy(legacy);
                migration = 'fresh';
            } else {
                migration = 'skipped';
            }
        } else if (legacy.length && !isTTY) {
            migration = 'skipped-ci';
        }

        let project = 'exists';
        if (!this.hasProjectLorapok(cwd)) {
            if (forceProject || (!isTTY && forceProject)) {
                this.ensureProjectLorapok(cwd);
                project = 'created';
            } else if (isTTY && typeof askProject === 'function') {
                const yes = await askProject(cwd);
                if (yes) {
                    this.ensureProjectLorapok(cwd);
                    project = 'created';
                } else {
                    project = 'declined';
                }
            } else {
                project = 'skipped';
            }
        }

        return { home: this.homeDir, migration, project, legacy };
    }
}

module.exports = { WorkspaceService };
