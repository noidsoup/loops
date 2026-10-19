---
title: README — project overview (ingested)
type: source
summary: "Digest of README.md: install paths, what to say, workflow catalog, companion repo."
created: 2026-07-30
updated: 2026-10-19
last_verified: 2026-10-19
tags: [readme, install, catalog]
aliases: [readme]
sources: ["README.md"]
status: active
---

# README — project overview (ingested)

Compiled from repo **`README.md`** (v0.1.4). Playbooks for AI coding agents in Cursor and Claude Code — say **"use the loops"** and the agent picks a workflow.

## Key points

- **No extra app** — install once from GitHub, then invoke from any project.
- **Node.js 18+** required; primary commands: `node adapters/emit.js`, `node adapters/install-global.js`.
- **Global install** recommended: clone to `~/Code/loops`, emit, install-global → `~/.loops` symlink + `loops-*` skills/rules.
- **Eleven workflows** plus dispatcher (`self-improve` joined on 2026-08-29, commit `adf9b47`); users describe intent ("write tests for…") rather than naming loops.
- **Self-correcting QC** — Builder → Judge → Manager on producing loops (see [[self-correcting-contract]]).
- **Companion:** [my-robot](https://github.com/noidsoup/my-robot) bootstraps verify gate, memory, wiki, and symlinks loops (see [[my-robot-companion]]).

## Detailed notes

### Install (global)

```bash
git clone https://github.com/noidsoup/loops.git ~/Code/loops
cd ~/Code/loops
node adapters/emit.js
node adapters/install-global.js
```

Update: `cd ~/.loops && git pull && node adapters/emit.js && node adapters/install-global.js`

Uninstall: `node adapters/install-global.js --uninstall`

### What to say (examples)

| User says | Typical loop |
|-----------|--------------|
| "use the loops" | Dispatcher picks best fit |
| "build a new auth flow" | [[loop-catalog#plan-and-implement]] |
| "write tests for the parser" | `tdd` |
| "stress-test this design" | `sar` |
| "review this PR" | `adversarial-gate` |
| "reproduce this bug" | `reproduce-and-fix` |
| "upgrade Next to 15" | `migrate` |
| "explain this codebase" | `explain-codebase` |
| "remove the slop" / "de-ai-ify" | `de-ai-ify` |
| "improve the agent" / "self-improve" | `self-improve` |
| "swarm this" | `swarm` |

### Model stack

Default Cursor stays on **Auto**. Optional personal override: copy `adapters/MODEL_CLASSES.local.example.md` → `MODEL_CLASSES.local.md` (gitignored). Details: [[model-classes]].

### Per-project install

Optional `.loops/` clone for teammates — see [[per-project-install]].

## Entities mentioned

- [[loops-dispatcher]]
- [[adapters-emit-and-install-global]]
- [[model-classes]]
- [[my-robot-companion]]

## Concepts discussed

- [[loop-catalog]]
- [[self-correcting-contract]]

## Related

- [[global-install-and-update]]
- [[documentation-in-repo]]
- [[index]]
