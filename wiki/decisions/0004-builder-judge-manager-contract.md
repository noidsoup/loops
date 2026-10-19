---
title: "0004: Builder, Judge, Manager contract for producing loops"
type: decision
summary: Loops that produce work separate building from judging, use outside ground truth, and stop after 3 failed revisions.
status: active
created: 2026-10-19
updated: 2026-10-19
last_verified: 2026-10-19
sources: ["PR #1", "commit de37b91", "commit 209fc9b", CHANGELOG.md, contracts/self-correcting.md, test/self-correcting-contract.test.js]
tags: [adr, quality]
---

# 0004: Builder, Judge, Manager contract for producing loops

Seven loops that ship work set `self_correcting: true` and follow `contracts/self-correcting.md`: a Builder produces, a Judge checks against real command output, a Manager decides deliver, revise or escalate, with a hard cap on revisions.

## Context

Agents judged their own work in the same context and called it done ("mostly passing"), or revised forever. PR #1 (merged 2026-07-19, release 0.1.4) introduced the contract to "separate produce from judge with structured handoffs, ground truth, and a hard max_revisions stop so agents escalate instead of looping forever" (commit `de37b91`).

## Decision

- Applies to `plan-and-implement`, `tdd`, `reproduce-and-fix`, `sar`, `adversarial-gate`, `de-ai-ify`, `migrate`. Meta loops (`swarm`, `use-the-loop`) honor nested escalations.
- Every such loop sets `self_correcting_max_revisions` (3) and its `loop.md` points at the contract. `test/self-correcting-contract.test.js` enforces both (`AGENTS.md` invariant 5).
- Skipped for typos, pure Q&A and map-only work (`explain-codebase`).

## Alternatives considered

- **Single-pass loops with a final self-review:** cheaper, but the same context rationalizes its own output.
- **Unlimited revisions:** no stop condition; the reason for the cap.

## Status

Active since 0.1.4. Copilot review on PR #1 led to aligning the YAML keys (commit `209fc9b`).

## Related

- [[self-correcting-contract]] · [[loop-catalog]]
