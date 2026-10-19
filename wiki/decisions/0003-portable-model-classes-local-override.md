---
title: "0003: Portable model classes with a gitignored local override"
type: decision
summary: Loops name phase tiers, not models; shared defaults say Auto, and personal stacks live in a gitignored MODEL_CLASSES.local.md.
status: active
created: 2026-10-19
updated: 2026-10-19
last_verified: 2026-10-19
sources: ["commit 9777a69", "commit 7d7ae46", "commit 3684485", "commit 1ca7214", CHANGELOG.md, adapters/MODEL_CLASSES.md, test/model-classes.test.js]
tags: [adr, models]
---

# 0003: Portable model classes with a gitignored local override

Each loop phase declares a `model_class` (`high-reasoning`, `workhorse`, `cheap-fast`). The shared mapping in `adapters/MODEL_CLASSES.md` defaults every class to Cursor Auto; anyone's personal stack goes in `adapters/MODEL_CLASSES.local.md`, which is gitignored and wins when present.

## Context

- The first versions hard-coded one person's stack: a single model family with reasoning tiers (commit `9777a69`, 2026-07-10), then a revision a day later after reading Cursor's pricing pages (commit `7d7ae46`).
- That made the public pack carry private host names, bans and routing. Other users could not adopt it as-is.

## Decision

- 0.1.2 (commit `3684485`, 2026-07-14): shared docs keep only portable defaults; personal routing moves to the local override. `adapters/MODEL_CLASSES.local.example.md` shows the recipe.
- Contract tests (commit `1ca7214`) check the resolution order and fail if shared docs name banned private harnesses (`test/model-classes.test.js`).
- On Claude Code the classes are advisory, because a session often can't switch models mid-run (`adapters/MODEL_CLASSES.md`).

## Alternatives considered

- **One recommended stack in the shared file:** simple, but it went stale within a day and leaked personal setup.
- **No classes at all:** loses the signal that planning and attack phases deserve the strongest model.

## Status

Active. Don't put model names you personally use into README, `INSTALL*`, the dispatcher or any `loop.md`.

## Related

- [[model-classes]] · [[gotchas]]
