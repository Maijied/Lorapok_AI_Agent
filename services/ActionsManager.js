const axios = require('axios');
const chalk = require('chalk');

class ActionsManager {
    constructor(gitManager) {
        this.gitManager = gitManager;
        this.baseUrl = 'https://api.github.com';
    }

    get token() {
        return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    }

    get headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    async getRepoContext() {
        if (!this.gitManager.isGitRepo()) return null;
        // reuse gitManager's parsing logic
        // origin: https://github.com/user/repo.git or git@github.com:user/repo.git
        const userRepo = this.gitManager.getRepoPathFromRemote('origin');
        if (!userRepo) return null;

        const [owner, repo] = userRepo.replace('.git', '').split('/');
        return { owner, repo };
    }

    async getWorkflows() {
        const ctx = await this.getRepoContext();
        if (!ctx) return { success: false, error: 'Could not determine GitHub repository context.' };
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

            return { success: true, workflows: workflowsWithStatus, total: res.data.total_count };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async getWorkflowRuns(workflowId = null, limit = 10) {
        const ctx = await this.getRepoContext();
        if (!ctx) return { success: false, error: 'Could not determine GitHub repository context.' };

        try {
            const url = workflowId
                ? `${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/workflows/${workflowId}/runs`
                : `${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/runs`;

            const res = await axios.get(url, {
                headers: this.headers,
                params: { per_page: limit }
            });
            return { success: true, runs: res.data.workflow_runs };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async getRunJobs(runId) {
        const ctx = await this.getRepoContext();
        if (!ctx) return { success: false, error: 'Could not determine GitHub repository context.' };

        try {
            const res = await axios.get(`${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/runs/${runId}/jobs`, { headers: this.headers });
            return { success: true, jobs: res.data.jobs };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async rerunWorkflowRun(runId) {
        const ctx = await this.getRepoContext();
        if (!ctx) return { success: false, error: 'Could not determine GitHub repository context.' };

        try {
            await axios.post(`${this.baseUrl}/repos/${ctx.owner}/${ctx.repo}/actions/runs/${runId}/rerun`, {}, { headers: this.headers });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.response?.data?.message || e.message };
        }
    }
}

module.exports = ActionsManager;
