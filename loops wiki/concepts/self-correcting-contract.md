---
title: Self-correcting contract
type: concept
created: 2026-07-30
updated: 2026-07-30
tags: [quality, builder-judge-manager, contract]
aliases: [self-correcting, BJM]
status: active
---

# Self-correcting contract

## Definition

A shared quality pattern for loops that produce shippable work. Canonical spec: `contracts/self-correcting.md`. Loops with `self_correcting: true` in `loop.yaml` adopt Builder → Judge → Manager roles with structured handoffs and **ground truth outside the Builder's reasoning**.

## Application here

| Role | Job | Does not |
|------|-----|----------|
| **Builder** | Produce deliverable; emit structured handoff | Mark task complete |
| **Judge** | Evaluate against standard + independent ground truth | Rewrite deliverable |
| **Manager** | Route DELIVER / REVISE / ESCALATE; own stop conditions | Improvise new quality bar mid-loop |

**Loops using it (v0.1.4):** `plan-and-implement`, `tdd`, `reproduce-and-fix`, `sar`, `adversarial-gate`, `de-ai-ify`, `migrate`.

**Skipped for:** typos, pure Q&A, map-only work (`explain-codebase`).

### Ground truth examples

| Task shape | Ground truth |
|------------|--------------|
| Code change | Test/lint output; diff vs task; tests not weakened |
| Design | Written acceptance checks from spec |
| Content polish | Brief + taxonomy; suite still green |
| Upgrade | Checklist + verify commands + rollback ref |

### Stop conditions (defaults)

- `self_correcting_max_revisions: 3` — after 3rd failed Judge verdict, **ESCALATE** to user.
- No "mostly passing" — all checklist items must PASS.

## Tradeoffs

- **Pro:** Separates producing from judging; prevents same-context rationalization.
- **Pro:** Hard stop avoids infinite revise loops.
- **Con:** More phases and tokens on non-trivial work — skip for trivial one-liners per loop guidance.

## Related

- [[model-classes]]
- [[loop-catalog]]
- [[loop-personas]]
