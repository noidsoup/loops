---
title: Loop catalog
type: concept
created: 2026-07-30
updated: 2026-07-30
tags: [loops, catalog, workflows]
aliases: [workflows, loop-catalog]
status: active
---

# Loop catalog

## Definition

The ten **workflow playbooks** plus the **dispatcher** meta-router. Canonical sources: `loops/<name>/loop.md` + `loop.yaml` under `LOOPS_ROOT` (`~/.loops` or project `.loops/`).

## Application here

| Loop | Use when the user wants to… | Self-correcting |
|------|----------------------------|-----------------|
| `plan-and-implement` | Design and build a feature, refactor, or non-trivial change | Yes |
| `tdd` | Drive change by tests; lock behavior with a suite | Yes |
| `sar` | Spec → attack with personas → repair; simplest correct | Yes |
| `adversarial-gate` | Pre-merge review on PR or branch (max 3 rounds) | Yes |
| `reproduce-and-fix` | Bug → minimal repro → failing test → fix → prove green | Yes |
| `migrate` | Framework or version upgrade with checklist and rollback | Yes |
| `explain-codebase` | Onboarding map of an unfamiliar repo | No |
| `de-ai-ify` | Polish AI-sounding code; minimal-diff cleanup | Yes |
| `swarm` | Full beginning-to-end ship pipeline (mega-loop) | Nested |
| `use-the-loop` | Smallest composition when intent is ambiguous | Meta |

**Dispatcher** (`dispatcher/loop.md`) is not in this table — it routes *to* these loops via [[loops-dispatcher]].

### Invocation

- Natural language: "write tests for the parser", "review this PR", "swarm this feature".
- Claude Code slash commands: `/loops-dispatcher`, `/loops-tdd`, etc.
- Cursor: awareness rule + emitted `loops-*` skills.

## Tradeoffs

- **Catalog vs custom:** loops are editable markdown — `node adapters/emit.js` after changes.
- **Swarm vs single loop:** swarm chains phases; higher cost, full pipeline.
- **use-the-loop:** safety valve for ambiguity; may chain 2 smaller loops.

## Related

- [[loops-dispatcher]]
- [[loop-personas]]
- [[self-correcting-contract]]
- [[readme-project-overview]]
