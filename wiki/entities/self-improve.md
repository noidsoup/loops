---
title: self-improve loop
type: entity
summary: "The L6 harness-health conductor loop: observe, inventory, propose, tiered apply, prove."
created: 2026-08-29
updated: 2026-08-29
last_verified: 2026-08-29
tags: [loops, self-improve, harness-health, conductor, L6]
aliases: [self-improve, self-improve-loop, L6]
sources: ["[[readme-project-overview]]"]
status: active
---

# self-improve loop

The **L6 conductor loop** for harness health. Canonical definition: `loops/self-improve/loop.md` + `loop.yaml` (v0.1.0). Its job: turn agent failures and audit evidence into **bounded** harness improvements — rules, skills, memory, and template — without bloating the stack or weakening verification.

## What it is

A playbook, not a replacement: it **routes** to `weekly-retro`, `audit-and-refine`, `autonomous-closeout`, and `mark-where-you-are`. It is explicitly **not** for shipping product features (route those to `plan-and-implement`).

## How it's used in this project

Runs via [[loops-dispatcher]] when the user asks to improve the agent stack, run a retro, audit harness health, or close the L6 self-correction loop. Triggers include "improve the agent", "self-improve", "harness health", "run weekly retro", "L6 loop".

**O-I-V-R-M pipeline** (Observe → Inventory → Propose → Refine → Memorize → Prove):

| Phase | Model class | Action |
|-------|-------------|--------|
| Observe | cheap-fast | Log failure signals via `bridge-log` (`verify_red`, `user_correction`, `rule_miss`, `skill_miss`, `retro_applied`) |
| Inventory | workhorse | Run `workflow-audit.sh` (report/failures) — deterministic, no model |
| Propose | high-reasoning | Load `weekly-retro` skill; ≤3 audit-cited proposals (prune / improve / evict) |
| Refine | workhorse | Tiered apply — T1 auto, T2 after retro yes, T3 always ask |
| Memorize | cheap-fast | One store per lesson (Honcho, AGENTS.md invariant, skill Pitfalls, my-robot template, session memory) |
| Prove | workhorse | `workflow-audit.sh failures` + `bash .verify.sh` + `harness-lint.sh` where applicable |

**Tiered autonomy:** T1 (session memory, LanceDB re-index, bridge-log) = auto; T2 (skill `## Pitfalls`, skill archive, memory eviction) = after retro yes; T3 (rules, AGENTS.md invariants, template, new skills) = **always ask**. Rules are never pruned (protected list).

## Key details

- Consumes `audit_report`, `bridge_events`; produces `proposals`, `applied_changes`, `handoff`.
- Measurable grep-able targets: `verify_red`/month trending down, zero-hit skills down, MEMORY.md <80%, repeated `user_correction` in 14d → 0.
- Related skills: `weekly-retro`, `autonomous-closeout`, `closeout-learning-review`.
- Failure handling: do not weaken tests to go green; Tier 3 requires explicit user approval.

## Related

- [[loop-catalog]]
- [[loops-dispatcher]]
- [[self-correcting-contract]]
- [[model-classes]]
