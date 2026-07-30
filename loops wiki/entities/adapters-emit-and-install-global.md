---
title: adapters emit and install-global
type: entity
created: 2026-07-30
updated: 2026-07-30
tags: [emit, install, node, adapters]
aliases: [emit, install-global]
status: active
---

# adapters emit and install-global

## What it is

Two Node.js adapters that turn canonical loop definitions into platform-specific install artifacts:

- **`adapters/emit.js`** — reads `loops/<name>/loop.md` + `loop.yaml`, writes namespaced `loops-*` Cursor rules and Claude skills.
- **`adapters/install-global.js`** — symlinks global install to `~/.loops`, `~/.cursor/skills/loops-*`, `~/.cursor/rules/loops-*`, and Claude equivalents.

## How it's used in this project

```bash
node adapters/emit.js              # all loops
node adapters/emit.js plan-and-implement   # one loop
node adapters/emit.js --check      # CI: fail if emit would change files
node adapters/install-global.js
node adapters/install-global.js --uninstall
```

When this repo is cloned as **`.loops/`** inside another project, emit writes into the **parent project root** (not inside `.loops/`).

## Key details

- **Prefix:** all emitted skills/rules are `loops-*` to avoid collisions with other skill packs.
- **Outputs:** `.cursor/rules/loops-<loop>.mdc`, `.claude/skills/loops-<loop>/SKILL.md` + `loop.yaml`.
- **Awareness rules:** `INSTALL.mdc` → `.cursor/rules/loops.mdc`; `INSTALL-CLAUDE.md` → `.claude/rules/loops.md`.
- **npm scripts:** `npm run emit`, `npm run emit:check`, `npm run install:global`, `npm test` (includes emit check).
- **Valid `model_class` values:** `high-reasoning`, `workhorse`, `cheap-fast` (validated at emit time).

## Related

- [[loops-dispatcher]]
- [[model-classes]]
- [[global-install-and-update]]
- [[per-project-install]]
