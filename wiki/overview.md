---
title: Overview
type: overview
summary: What loops is, who uses it, how it is installed, and where the canonical files live.
status: active
created: 2026-10-19
updated: 2026-10-19
last_verified: 2026-10-19
sources: [README.md, AGENTS.md, CHANGELOG.md, package.json, .github/workflows/ci.yml, adapters/install-global.js]
tags: [overview]
---

# loops

Portable workflow playbooks for AI coding agents in Cursor and Claude Code. A user says "use the loops" (or just describes the job) and the dispatcher picks one of eleven loops and follows it step by step (`README.md`).

## What and why

- **What:** Markdown + YAML loop definitions (`loops/<name>/loop.md`, `loop.yaml`), a router (`dispatcher/`), review personas (`personas/`), a quality contract (`contracts/self-correcting.md`), and two dependency-free Node adapters that turn the canonical files into Cursor rules and Claude Code skills (`adapters/emit.js`, `adapters/install-global.js`).
- **Why:** agents follow a known process (plan, test, review, prove) instead of improvising, and a Judge checks real command output before work is called done ([[self-correcting-contract]]).
- **Version:** 0.1.4 (`package.json`, `CHANGELOG.md`). `self-improve` was added after 0.1.4 without a version bump (commit `adf9b47`, 2026-08-29).
- **Companion:** [[my-robot-companion]] installs the foundation (verify gate, memory files, search, wiki) that loops assumes.

## People and roles

- **Nicholas** (GitHub `noidsoup`) — author and only maintainer. Public MIT repo; no outside contributors so far (`gh pr list`: PRs #1–#3 are his).
- **Agents** — Cursor (retired on this machine 2026-10-02) and Claude Code sessions in every project read the loops through the global install (commit `cc18520`).

## Where it runs

There is no server. "Running" means the files are installed where agents read them.

| Environment | Location | Comes from |
|---|---|---|
| Source | `github.com/noidsoup/loops` (public), checkout at `~/Code/loops` | `main` |
| Global install | `~/.loops` symlink → the checkout; `~/.claude/rules/loops.md`, `~/.claude/skills/loops-*/`, `~/.cursor/rules/loops-*.mdc`, `~/.cursor/skills/loops-*/` | `npm run install:global` (`adapters/install-global.js`) |
| Per-project install | `<project>/.loops/` clone + emitted files in the project root | [[per-project-install]] |
| CI | GitHub Actions, Node 20, `npm test` on push to `main` and on PRs | `.github/workflows/ci.yml` |

Because `~/.loops` points at the working checkout, whatever branch is checked out in `~/Code/loops` is live for every project ([[gotchas]]).

## Key links

- Install, catalog, what to say: `README.md`
- Agent rules and invariants: `AGENTS.md` (loaded by Claude Code via `.claude/CLAUDE.md`)
- Release notes: `CHANGELOG.md`
- Catalog: [[loop-catalog]] · router: [[loops-dispatcher]] · build and install: [[adapters-emit-and-install-global]] · checks: [[ci-and-verify-gate]]

## Related

- [[index]] · [[gotchas]] · [[documentation-in-repo]]
