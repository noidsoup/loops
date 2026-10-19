---
title: "0005: Claude Code loads AGENTS.md through .claude/CLAUDE.md"
type: decision
summary: The tracked agent entry point is .claude/CLAUDE.md importing AGENTS.md; root CLAUDE.md stays local and untracked.
status: active
created: 2026-10-19
updated: 2026-10-19
last_verified: 2026-10-19
sources: ["commit cc18520", .claude/CLAUDE.md, .git/info/exclude, AGENTS.md]
tags: [adr, agents, claude-code]
---

# 0005: Claude Code loads AGENTS.md through .claude/CLAUDE.md

After Cursor was retired (2026-10-02), the repo's agent setup was moved so Claude Code actually loads it.

## Context

Commit `cc18520` (2026-10-10): Claude Code never read `.cursor/rules`, nothing imported `AGENTS.md`, and `AGENTS.md` was still an unfilled bootstrap stub. A root `CLAUDE.md` is rewritten by local tooling, so it can't be the tracked entry point.

## Decision

- `.claude/CLAUDE.md` contains `@../AGENTS.md`; root `/CLAUDE.md` is listed in `.git/info/exclude`.
- Repo rules moved to `.claude/rules/`: three always-on (`pre-task-retrieval`, `project-knowledge-lancedb`, `verify-before-done`) and one path-scoped (`llm-wiki`, on `wiki/**`).
- The emitted `.cursor/rules/loops-*.mdc` stay where they are; `adapters/emit.js` owns them.
- `.verify.sh` gained the emit drift check before `npm test` ([[ci-and-verify-gate]]).

## Alternatives considered

- **Root `CLAUDE.md` with the content:** overwritten locally.
- **Turn the rules into skills:** rules that must always apply would then load only on demand.

## Status

Active. Verified in the commit: `npm run verify` passed (149 node tests) and a fresh Claude Code session loaded `AGENTS.md`, the three rules and the 11 `loops-*` skills.

## Related

- [[documentation-in-repo]] · [[gotchas]]
