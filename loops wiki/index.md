---
title: Wiki Index
type: index
created: 2026-07-30
updated: 2026-07-30
---

# Loops Wiki

> Content catalog. The LLM reads this first when answering queries. Conventions: [[SCHEMA]].

## Session memories

| Page | Purpose |
|------|---------|
| [[session-memory-in-wiki]] | How `AI_SESSION_MEMORY.md` and `MEMORY.md` relate to the vault. |

## Sources

| Page | Summary | Date |
|------|---------|------|
| [[readme-project-overview]] | Install paths, workflow catalog, self-correcting QC, my-robot companion | 2026-07-30 |
| [[docs-ai-retrieval]] | LanceDB sidecar vs vault recall vs platform retrieval | 2026-07-30 |

## Entities

| Page | What it is |
|------|------------|
| [[loops-dispatcher]] | Entry router: classifies intent and loads one loop. |
| [[adapters-emit-and-install-global]] | `emit.js` + `install-global.js` — platform adapters. |
| [[model-classes]] | `high-reasoning` / `workhorse` / `cheap-fast` model routing. |
| [[lancedb-project-knowledge]] | Local semantic index over repo markdown and rules. |
| [[my-robot-companion]] | Sibling repo: bootstrap foundation loops runs on. |

## Concepts

| Page | Summary |
|------|---------|
| [[self-correcting-contract]] | Builder → Judge → Manager with ground truth and hard stops. |
| [[loop-catalog]] | All ten workflows and when to use each. |
| [[loop-personas]] | Review lenses used inside loops (not dispatcher options). |

## Decisions

| # | Decision | Status |
|---|----------|--------|
| [[0001-python-sidecar-lancedb-retrieval]] | Python sidecar LanceDB for per-repo semantic search | Accepted |

## Guides

| Page | Purpose |
|------|---------|
| [[global-install-and-update]] | Clone, emit, install globally; update and uninstall. |
| [[per-project-install]] | `.loops/` clone for pinned or team-shared installs. |
| [[documentation-in-repo]] | `README`, `docs/`, memory files vs this vault. |
