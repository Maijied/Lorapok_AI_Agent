## 2026-07-23T02:42:44+06:00
<USER_REQUEST>
You are Explorer M4 (CI/CD & Packaging). Your working directory is /home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/explorer_m4_cicd.
Read /home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/orchestrator/PROJECT.md and plan.md.
Your mission:
1. Inspect .github/workflows/ci.yml and .github/workflows/release.yml. Determine exact upgrades needed for:
   - Matrix build/test across Node 18, 20, 22 on ubuntu-latest, macos-latest, windows-latest.
   - ESLint lint check step.
   - Docker build validation step.
   - release-please integration (Google release-please action) using conventional commits, CHANGELOG generation, npm publish with --provenance via OIDC (permissions: id-token: write, contents: write), and Docker image tarball asset upload.
2. Inspect package.json and bin/lorapok.js:
   - Verify metadata: name, version, description, author, license, repository, homepage, bugs, keywords, engines (node: ">=18.0.0"), publishConfig (access: "public"), files whitelist (bin/, commands/, lib/, services/, index.js, server.js, README.md, LICENSE), scripts (prepublishOnly: "npm test", lint: "eslint .").
   - Verify bin/lorapok.js shebang #!/usr/bin/env node and executable permissions.
3. Deliver your findings and action plan in /home/maizied/Desktop/Personal_Projects/lorapok_ai_agent/.agents/explorer_m4_cicd/handoff.md and send a message back to the orchestrator.
</USER_REQUEST>
