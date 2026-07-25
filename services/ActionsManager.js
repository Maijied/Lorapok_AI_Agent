/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const axios = require('axios');
const chalk = require('chalk');

/**
 * Service for GitHub Actions workflow discovery, execution, and monitoring.
 */
class ActionsManager {
    /**
     * @param {Object} gitManager - Instance of GitManager for repository metadata resolution
     */
    constructor(gitManager) {
        this.gitManager = gitManager;
        this.baseUrl = 'https://api.github.com';
    }

    /**
     * Get GitHub token from environment variables.
     * @returns {string|undefined} Active GitHub token
     */
    get token() {
        return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    }

    /**
     * Get default HTTP headers for GitHub REST API requests.
     * @returns {Object} Headers object
     */
    get headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    /**
     * Resolve repository owner and name from current Git remote.
     * @returns {Promise<{ success: boolean, data?: { owner: string, repo: string }, error?: string }>} Repository context result
     */
    async getRepoContext() {
        const isRepoRes = this.gitManager.isGitRepo();
        const isRepo = typeof isRepoRes === 'boolean' ? isRepoRes : isRepoRes.data;
        if (!isRepo) {
            return { success: false, error: 'Not a Git repository.' };
        }
        
        const userRepoRes = this.gitManager.getRepoPathFromRemote('origin');
        const userRepoPath = typeof userRepoRes === 'string' ? userRepoRes : (userRepoRes && userRepoRes.data ? userRepoRes.data : '');
        if (!userRepoPath) {
            return {
                success: false,
                error: 'No GitHub remote found in this repository.\n  To use GitHub Actions Explorer, add a remote with:\n  git remote add origin https://github.com/owner/repo.git'
            };
        }

        const [owner, repo] = userRepoPath.replace(/\.git$/, '').split('/');
        if (!owner || !repo) {
            return { success: false, error: 'Invalid GitHub repository format.' };
        }
        return { success: true, data: { owner, repo } };
    }

    /**
     * Fetch all GitHub Actions workflows for the current repository.
     * @returns {Promise<{ success: boolean, data?: { workflows: Array<Object>, total: number }, workflows?: Array<Object>, total?: number, error?: string }>} List of workflows with status
     */
    async getWorkflows() {
        const ctxRes = await this.getRepoContext();
        if (!ctxRes.success) return { success: false, error: ctxRes.error };
        const ctx = ctxRes.data;
        if (!this.token) return { success: false, error: 'GitHub Token (GH_TOKEN) not found.' };

        try {
            const res = await axios.get(`${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/workflows`, { headers: this.headers });
            const workflows = res.data.workflows;

            // Fetch latest run for each workflow to get status
            const workflowsWithStatus = await Promise.all(workflows.map(async (wf) => {
                try {
                    const runsRes = await axios.get(`${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/workflows/${wf.id}/runs`, {
                        headers: this.headers,
                        params: { per_page: 1 }
                    });
                    const latestRun = runsRes.data.workflow_runs[0];
                    return {
                        ...wf,
                        latest_status: latestRun ? latestRun.status : null,
                        latest_conclusion: latestRun ? latestRun.conclusion : null
                    };
                } catch (e) {
                    return { ...wf, latest_status: null, latest_conclusion: null };
                }
            }));

            const payload = { workflows: workflowsWithStatus, total: res.data.total_count };
            return { success: true, data: payload, workflows: workflowsWithStatus, total: res.data.total_count };
        } catch (e) {
            return { success: false, error: e.response?.data?.message || e.message };
        }
    }

    /**
     * Fetch recent workflow runs.
     * @param {number|string|null} [workflowId=null] - Specific workflow ID filter
     * @param {number} [limit=10] - Maximum number of runs to return
     * @returns {Promise<{ success: boolean, data?: Array<Object>, runs?: Array<Object>, error?: string }>} Workflow runs list
     */
    async getWorkflowRuns(workflowId = null, limit = 10) {
        const ctxRes = await this.getRepoContext();
        if (!ctxRes.success) return { success: false, error: ctxRes.error };
        const ctx = ctxRes.data;

        try {
            const url = workflowId
                ? `${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/workflows/${workflowId}/runs`
                : `${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/runs`;

            const res = await axios.get(url, {
                headers: this.headers,
                params: { per_page: limit }
            });
            const runs = res.data.workflow_runs;
            return { success: true, data: runs, runs };
        } catch (e) {
            return { success: false, error: e.response?.data?.message || e.message };
        }
    }

    /**
     * Fetch execution jobs for a specific workflow run.
     * @param {number|string} runId - Workflow run ID
     * @returns {Promise<{ success: boolean, data?: Array<Object>, jobs?: Array<Object>, error?: string }>} Jobs list
     */
    async getRunJobs(runId) {
        const ctxRes = await this.getRepoContext();
        if (!ctxRes.success) return { success: false, error: ctxRes.error };
        const ctx = ctxRes.data;

        try {
            const res = await axios.get(`${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/runs/${runId}/jobs`, { headers: this.headers });
            const jobs = res.data.jobs;
            return { success: true, data: jobs, jobs };
        } catch (e) {
            return { success: false, error: e.response?.data?.message || e.message };
        }
    }

    /**
     * Trigger rerun for a specific workflow run.
     * @param {number|string} runId - Workflow run ID to rerun
     * @returns {Promise<{ success: boolean, data?: { rerun: boolean }, error?: string }>} Operation status
     */
    async rerunWorkflowRun(runId) {
        const ctxRes = await this.getRepoContext();
        if (!ctxRes.success) return { success: false, error: ctxRes.error };
        const ctx = ctxRes.data;

        try {
            await axios.post(`${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/runs/${runId}/rerun`, {}, { headers: this.headers });
            return { success: true, data: { rerun: true } };
        } catch (e) {
            return { success: false, error: e.response?.data?.message || e.message };
        }
    }
}

module.exports = ActionsManager;
