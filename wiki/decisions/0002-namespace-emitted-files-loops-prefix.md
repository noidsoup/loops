---
title: "0002: Namespace every emitted file as loops-*"
type: decision
summary: All emitted rules and skills are prefixed loops-*, and install ships a rule saying loops-* wins over same-name skills.
status: active
created: 2026-10-19
updated: 2026-10-19
last_verified: 2026-10-19
sources: ["commit 9be8d88", "commit b942bff", "commit 3106f9e", CHANGELOG.md, INSTALL-RESOLUTION.mdc, adapters/install-global.js]
tags: [adr, emit, install]
---

# 0002: Namespace every emitted file as loops-*

Every rule and skill that loops emits or installs is named `loops-<name>`, and the global install also ships a disambiguation rule so agents pick the `loops-*` version when another pack has a skill with the same intent.

## Context

- Other skill packs on the same machine ship skills called `plan-and-implement`, `tdd`, `sar`, `use-the-loop`. Those fired on bare names because nothing told the agent which pack wins (commit `b942bff`).
- Before 0.1.1, emit did not always prefix, including when loops was cloned into a project as `.loops/` (commit `9be8d88`, `CHANGELOG.md` 0.1.1).

## Decision

- `adapters/emit.js` always writes `loops-*` names (`.cursor/rules/loops-<name>.mdc`, `.claude/skills/loops-<name>/`).
- Installed skill descriptions start with `[loops]` so Claude's skill matcher sees the pack name. A bug had made this prefix dead code; fixed in commit `3106f9e`.
- `adapters/install-global.js` ships `INSTALL-RESOLUTION.mdc` as `~/.cursor/rules/loops-resolution.mdc` and `~/.claude/rules/loops-resolution.md` on every install run.

## Alternatives considered

- **Plain names, rely on the agent to choose:** that was the state that caused the collisions.
- **Uninstall the other pack:** not portable; loops can't assume what else a user has installed.

## Status

Active. Install only replaces files it manages (`isManagedTarget` in `install-global.js`), so a foreign file with a `loops-` name is left alone.

## Related

- [[adapters-emit-and-install-global]] · [[gotchas]]
