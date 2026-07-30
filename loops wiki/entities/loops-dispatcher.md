---
title: loops dispatcher
type: entity
created: 2026-07-30
updated: 2026-07-30
tags: [dispatcher, routing, entry-point]
aliases: [dispatcher]
status: active
---

# loops dispatcher

## What it is

The **entry router** for loops. Canonical definition: `dispatcher/loop.md`. When a user says "use the loops" or describes a task without naming a workflow, the dispatcher classifies intent and loads exactly one loop from the catalog.

## How it's used in this project

- **Does not** write code, edit files, or plan — only routes.
- Resolves `LOOPS_ROOT` from project `.loops/` or global `~/.loops`.
- Classification stays on the **current session model**; the chosen loop owns `model_class` for its phases.
- Output contract: `Loop picked: <name>`, `Why: <one sentence>`, then execute that loop's `loop.md`.

## Key details

| Signal | Routes to |
|--------|-----------|
| "swarm" / "full pipeline" | `swarm` |
| "de-ai-ify" / "remove the slop" | `de-ai-ify` |
| "build" / "implement" / "add" | `plan-and-implement` |
| "write tests" / "TDD" | `tdd` |
| "stress-test" / "attack" / "sar" | `sar` |
| "review PR" / "pre-merge" | `adversarial-gate` |
| "reproduce" / "this is broken" | `reproduce-and-fix` |
| "upgrade" / "migrate" | `migrate` |
| "explain codebase" | `explain-codebase` |
| Ambiguous / "use the loops" | `use-the-loop` |

**Personas** (`LOOPS_ROOT/personas/`) are review lenses inside `sar` / `adversarial-gate` — **not** dispatcher options.

Emitted as `loops-dispatcher` skill/rule via [[adapters-emit-and-install-global]].

## Related

- [[loop-catalog]]
- [[loop-personas]]
- [[readme-project-overview]]
