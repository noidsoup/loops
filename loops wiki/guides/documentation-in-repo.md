---
title: Documentation in the repo vs this wiki
type: guide
created: 2026-07-30
updated: 2026-07-30
tags: [documentation, onboarding]
status: active
---

# Documentation in the repo vs this wiki

This vault (**`loops wiki/`**) holds **compiled, linked knowledge** for humans and LLMs (entities, concepts, ADRs, guides). It does not replace every markdown file at the repo root.

## Canonical repo docs (live outside the vault)

| Location | Role |
|----------|------|
| `README.md` | Human install, catalog, companion pointer — ingested as [[readme-project-overview]] |
| `AGENTS.md` | Always-on agent index (bootstrap stub — fill in stack and invariants) |
| `AI_SESSION_MEMORY.md` | Dated session log — AI writes at close-out; see [[session-memory-in-wiki]] |
| `MEMORY.md` | Rolling two-section summary (current / previous session) |
| `docs/` | Deep docs — **markdown ingested** into `sources/`; originals **not deleted** |
| `CHANGELOG.md` | Version history (v0.1.4 self-correcting contract, model classes, emit fixes) |
| `contracts/` | Canonical self-correcting spec — concept page [[self-correcting-contract]] |
| `loops/<name>/loop.md` | Canonical loop definitions — catalog [[loop-catalog]] |
| `dispatcher/loop.md` | Canonical dispatcher — entity [[loops-dispatcher]] |

## Docs ingest (batch 2026-07-30)

| Source | Wiki page |
|--------|-----------|
| `README.md` | [[readme-project-overview]] |
| `docs/ai-retrieval.md` | [[docs-ai-retrieval]] |

Non-ingested but referenced: `examples/install-in-fresh-project.md` (covered by [[per-project-install]]), `personas/README.md` (covered by [[loop-personas]]).

## When to add to the wiki

- Cross-cutting **decisions** → `decisions/` (e.g. [[0001-python-sidecar-lancedb-retrieval]])
- **How-tos** that outgrow README → `guides/`
- **Systems and tools** (emit, LanceDB, dispatcher) → `entities/`
- **Patterns** (self-correcting, personas) → `concepts/`

## Related

- [[SCHEMA]]
- [[session-memory-in-wiki]]
- [[index]]
