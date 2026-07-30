---
title: Loop personas
type: concept
created: 2026-07-30
updated: 2026-07-30
tags: [personas, review, adversarial]
aliases: [personas]
status: active
---

# Loop personas

## Definition

**Review lenses** — short role prompts the agent adopts for a step inside a loop. Canonical files: `LOOPS_ROOT/personas/<name>.md`. Personas are **not** top-level dispatcher options.

## Application here

### Catalog

| Persona | Lens |
|---------|------|
| `skeptic` | Challenge problem statement and assumptions |
| `security-auditor` | Trust boundaries, injection, authn/z, secrets |
| `simplicity-advocate` | Removable complexity; simplest correct shape |
| `perf-critic` | Hot paths, algorithmic waste, scale |
| `regression-hunter` | Breakage for callers, migrations, behavior changes |
| `edge-case-analyst` | Boundaries, empty/null, concurrency, malformed input |
| `a11y-advocate` | Keyboard, focus, semantics, screen readers |
| `api-contract-guardian` | Breaking changes, versioning, schema drift |
| `dx-critic` | Errors, docs, onboarding friction, confusing APIs |

### Used by (examples)

| Loop | Persona usage |
|------|---------------|
| `sar` | Spec as skeptic; attack rotates security/simplicity/perf; judge bias simplicity |
| `adversarial-gate` | Rounds: security → regression → edge-case; swap others when warranted |
| `plan-and-implement` | Spec: simplicity + dx; Judge: regression-hunter |
| `tdd` / `reproduce-and-fix` | Red/repro personas; Prove: regression-hunter |
| `de-ai-ify` | Scan: simplicity-advocate; verify: regression-hunter |
| `migrate` | Inventory: regression-hunter; plan: api-contract-guardian |

**Contract:** `sar` and `adversarial-gate` must **Read** the persona file before adopting that lens — do not improvise from the name alone.

## Tradeoffs

- **Pro:** Structured adversarial review without a separate harness.
- **Con:** Personas are frames, not execution ground truth — Judge still needs command output for code.

## Related

- [[loops-dispatcher]]
- [[loop-catalog]]
- [[self-correcting-contract]]
