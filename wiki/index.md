---
title: Index
type: overview
summary: Start here. Must-know facts, then one line per page.
status: active
created: 2026-07-30
updated: 2026-10-19
last_verified: 2026-10-19
sources: []
tags: [meta]
---

# loops wiki

## Must know

- `~/.loops` points at this checkout: whatever branch is checked out is live for every project on the machine. Risky work goes in a worktree.
- Edit `loops/<name>/loop.md` / `loop.yaml`, never the emitted `loops-*` files; run `npm run emit` and commit both.
- "Done" means `npm run verify` passed (drift check first); `npm test` alone can't catch emit drift.
- Public repo: no private model stacks or harness names in shared docs; tests enforce it.
- Personas are review lenses inside loops, never dispatcher options.

## Overview

- [[overview]] — what loops is, who uses it, where it is installed
- [[gotchas]] — known traps; check after a repeated failure

## Entities

- [[loops-dispatcher]] — the entry router: classifies intent and loads exactly one loop
- [[self-improve]] — the L6 harness-health conductor loop: observe, inventory, propose, tiered apply, prove
- [[adapters-emit-and-install-global]] — emit.js builds loops-* rules and skills; install-global.js links them into ~/
- [[model-classes]] — high-reasoning / workhorse / cheap-fast tiers; shared defaults vs local override
- [[ci-and-verify-gate]] — what `npm run verify` and CI check, and why the order matters
- [[lancedb-project-knowledge]] — offline LanceDB index over repo markdown; search and re-index
- [[my-robot-companion]] — sibling repo that bootstraps the foundation loops assumes

## Concepts

- [[loop-catalog]] — the eleven loops, when to use each, which are self-correcting
- [[loop-personas]] — the nine review personas and which loops use them
- [[self-correcting-contract]] — Builder, Judge, Manager with outside ground truth and a 3-revision stop

## Decisions

- [[0001-python-sidecar-lancedb-retrieval]] — semantic search runs as a Python LanceDB sidecar
- [[0002-namespace-emitted-files-loops-prefix]] — everything emitted is loops-*, and loops-* wins over same-name skills
- [[0003-portable-model-classes-local-override]] — phase tiers in shared docs; personal stacks in a gitignored file
- [[0004-builder-judge-manager-contract]] — producing loops separate building from judging and stop after 3 revisions
- [[0005-claude-code-entry-point-agents-md]] — `.claude/CLAUDE.md` imports AGENTS.md; root CLAUDE.md stays local

## Guides

- [[global-install-and-update]] — install for every project on a machine; update, uninstall, troubleshoot
- [[per-project-install]] — clone as `.loops/` inside one project to pin a version
- [[documentation-in-repo]] — which file holds what: README, AGENTS.md, docs/, memory files, this wiki

## Sources

- [[readme-project-overview]] — digest of README.md: install, what to say, catalog
- [[docs-ai-retrieval]] — digest of docs/ai-retrieval.md: sidecar vs vault recall vs platform retrieval
- [[session-memory-in-wiki]] — archived: how session memory files relate to the wiki

## Meta

- [[SCHEMA]] — how to write here · [[log]] — change history
