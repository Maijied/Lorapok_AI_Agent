/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * PolicyEngine — permission/approval state machine for tool calls.
 * Enforces a tiered policy: always_allow → allowlist → confirm → deny.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../lib/logger');
const { PolicyDeniedError } = require('../lib/errors');
const { POLICY_TIERS } = require('../lib/core/ToolSpec');

// ── Policy States ────────────────────────────────────────────────────

/**
 * State machine states for a tool call authorization.
 * @enum {string}
 */
const POLICY_STATES = {
    PROPOSED: 'proposed',
    AUTO_APPROVED: 'auto_approved',
    NEEDS_CONFIRM: 'needs_confirm',
    DENIED: 'denied',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXECUTING: 'executing',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed'
};

// ── Hard Deny Patterns ───────────────────────────────────────────────

/**
 * Commands and patterns that are ALWAYS denied regardless of configuration.
 * These are not overridable by the model or by per-repo config.
 */
const HARD_DENY_PATTERNS = [
    /^rm\s+(-rf|-fr)\s+\//,          // rm -rf / (root)
    /^rm\s+(-rf|-fr)\s+~/,           // rm -rf ~ (home)
    /^rm\s+(-rf|-fr)\s+\.\s*$/,      // rm -rf .
    /\bgit\s+push\s+--force\b/,      // force push
    /\bgit\s+push\s+-f\b/,           // force push short
    /\bsudo\b/,                       // sudo anything
    /\bchmod\s+777\b/,               // world-writable
    /\bcurl\b.*\|\s*sh\b/,           // pipe curl to shell
    /\bwget\b.*\|\s*sh\b/,           // pipe wget to shell
    /\beval\b/,                       // eval
    /\bdd\s+if=/,                     // dd (disk destroyer)
    /\bmkfs\b/,                       // format disk
    /\bshutdown\b/,                   // shutdown
    /\breboot\b/                      // reboot
];

/**
 * File patterns that are ALWAYS denied for write/delete operations.
 */
const PROTECTED_FILE_PATTERNS = [
    /\.env$/,
    /\.env\.\w+$/,
    /credentials/i,
    /\.ssh\//,
    /\.gnupg\//,
    /\.aws\/credentials/,
    /\.gcloud\//,
    /id_rsa/,
    /id_ed25519/,
    /\.pem$/,
    /\.key$/
];

// ── PolicyEngine Class ───────────────────────────────────────────────

/**
 * Manages permission checks for tool calls in agentic mode.
 * Implements the state machine: PROPOSED → policy check → AUTO_APPROVED | NEEDS_CONFIRM | DENIED.
 */
class PolicyEngine {
    /**
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.projectRoot=process.cwd()] - Project root for loading per-repo policy
     * @param {string[]} [options.allowlist=[]] - Pre-approved command prefixes
     * @param {boolean} [options.autoApprove=false] - Bypass mode (auto-approve confirmable actions)
     */
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.allowlist = Array.isArray(options.allowlist) ? [...options.allowlist] : [];
        this.autoApprove = Boolean(options.autoApprove);

        // Load per-repo policy if available
        this._loadRepoPolicy();

        // Audit log
        this._auditLog = [];
    }

    /**
     * Load per-repo policy from .lorapok/policy.json.
     * @private
     */
    _loadRepoPolicy() {
        try {
            const policyPath = path.join(this.projectRoot, '.lorapok', 'policy.json');
            if (fs.existsSync(policyPath)) {
                const raw = fs.readFileSync(policyPath, 'utf-8');
                const policy = JSON.parse(raw);
                if (Array.isArray(policy.allowlist)) {
                    this.allowlist = [...new Set([...this.allowlist, ...policy.allowlist])];
                }
                logger.info(`Loaded per-repo policy from ${policyPath} (${this.allowlist.length} allowlist entries)`);
            }
        } catch (err) {
            logger.warn(`Failed to load repo policy: ${err.message}`);
        }
    }

    /**
     * Evaluate a proposed tool call against the policy.
     * This is the main entry point for the state machine.
     *
     * @param {Object} toolCall - The proposed tool call
     * @param {string} toolCall.name - Tool name
     * @param {Object} toolCall.input - Tool input parameters
     * @param {string} toolCall.policyTier - Policy tier from ToolSpec
     * @returns {{ state: string, reason: string, requiresUserInput: boolean }}
     */
    evaluate(toolCall) {
        const { name, input, policyTier } = toolCall;
        const target = this._extractTarget(name, input);

        // 1. Hard deny check (always first, not overridable)
        const denyResult = this._checkHardDeny(name, input, target);
        if (denyResult) {
            this._log('DENIED', name, target, denyResult.reason);
            return { state: POLICY_STATES.DENIED, reason: denyResult.reason, requiresUserInput: false };
        }

        // 2. Protected file check for write/delete operations
        if (this._isWriteOperation(name)) {
            const protectedResult = this._checkProtectedFiles(target);
            if (protectedResult) {
                this._log('DENIED', name, target, protectedResult.reason);
                return { state: POLICY_STATES.DENIED, reason: protectedResult.reason, requiresUserInput: false };
            }
        }

        // 3. Tier-based evaluation
        switch (policyTier) {
            case POLICY_TIERS.ALWAYS_ALLOW:
                this._log('AUTO_APPROVED', name, target, 'always_allow tier');
                return { state: POLICY_STATES.AUTO_APPROVED, reason: 'Read-only operation (always allowed)', requiresUserInput: false };

            case POLICY_TIERS.ALLOWLIST:
                if (this._isOnAllowlist(name, input, target)) {
                    this._log('AUTO_APPROVED', name, target, 'allowlist match');
                    return { state: POLICY_STATES.AUTO_APPROVED, reason: `Allowlisted command: ${target}`, requiresUserInput: false };
                }
                // Falls through to confirm if not on allowlist
                if (this.autoApprove) {
                    this._log('AUTO_APPROVED', name, target, 'bypass mode');
                    return { state: POLICY_STATES.AUTO_APPROVED, reason: 'Bypass mode active', requiresUserInput: false };
                }
                this._log('NEEDS_CONFIRM', name, target, 'not on allowlist');
                return { state: POLICY_STATES.NEEDS_CONFIRM, reason: `Command not on allowlist: ${target}`, requiresUserInput: true };

            case POLICY_TIERS.CONFIRM:
                if (this.autoApprove) {
                    this._log('AUTO_APPROVED', name, target, 'bypass mode');
                    return { state: POLICY_STATES.AUTO_APPROVED, reason: 'Bypass mode active', requiresUserInput: false };
                }
                this._log('NEEDS_CONFIRM', name, target, 'confirm tier');
                return { state: POLICY_STATES.NEEDS_CONFIRM, reason: `Requires confirmation: ${name} → ${target}`, requiresUserInput: true };

            case POLICY_TIERS.DENY:
                this._log('DENIED', name, target, 'deny tier');
                return { state: POLICY_STATES.DENIED, reason: `Tool "${name}" is in the deny tier`, requiresUserInput: false };

            default:
                // Unknown tier → confirm by default (safe fallback)
                this._log('NEEDS_CONFIRM', name, target, 'unknown tier fallback');
                return { state: POLICY_STATES.NEEDS_CONFIRM, reason: `Unknown policy tier: ${policyTier}`, requiresUserInput: true };
        }
    }

    /**
     * Check if a command or target matches the hard deny list.
     * @private
     * @param {string} toolName - Tool name
     * @param {Object} input - Tool input
     * @param {string} target - Extracted target string
     * @returns {{ reason: string }|null} Denial reason or null if allowed
     */
    _checkHardDeny(toolName, input, target) {
        if (toolName === 'run_command' || toolName === 'shell') {
            const command = input.command || input.cmd || target || '';
            for (const pattern of HARD_DENY_PATTERNS) {
                if (pattern.test(command)) {
                    return { reason: `Hard-denied command pattern: ${command.slice(0, 60)}…` };
                }
            }
        }
        return null;
    }

    /**
     * Check if a target file matches protected file patterns.
     * @private
     * @param {string} target - File path
     * @returns {{ reason: string }|null}
     */
    _checkProtectedFiles(target) {
        if (!target) return null;
        for (const pattern of PROTECTED_FILE_PATTERNS) {
            if (pattern.test(target)) {
                return { reason: `Protected file pattern matched: ${target}` };
            }
        }
        return null;
    }

    /**
     * Check if a tool call is on the allowlist.
     * @private
     * @param {string} toolName
     * @param {Object} input
     * @param {string} target
     * @returns {boolean}
     */
    _isOnAllowlist(toolName, input, target) {
        const command = input.command || input.cmd || target || '';
        return this.allowlist.some(allowed => {
            if (typeof allowed === 'string') {
                return command.startsWith(allowed) || command === allowed;
            }
            return false;
        });
    }

    /**
     * Check if a tool name represents a write/mutating operation.
     * @private
     * @param {string} toolName
     * @returns {boolean}
     */
    _isWriteOperation(toolName) {
        return ['write_file', 'delete_file', 'create_file', 'edit_file'].includes(toolName);
    }

    /**
     * Extract the primary target (file path or command) from tool input.
     * @private
     * @param {string} toolName
     * @param {Object} input
     * @returns {string}
     */
    _extractTarget(toolName, input) {
        if (!input || typeof input !== 'object') return '';
        return input.path || input.file || input.filePath || input.command || input.cmd || input.target || '';
    }

    /**
     * Log an audit entry.
     * @private
     */
    _log(state, toolName, target, reason) {
        const entry = {
            timestamp: new Date().toISOString(),
            state,
            toolName,
            target: target.slice(0, 200),
            reason
        };
        this._auditLog.push(entry);
        logger.info(`PolicyEngine: [${state}] ${toolName} → ${target.slice(0, 60)} (${reason})`);
    }

    /**
     * Get the audit log.
     * @returns {Array<Object>}
     */
    getAuditLog() {
        return [...this._auditLog];
    }

    /**
     * Clear the audit log.
     */
    clearAuditLog() {
        this._auditLog = [];
    }

    /**
     * Set bypass/auto-approve mode.
     * @param {boolean} enabled
     */
    setAutoApprove(enabled) {
        this.autoApprove = Boolean(enabled);
    }

    /**
     * Add entries to the allowlist.
     * @param {string[]} entries - Command prefixes to allow
     */
    addToAllowlist(entries) {
        if (Array.isArray(entries)) {
            this.allowlist = [...new Set([...this.allowlist, ...entries])];
        }
    }
}

module.exports = {
    PolicyEngine,
    POLICY_STATES,
    HARD_DENY_PATTERNS,
    PROTECTED_FILE_PATTERNS
};
