# Self-correcting contract

Shared Builder → Judge → Manager rules for loops that produce work the user might ship. Read this when a loop’s `loop.md` says it adopts the contract (or when `loop.yaml` has `self_correcting: true`).

This is architecture, not ceremony. Skip it for typos, pure Q&A, and map-only work (`explain-codebase`).

## Why

Same-context “review what you just wrote” tends to defend the draft. A real loop separates **producing** from **judging**, gives the Judge **ground truth outside the Builder’s reasoning**, and gives the Manager a **hard stop** so the loop cannot run forever.

## Three roles

| Role | Job | Does not |
|---|---|---|
| **Builder** | Produce the deliverable with creative latitude. Emit a structured handoff. | Decide that the work is finished. |
| **Judge** | Evaluate the handoff against a written standard **and** independent ground truth. Emit a structured verdict. | Rewrite the deliverable (except tiny typos if the loop allows). |
| **Manager** | Read the verdict (not the raw draft). Route: deliver, revise, or escalate. Own the stop conditions. | Improvise a new quality bar mid-loop. |

Map these onto phases however the loop names them. The roles must still be distinct *passes* (different prompt / persona / ideally different `model_class` or subagent).

## Structured handoffs

### Builder output

```text
Deliverable: <the actual output, or paths + summary of the change>
Evidence: <commands run and key output, or "n/a — design-only">
Confidence: high | medium | low
Known uncertainties: <explicit list, or "none">
Assumptions made: <explicit list, or "none">
```

### Judge verdict

```text
Verdict: PASS | FAIL | NEEDS_REVISION
Checked against: <brief, acceptance list, test suite, taxonomy, checklist, …>
Ground truth used: <what independent reference was checked — not just “reread the draft”>
Specific issues: <exact problems; empty if PASS>
Per-check: <optional; one PASS/FAIL line per checklist item>
Confidence in this verdict: high | medium | low
```

### Manager action

```text
Action: DELIVER | REVISE | ESCALATE
Revision: <n> of <max_revisions>
Reason: <one sentence>
Feedback to Builder: <Judge’s specific issues, verbatim or tightened — not vague “try again”>
```

**Triggers:** the Builder never marks the task complete. Only Manager `DELIVER` (or user interrupt / escalate) ends the loop’s produce cycle.

**Failure path:** every non-PASS verdict has a next step (REVISE with feedback, or ESCALATE). Silent continue is forbidden.

## Ground truth (required for Judge)

If you cannot name the Judge’s ground truth, you do not have a self-correcting loop yet — you have a rephrasing loop.

| Task shape | Ground truth examples |
|---|---|
| Code change | Test/lint/typecheck **command output**; diff vs stated task; “tests not edited just to pass” |
| Design / candidates | Written acceptance checks from the spec |
| Content / polish | Original brief + taxonomy/checklist; suite still green after edits |
| Upgrade | Checklist steps + verification commands + rollback ref |

Prefer a different `model_class` or Task/subagent for Judge when the product allows (`high-reasoning` for Judge is typical). Personas count as a different *frame*; they do not replace execution ground truth for code.

## Stop conditions (Manager — hard logic)

Defaults for loops that adopt this contract (override in `loop.yaml` under `self_correcting:`):

| Control | Default | Rule |
|---|---|---|
| `max_revisions` | `3` | After the 3rd failed Judge verdict, **ESCALATE** — do not start a 4th automatic Builder cycle. |
| Quality threshold | All Judge checklist items **PASS** | No “mostly passing” / “good enough.” |
| Budget ceiling | Optional `max_minutes` / note cost | If the loop or host tracks spend/time and the ceiling is hit, **ESCALATE** immediately with what completed vs remains. |

Write stop checks into Manager behavior. Do not bury them only as soft prose the model can talk past.

On **ESCALATE**, give the user: revision history (what was tried), last Judge verdict, and a clear ask (decision, missing fact, or manual fix).

## Manager memory

Before sending REVISE feedback, scan prior Judge issues on this task. If the same specific issue failed twice with the same feedback, change the feedback (narrower, with evidence) or **ESCALATE** — do not repeat an identical retry.

## Stress tests (before trusting a new loop)

Document how the loop passes these, or run them deliberately when changing Judge/Manager logic:

1. **Unsolvable task** — Builder cannot meet the Judge bar. Manager must hit `max_revisions` and escalate (not spin).
2. **Confidently wrong** — Plausible but wrong deliverable. Judge + ground truth must FAIL or NEEDS_REVISION.
3. **Same-model blind spot** — Characteristic failure of the Builder model. Judge frame (persona / different class / checklist) must still catch it, or call out the residual risk.
4. **Cost runaway** — Worst-case path (max revisions × expensive calls) is acceptable, or a budget ceiling exists.

## Adoption

| Loop | Adopts contract? | Notes |
|---|---|---|
| `plan-and-implement` | Yes | Judge after implement; revise ≤ max |
| `tdd` | Yes | Suite is ground truth; anti-cheat + green attempts |
| `reproduce-and-fix` | Yes | Same as tdd for the fix cycle |
| `sar` | Yes | Acceptance checks = ground truth; repair budget |
| `adversarial-gate` | Yes | Rounds ≤ 3 already; verdict is Judge+Manager |
| `de-ai-ify` | Yes | Taxonomy + verify; re-spec budget |
| `migrate` | Yes | Checklist + verify; stop on unplanned breakage |
| `explain-codebase` | No | Optional cite-paths only |
| `swarm` / `use-the-loop` | Meta | Nested loops must honor their stops; prefer a Judge stage before ship |
| `dispatcher` | No | Router only |

When adding a new producing loop, set `self_correcting: true` in `loop.yaml`, point `loop.md` at this file, and name Builder / Judge / Manager phases (or equivalent).
