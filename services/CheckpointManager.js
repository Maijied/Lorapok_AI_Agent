/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * CheckpointManager — git-based checkpoint/rollback for agentic runs.
 * Creates shadow branches or stashes before writes, tracks diffs, and
 * enables single-command revert of an entire agentic run.
 */
'use strict';

const { execSync } = require('child_process');
const logger = require('../lib/logger');
const { GitError } = require('../lib/errors');

// ── CheckpointManager Class ─────────────────────────────────────────

/**
 * Manages git-based checkpoints for safe agentic execution.
 */
class CheckpointManager {
    /**
     * @param {Object} [options={}]
     * @param {string} [options.projectRoot=process.cwd()] - Project root
     * @param {string} [options.sessionId=''] - Session ID for branch naming
     */
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.sessionId = options.sessionId || `s_${Date.now()}`;

        /** @type {{ type: string, ref: string, timestamp: number }|null} */
        this._checkpoint = null;

        /** @type {string[]} */
        this._modifiedFiles = [];

        this._isGitRepo = this._checkGitRepo();
    }

    /**
     * Check if the project root is a git repository.
     * @private
     * @returns {boolean}
     */
    _checkGitRepo() {
        try {
            execSync('git rev-parse --git-dir', {
                cwd: this.projectRoot,
                stdio: 'pipe',
                timeout: 3000
            });
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Create a checkpoint before the first write operation.
     * Uses git stash if there are uncommitted changes, otherwise creates a shadow branch.
     * @returns {{ type: 'stash'|'branch'|'none', ref: string }}
     */
    createCheckpoint() {
        if (!this._isGitRepo) {
            logger.warn('CheckpointManager: not a git repo, skipping checkpoint');
            return { type: 'none', ref: '' };
        }

        if (this._checkpoint) {
            logger.info('CheckpointManager: checkpoint already exists, reusing');
            return { type: this._checkpoint.type, ref: this._checkpoint.ref };
        }

        try {
            // Check for uncommitted changes
            const status = execSync('git status --porcelain', {
                cwd: this.projectRoot,
                encoding: 'utf-8',
                timeout: 5000
            }).trim();

            if (status) {
                // Uncommitted changes exist — stash them
                return this._createStash();
            } else {
                // Clean tree — create a shadow branch at current HEAD
                return this._createShadowBranch();
            }
        } catch (err) {
            logger.error(`CheckpointManager: failed to create checkpoint: ${err.message}`);
            return { type: 'none', ref: '' };
        }
    }

    /**
     * Create a git stash checkpoint.
     * @private
     * @returns {{ type: 'stash', ref: string }}
     */
    _createStash() {
        try {
            const stashMsg = `lorapok-checkpoint-${this.sessionId}`;
            execSync(`git stash push -m "${stashMsg}" --include-untracked`, {
                cwd: this.projectRoot,
                stdio: 'pipe',
                timeout: 10000
            });

            this._checkpoint = { type: 'stash', ref: stashMsg, timestamp: Date.now() };
            logger.info(`CheckpointManager: created stash checkpoint "${stashMsg}"`);
            return { type: 'stash', ref: stashMsg };
        } catch (err) {
            throw new GitError(`Failed to create stash: ${err.message}`, 'git stash');
        }
    }

    /**
     * Create a shadow branch checkpoint.
     * @private
     * @returns {{ type: 'branch', ref: string }}
     */
    _createShadowBranch() {
        try {
            const branchName = `lorapok/checkpoint/${this.sessionId}/${Date.now()}`;
            execSync(`git branch "${branchName}"`, {
                cwd: this.projectRoot,
                stdio: 'pipe',
                timeout: 5000
            });

            this._checkpoint = { type: 'branch', ref: branchName, timestamp: Date.now() };
            logger.info(`CheckpointManager: created shadow branch "${branchName}"`);
            return { type: 'branch', ref: branchName };
        } catch (err) {
            throw new GitError(`Failed to create shadow branch: ${err.message}`, 'git branch');
        }
    }

    /**
     * Track a file modification during the agentic run.
     * @param {string} filePath - Modified file path
     */
    trackModifiedFile(filePath) {
        if (!this._modifiedFiles.includes(filePath)) {
            this._modifiedFiles.push(filePath);
        }
    }

    /**
     * Get the list of files modified during this run.
     * @returns {string[]}
     */
    getModifiedFiles() {
        return [...this._modifiedFiles];
    }

    /**
     * Get the current diff since checkpoint.
     * @returns {string} Unified diff string
     */
    getDiff() {
        if (!this._isGitRepo) return '';
        try {
            const diff = execSync('git diff', {
                cwd: this.projectRoot,
                encoding: 'utf-8',
                maxBuffer: 2 * 1024 * 1024,
                timeout: 10000
            });
            const untrackedDiff = execSync('git diff --cached', {
                cwd: this.projectRoot,
                encoding: 'utf-8',
                maxBuffer: 2 * 1024 * 1024,
                timeout: 10000
            });
            return (diff + untrackedDiff).trim() || '(no changes)';
        } catch (err) {
            return `(diff error: ${err.message})`;
        }
    }

    /**
     * Revert all changes made since the checkpoint.
     * Restores the repo to the exact state at checkpoint creation.
     * @returns {{ success: boolean, message: string }}
     */
    revert() {
        if (!this._checkpoint) {
            return { success: false, message: 'No checkpoint to revert to' };
        }

        if (!this._isGitRepo) {
            return { success: false, message: 'Not a git repository' };
        }

        try {
            // Discard all working tree changes
            execSync('git checkout -- .', {
                cwd: this.projectRoot,
                stdio: 'pipe',
                timeout: 10000
            });

            // Remove untracked files created during the run
            execSync('git clean -fd', {
                cwd: this.projectRoot,
                stdio: 'pipe',
                timeout: 10000
            });

            // Restore stash if applicable
            if (this._checkpoint.type === 'stash') {
                try {
                    execSync('git stash pop', {
                        cwd: this.projectRoot,
                        stdio: 'pipe',
                        timeout: 10000
                    });
                } catch (_) {
                    // Stash may already be applied or conflicting
                    logger.warn('CheckpointManager: stash pop failed, may need manual resolution');
                }
            }

            const filesReverted = this._modifiedFiles.length;
            this._modifiedFiles = [];
            logger.info(`CheckpointManager: reverted ${filesReverted} files to checkpoint`);

            return { success: true, message: `Reverted ${filesReverted} files to checkpoint` };
        } catch (err) {
            return { success: false, message: `Revert failed: ${err.message}` };
        }
    }

    /**
     * Clean up checkpoint artifacts (shadow branches) after a successful run.
     * @returns {{ success: boolean }}
     */
    cleanup() {
        if (!this._checkpoint || !this._isGitRepo) {
            return { success: true };
        }

        try {
            if (this._checkpoint.type === 'branch') {
                execSync(`git branch -D "${this._checkpoint.ref}"`, {
                    cwd: this.projectRoot,
                    stdio: 'pipe',
                    timeout: 5000
                });
                logger.info(`CheckpointManager: deleted shadow branch "${this._checkpoint.ref}"`);
            }
            this._checkpoint = null;
            return { success: true };
        } catch (err) {
            logger.warn(`CheckpointManager: cleanup failed: ${err.message}`);
            return { success: false };
        }
    }

    /**
     * Check if a checkpoint exists.
     * @returns {boolean}
     */
    hasCheckpoint() {
        return this._checkpoint !== null;
    }

    /**
     * Get checkpoint info.
     * @returns {{ type: string, ref: string, timestamp: number, modifiedFiles: string[] }|null}
     */
    getCheckpointInfo() {
        if (!this._checkpoint) return null;
        return {
            ...this._checkpoint,
            modifiedFiles: [...this._modifiedFiles]
        };
    }

    /**
     * Check if the project root is a git repository.
     * @returns {boolean}
     */
    isGitRepo() {
        return this._isGitRepo;
    }
}

module.exports = { CheckpointManager };
