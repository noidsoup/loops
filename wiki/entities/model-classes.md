---
title: model classes (MODEL_CLASSES)
type: entity
summary: high-reasoning / workhorse / cheap-fast phase tiers; shared defaults vs gitignored local override.
created: 2026-07-30
updated: 2026-10-19
last_verified: 2026-10-19
tags: [models, routing, cursor, claude]
aliases: [MODEL_CLASSES, model-classes]
status: active
sources: []
---

# model classes (MODEL_CLASSES)

## What it is

Portable mapping from loop **phase intent** to **which model tier** to use. Canonical defaults: `adapters/MODEL_CLASSES.md`. Personal overrides: gitignored `adapters/MODEL_CLASSES.local.md` (copy from `.local.example.md`).

## How it's used in this project

Each loop's `loop.yaml` declares `model_class` per phase. After [[loops-dispatcher]] routes, the chosen loop applies class behavior:

| Class | Intent |
|-------|--------|
| `high-reasoning` | Planning, specs, adversarial attack, deep review — prefer Task/subagent when available |
| `workhorse` | Implementation, edits, normal execution — main session |
| `cheap-fast` | Handoffs, summaries, commit messages — main session, terse |

**Resolution order:** `MODEL_CLASSES.local.md` wins if present; else `MODEL_CLASSES.md`.

## Key details

- **Cursor default:** Auto for all classes unless local override or user request specifies otherwise.
- **High-reasoning override:** dispatch via Task/subagent to a strong API-pool model when the phase needs deepest reasoning — announce spend in one line.
- **Claude Code:** classes are **advisory** — often cannot switch mid-session; note once and continue.
- **Dispatcher** classification may stay on current model; the **chosen loop** owns class behavior for its phases.
- **Personal stacks and bans** (specific vendors, host-specific routing) belong only in the gitignored `adapters/MODEL_CLASSES.local.md`. Shared docs must not name private harnesses; `test/model-classes.test.js` fails the build if they do (v0.1.2 scrub, `CHANGELOG.md`).

## Related

- [[self-correcting-contract]]
- [[loop-catalog]]
- [[adapters-emit-and-install-global]]
