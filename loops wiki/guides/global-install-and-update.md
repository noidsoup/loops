---
title: Global install and update
type: guide
created: 2026-07-30
updated: 2026-07-30
tags: [install, global, onboarding]
status: active
---

# Global install and update

Install loops once for **all** Cursor and Claude Code projects on a machine.

## Prerequisites

- Node.js **18+**
- Git
- Network access to clone `https://github.com/noidsoup/loops.git`

## Steps

### First install

```bash
git clone https://github.com/noidsoup/loops.git ~/Code/loops
cd ~/Code/loops
node adapters/emit.js
node adapters/install-global.js
```

This creates `~/.loops` (symlink to clone), emits `loops-*` skills/rules globally, and installs awareness files.

### Verify

Open any project in Cursor or Claude Code and say:

> use the loops to add a hello world script

Expect [[loops-dispatcher]] to route to `plan-and-implement` or `use-the-loop`.

### Update loops

```bash
cd ~/.loops && git pull && node adapters/emit.js && node adapters/install-global.js
```

### Uninstall

```bash
cd ~/Code/loops   # or ~/.loops
node adapters/install-global.js --uninstall
```

### Optional model override

```bash
cp adapters/MODEL_CLASSES.local.example.md adapters/MODEL_CLASSES.local.md
```

Edit locally (gitignored). See [[model-classes]].

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Agent doesn't know loops | Check `~/.cursor/rules/loops.mdc` exists; re-run install-global |
| Stale loop behavior | `git pull` in `~/.loops`, re-emit |
| Skill name collision | loops always prefixes `loops-*` — see [[adapters-emit-and-install-global]] |
| Project-local `.loops/` | Per-project clone overrides global `LOOPS_ROOT` — see [[per-project-install]] |

## Related

- [[readme-project-overview]]
- [[per-project-install]]
- [[adapters-emit-and-install-global]]
