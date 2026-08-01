'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { WorkspaceService } = require('../services/WorkspaceService');

describe('WorkspaceService', () => {
    let tmpHome;
    let tmpProject;
    let ws;

    beforeEach(() => {
        tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-home-'));
        tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-proj-'));
        ws = new WorkspaceService({ homeDir: tmpHome, legacyCandidates: [] });
    });

    afterEach(() => {
        fs.rmSync(tmpHome, { recursive: true, force: true });
        fs.rmSync(tmpProject, { recursive: true, force: true });
    });

    test('ensureHome creates schema and logs dir', () => {
        const home = ws.ensureHome();
        expect(fs.existsSync(path.join(home, '.schema.json'))).toBe(true);
        expect(fs.existsSync(path.join(home, 'logs'))).toBe(true);
        expect(ws.isHomeOnboarded()).toBe(true);
    });

    test('ensureProjectLorapok creates folder and gitignore entry', () => {
        const dir = ws.ensureProjectLorapok(tmpProject);
        expect(fs.existsSync(dir)).toBe(true);
        const gi = fs.readFileSync(path.join(tmpProject, '.gitignore'), 'utf8');
        expect(gi).toContain('.lorapok/');
    });

    test('runOnboarding creates project when asked', async () => {
        const result = await ws.runOnboarding({
            cwd: tmpProject,
            isTTY: true,
            askLegacy: async () => 'skip',
            askProject: async () => true
        });
        expect(result.project).toBe('created');
        expect(ws.hasProjectLorapok(tmpProject)).toBe(true);
    });
});
