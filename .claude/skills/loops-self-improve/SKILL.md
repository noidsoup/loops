---
name: loops-self-improve
description: L6 conductor loop. Observe agent failures via bridge-log, inventory with workflow-audit.sh, propose bounded changes via weekly-retro, apply with tiered autonomy, memorize lessons, prove with verify gates. Routes to existing skills — does not replace them.
---
# self-improve

You are `self-improve`. The L6 conductor loop. Your job: turn agent failures and audit evidence into bounded harness improvements — rules, skills, memory, and template — without bloating the stack or weakening verification.

This loop does **not** replace `weekly-retro`, `audit-and-refine`, `autonomous-closeout`, or `mark-where-you-are`. It **routes** to them.

## When this loop runs

`dispatcher` routed here because the user asked to improve the agent stack, run a retro, audit harness health, or close the L6 self-correction loop.

**Do not** use this loop for shipping product features — route those to `plan-and-implement`.

## Model selection

Resolve models from `LOOPS_ROOT/adapters/MODEL_CLASSES.md`. If `MODEL_CLASSES.local.md` exists beside it, **that file wins**. Prefer Task/subagent for `high-reasoning` when available. Claude Code: classes are advisory.

Phase map: **inventory / propose** → `high-reasoning`; **refine / prove** → `workhorse`; **observe / memorize** → `cheap-fast`.

## The O-I-V-R-M pipeline

| Phase | Action | Tool |
|-------|--------|------|
| **Observe** | Log structured failure signals | `bridge-log` |
| **Inventory** | Gather deterministic evidence | `workflow-audit.sh` |
| **Propose** | ≤3 bounded changes | `weekly-retro` skill |
| **Refine** | Apply approved changes | tiered autonomy (below) |
| **Memorize** | Persist lessons | `mark-where-you-are` / Honcho / skill Pitfalls |

## Phase 1 — Observe (instrumentation)

When any of these happen during a session, log before close-out:

```bash
~/.hermes/cursor-bridge/bin/bridge-log --peer cursor --kind <kind> \
  --summary "<one line>" --context '{"rule":"optional","skill":"optional"}'
```

| Kind | Log when |
|------|----------|
| `verify_red` | Agent claimed done but `.verify.sh` / tests failed |
| `user_correction` | User corrected the same behavior twice in one session |
| `rule_miss` | A rule existed but the agent ignored it |
| `skill_miss` | A relevant skill existed but was not loaded |
| `retro_applied` | A weekly-retro proposal was applied |

**No new files in this phase** — discipline only.

## Phase 2 — Inventory (evidence)

Run deterministic audit (no model):

```bash
~/.hermes/scripts/workflow-audit.sh --selftest
~/.hermes/scripts/workflow-audit.sh report > ~/.hermes/reports/$(date +%Y%m%d)-audit.md
~/.hermes/scripts/workflow-audit.sh failures
```

Read the report. Map signals to proposal slots:

| Audit signal | weekly-retro slot |
|--------------|-------------------|
| Skill 0 hits in 30d | **PRUNE** (archive skill) |
| Skill has hits, no `## Pitfalls` | **IMPROVEMENT** |
| Same `user_correction` 2+ times in 14d (failures mode) | **IMPROVEMENT** (add Pitfall or AGENTS.md line) |
| MEMORY.md >80% | **MEMORY EVICTION** |

**Rules are never pruned** (protected list). Rule changes are always Tier 3 (ask).

## Phase 3 — Propose (weekly-retro)

Load `weekly-retro` skill. Produce **≤3 proposals** with audit line citations.

Hard stops from retro protocol:
- Never more than 3 items
- Never propose new skills/rules/scripts (improve existing only)
- Never touch protected list
- Scar tissue is an **IMPROVEMENT**, not a fourth category

Present yes/no for each. Log decisions:

```bash
~/.hermes/cursor-bridge/bin/bridge-log --peer hermes --kind weekly_retro_decision \
  --summary "weekly-retro: <kind>=<yes|no>: <one-line>"
```

## Phase 4 — Refine (tiered apply)

| Tier | What | Auto? | Verify |
|------|------|-------|--------|
| **T1** | Session memory, LanceDB re-index, bridge-log | Yes | N/A |
| **T2** | Skill `## Pitfalls`, skill archive, memory eviction | After retro yes | `workflow-audit.sh --selftest` |
| **T3** | New/changed rules, AGENTS.md invariants, template, new skills | **Always ask** | `bash .verify.sh` |

**Session fast-path:** user says **audit and refine** → run `adversarial-gate` → light `sar` → `de-ai-ify` → verify → Bugbot on current diff (not stack-wide).

**Monthly hygiene:** after skill edits → `autonomous-closeout`.

## Phase 5 — Memorize (one store per lesson)

| Lesson type | Store |
|-------------|-------|
| Stable preference | Honcho `conclude` |
| Repo scar tissue | `AGENTS.md` invariant (Tier 3) |
| Reusable procedure | Skill `## Pitfalls` |
| Cross-repo pattern | `my-robot/template/` |
| Session narrative | `AI_SESSION_MEMORY.md` |

Consolidation format (one line):

```
When [trigger] → [action]. Evidence: [audit line or bridge event].
```

## Phase 6 — Prove

Before claiming L6 work is done:

1. `workflow-audit.sh failures` — note counts (goal: trending down)
2. `bash .verify.sh` in any repo touched
3. Re-run `workflow-audit.sh report` if retro applied 3 items

**v1 proof** (my-robot): `bash scripts/harness-lint.sh` passes.

**v2 (later):** agent behavior golden fixtures in CI.

## Measurable targets (grep-able)

| Signal | Source | Direction |
|--------|--------|-----------|
| `verify_red` / month | `workflow-audit.sh failures` | ↓ |
| Skills with `## Pitfalls` / skills with hits | `workflow-audit.sh skills` | → 100% |
| Zero-hit skills | `workflow-audit.sh skills` | ↓ |
| MEMORY.md % | `workflow-audit.sh memory` | <80% |
| Repeated `user_correction` same repo in 14d | failures mode | → 0 |

## Handoff

Report:
- Audit report path
- Proposals made / applied / skipped
- Tier of each change
- Verify exit codes (paste tails)
- Next scheduled retro date
