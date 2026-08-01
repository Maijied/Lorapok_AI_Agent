---
name: lorapok-website-build
description: Skill for maintaining and deploying apps/website frontend assets and static documentation.
---

# Lorapok Website Build Skill

## Location

Site assets live in **`apps/website/`** (moved from legacy `website/`).

## Tasks

- Update marketing / docs pages under `apps/website/`
- Keep version badges aligned with root `package.json`
- Prefer consuming model lists via REST + `@lorapok/sdk`, not hardcoded catalogs
- Preview locally per `apps/website/README.md` if present

## Do not

- Reference nonexistent `LorapokAiBuild/` paths
- Duplicate paid/usable filtering in the frontend — use `/api/models`
